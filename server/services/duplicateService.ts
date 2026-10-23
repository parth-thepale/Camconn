import { storage } from './storage.js';
import { DuplicateCandidate, DuplicateReview, Ticket } from '../types.js';

export class DuplicateService {
  /**
   * Deterministically find candidate duplicates for a given ticket
   */
  findCandidates(ticketId: string): DuplicateCandidate[] {
    const target = storage.getTicketById(ticketId);
    if (!target) return [];

    const allTickets = storage.getTickets().filter((t) => t.id !== target.id);
    const existingReviews = storage.getDuplicateReviews(target.id);
    const resolvedReviewPairs = new Set(
      existingReviews
        .filter((r) => r.state === 'separate_issue' || r.state === 'same_issue')
        .map((r) => (r.ticketId === target.id ? r.candidateTicketId : r.ticketId))
    );

    const candidates: DuplicateCandidate[] = [];
    const targetTokens = (target.title + ' ' + target.originalText + ' ' + (target.location.details || ''))
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);

    for (const ticket of allTickets) {
      // Exclude tickets already marked as separate_issue
      if (resolvedReviewPairs.has(ticket.id)) continue;

      let score = 0;
      const reasons: string[] = [];

      // 1. Same category
      if (ticket.category === target.category) {
        score += 35;
        reasons.push(`Same category (${target.category})`);
      }

      // 2. Same building
      if (
        ticket.location.building &&
        target.location.building &&
        ticket.location.building.toLowerCase() === target.location.building.toLowerCase()
      ) {
        score += 35;
        reasons.push(`Same building (${target.location.building})`);

        // Same floor or room
        if (
          ticket.location.floor &&
          target.location.floor &&
          ticket.location.floor.toLowerCase() === target.location.floor.toLowerCase()
        ) {
          score += 15;
          reasons.push(`Same floor (${target.location.floor})`);
        }
      }

      // 3. Keyword / description overlap
      const otherTokens = (ticket.title + ' ' + ticket.originalText).toLowerCase().split(/\W+/);
      const common = targetTokens.filter((t) => otherTokens.includes(t));
      if (common.length >= 2) {
        score += Math.min(25, common.length * 8);
        reasons.push(`Shared keywords: ${common.slice(0, 3).join(', ')}`);
      }

      // Temporal proximity (within 48 hours)
      const timeDiffHours =
        Math.abs(new Date(target.createdAt).getTime() - new Date(ticket.createdAt).getTime()) /
        (1000 * 3600);
      if (timeDiffHours <= 48) {
        score += 10;
        reasons.push(`Reported within ${Math.round(timeDiffHours)}h of each other`);
      }

      // Surface plausible candidates with score >= 45
      if (score >= 45) {
        candidates.push({
          ticketId: ticket.id,
          reference: ticket.reference,
          title: ticket.title,
          category: ticket.category,
          location: ticket.location,
          status: ticket.status,
          createdAt: ticket.createdAt,
          similarityScore: Math.min(100, score),
          reason: reasons.join('; '),
        });
      }
    }

    // Rank candidates by highest similarity
    return candidates.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * Human staff review decision: record review and link tickets safely without deleting
   */
  recordReview(params: {
    ticketId: string;
    candidateTicketId: string;
    decision: 'same_issue' | 'separate_issue' | 'deferred';
    reason: string;
    reviewerId: string;
    reviewerName: string;
  }): DuplicateReview {
    const ticket = storage.getTicketById(params.ticketId);
    const candidate = storage.getTicketById(params.candidateTicketId);

    if (!ticket || !candidate) {
      throw new Error('Both target ticket and candidate ticket must exist');
    }

    const review: DuplicateReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ticketId: params.ticketId,
      candidateTicketId: params.candidateTicketId,
      state: params.decision,
      reason: params.reason || `Staff decided ${params.decision.replace('_', ' ')}.`,
      reviewedBy: params.reviewerName,
      reviewedAt: new Date().toISOString(),
    };

    storage.recordDuplicateReview(review);

    // If marked as same underlying issue, link tickets safely
    if (params.decision === 'same_issue') {
      storage.updateTicket(ticket.id, {
        duplicateOf: candidate.reference,
      });

      storage.addEvent({
        id: `evt-${Date.now()}-dup1`,
        ticketId: ticket.id,
        type: 'DUPLICATE_LINK',
        actorId: params.reviewerId,
        actorName: params.reviewerName,
        actorRole: 'staff',
        note: `Linked as duplicate of ${candidate.reference}: ${review.reason}`,
        isInternal: false,
        createdAt: review.reviewedAt,
      });

      storage.addEvent({
        id: `evt-${Date.now()}-dup2`,
        ticketId: candidate.id,
        type: 'DUPLICATE_LINK',
        actorId: params.reviewerId,
        actorName: params.reviewerName,
        actorRole: 'staff',
        note: `Linked duplicate report ${ticket.reference} associated with this incident: ${review.reason}`,
        isInternal: false,
        createdAt: review.reviewedAt,
      });
    }

    return review;
  }
}

export const duplicateService = new DuplicateService();

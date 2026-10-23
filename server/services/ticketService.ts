import { storage } from './storage.js';
import {
  Ticket,
  TicketEvent,
  TicketStatus,
  Category,
  LocationData,
  STATUS_TRANSITIONS,
} from '../types.js';

export interface CreateTicketParams {
  createdBy: string;
  creatorName: string;
  originalText: string;
  title: string;
  summary: string;
  category: Category;
  location: LocationData;
  photoUrl?: string | null;
  routingSuggestion: string;
  routingReason: string;
  clarifications?: Array<{ question: string; answer: string }>;
}

export interface TransitionStatusParams {
  ticketId: string;
  toStatus: TicketStatus;
  actorId: string;
  actorName: string;
  actorRole: 'staff' | 'admin';
  note: string;
}

export interface AssignTicketParams {
  ticketId: string;
  assignedTo: string;
  actorId: string;
  actorName: string;
  actorRole: 'staff' | 'admin';
  note?: string;
}

export class TicketService {
  /**
   * Create a confirmed ticket with transaction-safe reference ID and initial event
   */
  createTicket(params: CreateTicketParams): Ticket {
    const id = `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const reference = storage.getNextReference();
    const now = new Date().toISOString();

    const ticket: Ticket = {
      id,
      reference,
      createdBy: params.createdBy,
      creatorName: params.creatorName || 'Student Reporter',
      originalText: params.originalText,
      title: params.title,
      summary: params.summary,
      category: params.category,
      location: params.location,
      status: 'Submitted',
      assignedTo: null,
      photoUrl: params.photoUrl || null,
      routingSuggestion: params.routingSuggestion,
      routingReason: params.routingReason,
      clarifications: params.clarifications || [],
      duplicateOf: null,
      hasDuplicateCandidates: false,
      createdAt: now,
      updatedAt: now,
    };

    const initialEvent: TicketEvent = {
      id: `evt-${Date.now()}-1`,
      ticketId: id,
      type: 'CREATED',
      toStatus: 'Submitted',
      actorId: params.createdBy,
      actorName: params.creatorName || 'Student Reporter',
      actorRole: 'student',
      note: 'Ticket submitted and queued for facilities triage.',
      isInternal: false,
      createdAt: now,
    };

    return storage.createTicket(ticket, initialEvent);
  }

  /**
   * Enforce finite state machine transitions and append chronological audit events
   */
  transitionStatus(params: TransitionStatusParams): { ticket: Ticket; event: TicketEvent } {
    const ticket = storage.getTicketById(params.ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${params.ticketId} not found`);
    }

    const currentStatus = ticket.status;
    const allowed = STATUS_TRANSITIONS[currentStatus];

    if (!allowed.includes(params.toStatus)) {
      throw new Error(
        `Illegal transition from '${currentStatus}' to '${params.toStatus}'. Allowed transitions: ${allowed.join(', ') || 'None (terminal state)'}`
      );
    }

    const now = new Date().toISOString();
    const updatedTicket = storage.updateTicket(ticket.id, {
      status: params.toStatus,
    });

    const event: TicketEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ticketId: ticket.id,
      type: 'STATUS_CHANGE',
      fromStatus: currentStatus,
      toStatus: params.toStatus,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      note: params.note || `Status changed from ${currentStatus} to ${params.toStatus}.`,
      isInternal: false,
      createdAt: now,
    };

    storage.addEvent(event);
    return { ticket: updatedTicket, event };
  }

  /**
   * Assign or reassign ticket to a maintenance technician
   */
  assignTicket(params: AssignTicketParams): { ticket: Ticket; event: TicketEvent } {
    const ticket = storage.getTicketById(params.ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${params.ticketId} not found`);
    }

    const oldStatus = ticket.status;
    let nextStatus = ticket.status;
    // Auto-advance Submitted or Acknowledged to Assigned
    if (oldStatus === 'Submitted' || oldStatus === 'Acknowledged') {
      nextStatus = 'Assigned';
    }

    const updatedTicket = storage.updateTicket(ticket.id, {
      assignedTo: params.assignedTo,
      status: nextStatus,
    });

    const now = new Date().toISOString();
    const event: TicketEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ticketId: ticket.id,
      type: 'ASSIGNMENT',
      fromStatus: oldStatus !== nextStatus ? oldStatus : undefined,
      toStatus: nextStatus,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      note: params.note || `Assigned to ${params.assignedTo}.`,
      isInternal: false,
      createdAt: now,
    };

    storage.addEvent(event);
    return { ticket: updatedTicket, event };
  }
}

export const ticketService = new TicketService();

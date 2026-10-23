import assert from 'node:assert/strict';
import { ticketService } from '../server/services/ticketService.js';
import { storage } from '../server/services/storage.js';
import { duplicateService } from '../server/services/duplicateService.js';

console.log('🧪 Starting CampusConnect Self-Check Test Suite...');

// Test 1: Ticket Creation and Safe Numbering
console.log('Test 1: Verify ticket creation and reference formatting');
const newTicket = ticketService.createTicket({
  createdBy: 'test-student-01',
  creatorName: 'Test Student',
  originalText: 'Severe water leak under washroom sink on 3rd floor CV Raman block.',
  title: 'Water leak under washroom sink',
  summary: 'Sink supply line leaking on 3rd floor washroom.',
  category: 'plumbing',
  location: {
    building: 'CV Raman Science Centre',
    floor: '3rd Floor',
    room: 'Washroom 302',
  },
  routingSuggestion: 'Facilities / Plumbing & Water Systems',
  routingReason: 'Matched plumbing keywords and washroom location.',
});

assert.ok(newTicket.id.startsWith('ticket-'), 'Ticket should have generated ID');
assert.match(newTicket.reference, /^CC-2026-\d{6}$/, 'Ticket reference must match CC-2026-000XXX format');
assert.equal(newTicket.status, 'Submitted', 'Initial status must be Submitted');

// Test 2: Persistence retrieval
console.log('Test 2: Verify ticket retrieval from storage');
const retrieved = storage.getTicketById(newTicket.id);
assert.ok(retrieved, 'Should retrieve ticket by ID');
assert.equal(retrieved.title, newTicket.title);

const events = storage.getEventsByTicketId(newTicket.id);
assert.equal(events.length, 1, 'Should have initial CREATED event');
assert.equal(events[0].type, 'CREATED');

// Test 3: Legal Status Transitions
console.log('Test 3: Verify legal status transitions');
const ackResult = ticketService.transitionStatus({
  ticketId: newTicket.id,
  toStatus: 'Acknowledged',
  actorId: 'staff-1',
  actorName: 'Triage Staff',
  actorRole: 'staff',
  note: 'Acknowledged by plumbing triage desk.',
});
assert.equal(ackResult.ticket.status, 'Acknowledged');

const assignResult = ticketService.assignTicket({
  ticketId: newTicket.id,
  assignedTo: 'Vikram Singh (Plumber)',
  actorId: 'staff-1',
  actorName: 'Triage Staff',
  actorRole: 'staff',
  note: 'Assigned Vikram to inspect leak.',
});
assert.equal(assignResult.ticket.status, 'Assigned');
assert.equal(assignResult.ticket.assignedTo, 'Vikram Singh (Plumber)');

const inProgResult = ticketService.transitionStatus({
  ticketId: newTicket.id,
  toStatus: 'In progress',
  actorId: 'staff-vikram',
  actorName: 'Vikram Singh',
  actorRole: 'staff',
  note: 'Replacing washers on cold water feed valve.',
});
assert.equal(inProgResult.ticket.status, 'In progress');

const resolveResult = ticketService.transitionStatus({
  ticketId: newTicket.id,
  toStatus: 'Resolved',
  actorId: 'staff-vikram',
  actorName: 'Vikram Singh',
  actorRole: 'staff',
  note: 'Replaced cracked connector pipe and tested water pressure for 15 minutes. Area is dry.',
});
assert.equal(resolveResult.ticket.status, 'Resolved');

// Test 4: Rejection of illegal transitions
console.log('Test 4: Verify rejection of illegal state transition');
assert.throws(
  () => {
    ticketService.transitionStatus({
      ticketId: newTicket.id,
      toStatus: 'Submitted', // Resolved cannot transition to Submitted
      actorId: 'staff-1',
      actorName: 'Triage Staff',
      actorRole: 'staff',
      note: 'Illegal revert attempt',
    });
  },
  /Illegal transition/,
  'Must reject transition from terminal state Resolved'
);

// Test 5: Duplicate Candidate Detection
console.log('Test 5: Verify duplicate candidate detection and human review linking');
// Create a second ticket in the same building and category
const secondTicket = ticketService.createTicket({
  createdBy: 'test-student-02',
  creatorName: 'Second Student',
  originalText: 'Water leaking all over the floor in 3rd floor washroom CV Raman centre.',
  title: 'Flooding in 3rd floor washroom',
  summary: 'Water on floor in washroom 302.',
  category: 'plumbing',
  location: {
    building: 'CV Raman Science Centre',
    floor: '3rd Floor',
    room: 'Washroom 302',
  },
  routingSuggestion: 'Facilities / Plumbing & Water Systems',
  routingReason: 'Matched plumbing keywords.',
});

const candidates = duplicateService.findCandidates(secondTicket.id);
assert.ok(candidates.length > 0, 'Should detect at least one candidate duplicate');
const topCandidate = candidates[0];
assert.ok(topCandidate.similarityScore >= 45, 'Similarity score should exceed threshold');

// Record review decision
const review = duplicateService.recordReview({
  ticketId: secondTicket.id,
  candidateTicketId: topCandidate.ticketId,
  decision: 'same_issue',
  reason: 'Same washroom leak reported by a second observer.',
  reviewerId: 'staff-lead',
  reviewerName: 'Facilities Lead',
});

assert.equal(review.state, 'same_issue');
const updatedSecondTicket = storage.getTicketById(secondTicket.id);
assert.equal(updatedSecondTicket?.duplicateOf, topCandidate.reference, 'Ticket should link to primary reference');

console.log('✅ All CampusConnect self-check tests passed successfully!');

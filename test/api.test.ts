import assert from 'node:assert/strict';
import { ticketService } from '../server/services/ticketService.js';
import { storage } from '../server/services/storage.js';
import { duplicateService } from '../server/services/duplicateService.js';
import { hashPassword, verifyPassword, createToken, verifyToken } from '../server/services/auth.js';
import { generateTechnicianDiagnosis, analyzeCampusClusters } from '../server/services/gemini.js';

console.log('🧪 Starting CampusConnect Comprehensive Test Suite...');

// Test 1: Authentication & Password Verification
console.log('Test 1: Verify crypto password hashing and token generation');
const password = 'StrongPassword123!';
const hashed = hashPassword(password);
assert.ok(verifyPassword(password, hashed), 'Password should verify against salt:hash');
assert.ok(!verifyPassword('WrongPassword', hashed), 'Wrong password must fail verification');

const token = createToken({
  id: 'usr-test-99',
  email: 'tester@campus.edu',
  name: 'Test Engineer',
  role: 'student',
});
const decoded = verifyToken(token);
assert.ok(decoded, 'Token should verify and decode successfully');
assert.equal(decoded.email, 'tester@campus.edu');
assert.equal(decoded.role, 'student');

// Test 2: Ticket Creation with Urgency & Priority Tiers
console.log('Test 2: Verify ticket creation with safety warning and priority tier');
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
  urgencyLevel: 'high',
  safetyWarning: 'Caution: Wet floor presents immediate slip hazard.',
  priorityTier: 'expedited_emergency',
});

assert.ok(newTicket.id.startsWith('ticket-'), 'Ticket should have generated ID');
assert.match(newTicket.reference, /^CC-2026-\d{6}$/, 'Ticket reference must match CC-2026-000XXX format');
assert.equal(newTicket.urgencyLevel, 'high');
assert.equal(newTicket.priorityTier, 'expedited_emergency');

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

const inProgResult = ticketService.transitionStatus({
  ticketId: newTicket.id,
  toStatus: 'In progress',
  actorId: 'staff-vikram',
  actorName: 'Vikram Singh',
  actorRole: 'staff',
  note: 'Replacing washers on cold water feed valve.',
});
assert.equal(inProgResult.ticket.status, 'In progress');

// Test 4: Rejection of illegal transitions
console.log('Test 4: Verify rejection of illegal state transition');
assert.throws(
  () => {
    ticketService.transitionStatus({
      ticketId: newTicket.id,
      toStatus: 'Submitted',
      actorId: 'staff-1',
      actorName: 'Triage Staff',
      actorRole: 'staff',
      note: 'Illegal revert attempt',
    });
  },
  /Illegal transition/,
  'Must reject transition from In progress to Submitted'
);

// Test 5: Secure Checkout & Payment Audit Trail
console.log('Test 5: Verify secure checkout session creation & receipt generation');
const session = storage.createCheckoutSession({
  id: 'chk-test-01',
  ticketId: newTicket.id,
  ticketReference: newTicket.reference,
  amount: 499,
  currency: 'INR',
  tier: 'expedited_emergency',
  status: 'completed',
  paymentMethod: 'CAMPUS_CARD (ending in 8821)',
  receiptHash: 'c7b5a10982df4321',
  paidAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
});

storage.updateTicket(newTicket.id, {
  paymentStatus: 'paid',
  checkoutReference: 'PAY-2026-881293',
});

const updatedTicket = storage.getTicketById(newTicket.id);
assert.equal(updatedTicket?.paymentStatus, 'paid');
assert.equal(updatedTicket?.checkoutReference, 'PAY-2026-881293');

// Test 6: AI Technician Diagnosis
console.log('Test 6: Verify AI Technician Diagnosis & Field Action Plan generation');
const diagnosis = await generateTechnicianDiagnosis({
  title: newTicket.title,
  summary: newTicket.summary,
  originalText: newTicket.originalText,
  category: newTicket.category,
  location: newTicket.location,
});

assert.ok(diagnosis.likelyRootCause.length > 5, 'Diagnosis should provide a technical root cause');
assert.ok(diagnosis.recommendedTools.length >= 2, 'Should recommend required tools');
assert.ok(diagnosis.actionPlanSteps.length >= 3, 'Should provide step-by-step action plan');

// Test 7: Campus Infrastructure Cluster Analysis
console.log('Test 7: Verify campus recurring cluster pattern analysis');
const clusters = await analyzeCampusClusters(storage.getTickets());
assert.ok(Array.isArray(clusters), 'Clusters should return an array');

console.log('✅ All CampusConnect backend tests passed successfully!');

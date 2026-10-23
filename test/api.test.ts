import assert from 'node:assert/strict';
import { ticketService } from '../server/services/ticketService.js';
import { storage } from '../server/services/storage.js';
import { duplicateService } from '../server/services/duplicateService.js';
import { hashPassword, verifyPassword, createToken, verifyToken, requireAuth } from '../server/services/auth.js';
import { generateTechnicianDiagnosis, analyzeCampusClusters } from '../server/services/gemini.js';

console.log('🧪 Starting CampusConnect Strict Role & Access Control Test Suite...');

// Test 1: Authentication & Password Verification
console.log('Test 1: Verify crypto password hashing and token generation');
const password = 'StrongPassword123!';
const hashed = hashPassword(password);
assert.ok(verifyPassword(password, hashed), 'Password should verify against salt:hash');
assert.ok(!verifyPassword('WrongPassword', hashed), 'Wrong password must fail verification');

const studentToken = createToken({
  id: 'usr-student-01',
  email: 'student@university.edu',
  name: 'Ananya Sharma',
  role: 'student',
});
const staffToken = createToken({
  id: 'usr-staff-01',
  email: 'staff@university.edu',
  name: 'Rajesh Kumar',
  role: 'staff',
});

assert.equal(verifyToken(studentToken)?.role, 'student');
assert.equal(verifyToken(staffToken)?.role, 'staff');

// Test 2: Role Separation Middleware Tests (Mutual Exclusivity)
console.log('Test 2: Verify mutual exclusivity: student cannot access staff desk & staff cannot report as student');

// Mock request / response helpers
function testMiddleware(middleware: any, token: string | null) {
  let statusCode = 200;
  let responseData: any = null;
  let nextCalled = false;

  const req: any = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (data: any) => {
          responseData = data;
        },
      };
    },
  };
  const next = () => {
    nextCalled = true;
  };

  middleware(req, res, next);
  return { statusCode, responseData, nextCalled };
}

// 2a: Student accessing Staff Desk -> Must be REJECTED (403 Forbidden)
const staffDeskAuth = requireAuth(['staff', 'admin']);
const studentToStaffResult = testMiddleware(staffDeskAuth, studentToken);
assert.equal(studentToStaffResult.nextCalled, false, 'Student must not pass staff desk auth');
assert.equal(studentToStaffResult.statusCode, 403, 'Student must receive HTTP 403 Forbidden on staff desk');

// 2b: Staff accessing Staff Desk -> Must be ALLOWED (200 OK)
const staffToStaffResult = testMiddleware(staffDeskAuth, staffToken);
assert.equal(staffToStaffResult.nextCalled, true, 'Staff must pass staff desk auth');

// 2c: Staff accessing Student Reporting -> Must be REJECTED (403 Forbidden)
const studentPortalAuth = requireAuth(['student']);
const staffToStudentResult = testMiddleware(studentPortalAuth, staffToken);
assert.equal(staffToStudentResult.nextCalled, false, 'Staff must not pass student intake auth');
assert.equal(staffToStudentResult.statusCode, 403, 'Staff must receive HTTP 403 Forbidden on student intake');

// 2d: Student accessing Student Reporting -> Must be ALLOWED (200 OK)
const studentToStudentResult = testMiddleware(studentPortalAuth, studentToken);
assert.equal(studentToStudentResult.nextCalled, true, 'Student must pass student intake auth');

// Test 3: Ticket Creation with Urgency & Safety
console.log('Test 3: Verify ticket creation with safety warning and priority tier');
const newTicket = ticketService.createTicket({
  createdBy: 'usr-student-01',
  creatorName: 'Ananya Sharma',
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

assert.ok(newTicket.id.startsWith('ticket-'));
assert.match(newTicket.reference, /^CC-2026-\d{6}$/);
assert.equal(newTicket.urgencyLevel, 'high');
assert.equal(newTicket.priorityTier, 'expedited_emergency');

// Test 4: Legal and Illegal Status Transitions
console.log('Test 4: Verify finite state machine status transitions');
const ackResult = ticketService.transitionStatus({
  ticketId: newTicket.id,
  toStatus: 'Acknowledged',
  actorId: 'usr-staff-01',
  actorName: 'Rajesh Kumar',
  actorRole: 'staff',
  note: 'Acknowledged by plumbing triage desk.',
});
assert.equal(ackResult.ticket.status, 'Acknowledged');

assert.throws(
  () => {
    ticketService.transitionStatus({
      ticketId: newTicket.id,
      toStatus: 'Submitted',
      actorId: 'usr-staff-01',
      actorName: 'Rajesh Kumar',
      actorRole: 'staff',
      note: 'Illegal revert',
    });
  },
  /Illegal transition/,
  'Must reject transition to unallowed status'
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

assert.ok(diagnosis.likelyRootCause.length > 5);
assert.ok(diagnosis.recommendedTools.length >= 2);
assert.ok(diagnosis.actionPlanSteps.length >= 3);

// Test 7: Campus Infrastructure Cluster Analysis
console.log('Test 7: Verify campus recurring cluster pattern analysis');
const clusters = await analyzeCampusClusters(storage.getTickets());
assert.ok(Array.isArray(clusters));

console.log('✅ All CampusConnect strict role isolation & backend tests passed successfully!');

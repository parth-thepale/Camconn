import fs from 'fs';
import path from 'path';
import {
  Ticket,
  TicketEvent,
  DuplicateReview,
  RoutingRule,
  User,
  CheckoutSession,
} from '../types.js';
import { DEFAULT_ROUTING_RULES } from '../config.js';
import { hashPassword } from './auth.js';

interface DatabaseSchema {
  tickets: Ticket[];
  ticketEvents: TicketEvent[];
  duplicateReviews: DuplicateReview[];
  routingRules: RoutingRule[];
  users: User[];
  checkoutSessions: CheckoutSession[];
  nextTicketNumber: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function getDefaultSeedData(): DatabaseSchema {
  return {
    nextTicketNumber: 105,
    routingRules: DEFAULT_ROUTING_RULES,
    duplicateReviews: [],
    checkoutSessions: [],
    users: [
      {
        id: 'usr-student-01',
        email: 'student@campus.edu',
        passwordHash: hashPassword('password123'),
        name: 'Ananya Sharma',
        role: 'student',
        department: 'Computer Science',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-staff-01',
        email: 'staff@campus.edu',
        passwordHash: hashPassword('password123'),
        name: 'Rajesh Kumar',
        role: 'staff',
        department: 'Facilities & Plumbing',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-admin-01',
        email: 'admin@campus.edu',
        passwordHash: hashPassword('password123'),
        name: 'Dr. Vikram Seth',
        role: 'admin',
        department: 'Campus Facilities Administration',
        createdAt: new Date().toISOString(),
      },
    ],
    tickets: [
      {
        id: 'ticket-101',
        reference: 'CC-2026-000101',
        createdBy: 'usr-student-01',
        creatorName: 'Ananya Sharma (CS)',
        originalText: 'Water is dripping from the washroom ceiling on the 2nd floor right outside Lab 3. The floor is getting slippery and dangerous.',
        title: 'Water leaking from washroom ceiling',
        summary: 'Dripping ceiling water creating slip hazard outside Lab 3 on 2nd floor.',
        category: 'plumbing',
        location: {
          building: 'CV Raman Science Centre',
          floor: '2nd Floor',
          room: 'Outside Lab 3 washroom',
        },
        status: 'Submitted',
        assignedTo: null,
        routingSuggestion: 'Facilities / Plumbing & Water Systems',
        routingReason: 'Campus Maintenance Policy Section 4.1: matched ceiling drip, washroom, and water hazard.',
        clarifications: [
          { question: 'Is the water actively flooding or just a steady drip?', answer: 'It is a steady drip creating a puddle.' },
        ],
        duplicateOf: null,
        hasDuplicateCandidates: true,
        urgencyLevel: 'medium',
        safetyWarning: 'Caution: Wet floor presents immediate slip and fall hazard.',
        detectedLanguage: 'English',
        paymentStatus: 'waived',
        priorityTier: 'standard',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'ticket-102',
        reference: 'CC-2026-000102',
        createdBy: 'usr-student-02',
        creatorName: 'Rohit Verma (EE)',
        originalText: 'The main switchboard in lecture hall 204 buzzes whenever the projector is turned on. Two tube lights near the back keep flickering violently with sparks.',
        title: 'Buzzing switchboard and flickering lights in LH 204',
        summary: 'Electrical noise in main distribution board with sparking tube lights during projector operation.',
        category: 'electricity',
        location: {
          building: 'Aryabhata Academic Block',
          floor: '2nd Floor',
          room: 'Lecture Hall 204',
        },
        status: 'In progress',
        assignedTo: 'Rajesh Kumar (Senior Electrician)',
        routingSuggestion: 'Estate Office / Electrical & Power Maintenance',
        routingReason: 'Campus Electrical Safety Standard S-12: reports buzzing switchboard and sparks.',
        clarifications: [],
        duplicateOf: null,
        hasDuplicateCandidates: false,
        urgencyLevel: 'high',
        safetyWarning: 'Hazard Alert: Electrical sparking in switchboard. Disconnect projector immediately.',
        detectedLanguage: 'English',
        paymentStatus: 'paid',
        checkoutReference: 'CHK-2026-00921',
        priorityTier: 'expedited_emergency',
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'ticket-103',
        reference: 'CC-2026-000103',
        createdBy: 'usr-student-03',
        creatorName: 'Priya Nair (BT)',
        originalText: 'The dry waste and organic waste bins near the canteen exit are completely overflowing since yesterday noon. Attracting flies.',
        title: 'Overflowing waste receptacles near Canteen',
        summary: 'Waste bins at canteen exit over capacity and attracting flies.',
        category: 'cleanliness',
        location: {
          building: 'Student Dining Hall & Canteen',
          floor: 'Ground Floor',
          zone: 'Canteen Exit Corridor',
        },
        status: 'Acknowledged',
        assignedTo: null,
        routingSuggestion: 'Sanitation & Housekeeping Services',
        routingReason: 'Campus Hygiene & Waste Protocol H-03: bin overflow and food residue accumulation.',
        clarifications: [],
        duplicateOf: null,
        hasDuplicateCandidates: false,
        urgencyLevel: 'low',
        safetyWarning: null,
        detectedLanguage: 'English',
        paymentStatus: 'waived',
        priorityTier: 'standard',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'ticket-104',
        reference: 'CC-2026-000104',
        createdBy: 'usr-student-04',
        creatorName: 'Aditya Gupta (ME)',
        originalText: 'Wi-Fi keeps disconnecting every two minutes in the quiet study zone of Central Library 1st floor. Error says IP configuration failure.',
        title: 'Library 1st floor Wi-Fi DHCP disconnection',
        summary: 'Frequent Wi-Fi drops and IP lease failures in Central Library quiet study area.',
        category: 'internet_connectivity',
        location: {
          building: 'Central Library',
          floor: '1st Floor',
          zone: 'East Quiet Study Section',
        },
        status: 'Assigned',
        assignedTo: 'Sunita Rao (Network Administrator)',
        routingSuggestion: 'IT Services / Campus Network & Wi-Fi Operations',
        routingReason: 'IT Infrastructure Service Charter IT-08: reports wireless disconnectivity and IP lease faults.',
        clarifications: [
          { question: 'Is the internet problem affecting one device or multiple devices?', answer: 'Multiple laptop users in this row are experiencing it.' },
        ],
        duplicateOf: null,
        hasDuplicateCandidates: false,
        urgencyLevel: 'medium',
        safetyWarning: null,
        detectedLanguage: 'English',
        paymentStatus: 'waived',
        priorityTier: 'standard',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
    ticketEvents: [
      {
        id: 'evt-101-1',
        ticketId: 'ticket-101',
        type: 'CREATED',
        toStatus: 'Submitted',
        actorId: 'usr-student-01',
        actorName: 'Ananya Sharma',
        actorRole: 'student',
        note: 'Ticket submitted via CampusConnect intelligent reporting.',
        isInternal: false,
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'evt-102-1',
        ticketId: 'ticket-102',
        type: 'CREATED',
        toStatus: 'Submitted',
        actorId: 'usr-student-02',
        actorName: 'Rohit Verma',
        actorRole: 'student',
        note: 'Emergency ticket created with attached location details.',
        isInternal: false,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: 'evt-102-p',
        ticketId: 'ticket-102',
        type: 'PAYMENT_CHECKOUT',
        actorId: 'usr-student-02',
        actorName: 'Rohit Verma',
        actorRole: 'student',
        note: 'Secure checkout completed for Priority Emergency Dispatch (Ref: CHK-2026-00921).',
        isInternal: false,
        createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
      },
      {
        id: 'evt-102-2',
        ticketId: 'ticket-102',
        type: 'ASSIGNMENT',
        fromStatus: 'Submitted',
        toStatus: 'Assigned',
        actorId: 'usr-admin-01',
        actorName: 'Chief Warden Office',
        actorRole: 'admin',
        note: 'Assigned to Rajesh Kumar for urgent electrical inspection.',
        isInternal: false,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: 'evt-102-3',
        ticketId: 'ticket-102',
        type: 'STATUS_CHANGE',
        fromStatus: 'Assigned',
        toStatus: 'In progress',
        actorId: 'usr-staff-01',
        actorName: 'Rajesh Kumar',
        actorRole: 'staff',
        note: 'Electrician on site with multimeter and replacement choke units.',
        isInternal: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  };
}

class StorageService {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.warn('Unable to create .data dir on disk, operating with in-memory persistence:', e);
      }
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.tickets && parsed.ticketEvents && parsed.users) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[Storage] Could not parse existing DB file, reinitializing default seed:', err);
    }
    const fresh = getDefaultSeedData();
    this.save(fresh);
    return fresh;
  }

  private save(data: DatabaseSchema = this.db) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.warn('[Storage] Failed writing database file to disk:', err);
    }
  }

  // Users
  getUserByEmail(email: string): User | undefined {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  createUser(user: User): User {
    this.db.users.push(user);
    this.save();
    return user;
  }

  // Tickets
  getTickets(): Ticket[] {
    return this.db.tickets;
  }

  getTicketById(id: string): Ticket | undefined {
    return this.db.tickets.find((t) => t.id === id || t.reference === id);
  }

  getTicketsByStudent(studentId: string): Ticket[] {
    return this.db.tickets.filter((t) => t.createdBy === studentId);
  }

  createTicket(ticket: Ticket, initialEvent: TicketEvent): Ticket {
    this.db.tickets.unshift(ticket);
    this.db.ticketEvents.push(initialEvent);
    this.save();
    return ticket;
  }

  updateTicket(ticketId: string, updates: Partial<Ticket>): Ticket {
    const idx = this.db.tickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }
    this.db.tickets[idx] = {
      ...this.db.tickets[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.db.tickets[idx];
  }

  getNextReference(): string {
    const num = this.db.nextTicketNumber++;
    this.save();
    return `CC-2026-${String(num).padStart(6, '0')}`;
  }

  // Events
  getEventsByTicketId(ticketId: string): TicketEvent[] {
    return this.db.ticketEvents
      .filter((e) => e.ticketId === ticketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addEvent(event: TicketEvent): TicketEvent {
    this.db.ticketEvents.push(event);
    this.save();
    return event;
  }

  // Duplicate Reviews
  getDuplicateReviews(ticketId: string): DuplicateReview[] {
    return this.db.duplicateReviews.filter(
      (r) => r.ticketId === ticketId || r.candidateTicketId === ticketId
    );
  }

  recordDuplicateReview(review: DuplicateReview): DuplicateReview {
    this.db.duplicateReviews.push(review);
    this.save();
    return review;
  }

  // Checkout Sessions
  createCheckoutSession(session: CheckoutSession): CheckoutSession {
    this.db.checkoutSessions.push(session);
    this.save();
    return session;
  }

  getCheckoutSession(id: string): CheckoutSession | undefined {
    return this.db.checkoutSessions.find((s) => s.id === id);
  }

  updateCheckoutSession(id: string, updates: Partial<CheckoutSession>): CheckoutSession {
    const idx = this.db.checkoutSessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Checkout session not found');
    this.db.checkoutSessions[idx] = { ...this.db.checkoutSessions[idx], ...updates };
    this.save();
    return this.db.checkoutSessions[idx];
  }

  // Routing Rules
  getRoutingRules(): RoutingRule[] {
    return this.db.routingRules;
  }

  // Reset database helper for tests/demo
  resetSeed(): void {
    this.db = getDefaultSeedData();
    this.save();
  }
}

export const storage = new StorageService();

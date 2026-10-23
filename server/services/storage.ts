import fs from 'fs';
import path from 'path';
import { Ticket, TicketEvent, DuplicateReview, RoutingRule } from '../types.js';
import { DEFAULT_ROUTING_RULES } from '../config.js';

interface DatabaseSchema {
  tickets: Ticket[];
  ticketEvents: TicketEvent[];
  duplicateReviews: DuplicateReview[];
  routingRules: RoutingRule[];
  nextTicketNumber: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_DATA: DatabaseSchema = {
  nextTicketNumber: 105,
  routingRules: DEFAULT_ROUTING_RULES,
  duplicateReviews: [],
  tickets: [
    {
      id: 'ticket-101',
      reference: 'CC-2026-000101',
      createdBy: 'student-ananya',
      creatorName: 'Ananya Sharma (CS-2024)',
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
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'ticket-102',
      reference: 'CC-2026-000102',
      createdBy: 'student-rohit',
      creatorName: 'Rohit Verma (EE-2023)',
      originalText: 'The main switchboard in lecture hall 204 buzzes whenever the projector is turned on. Two tube lights near the back keep flickering violently.',
      title: 'Buzzing switchboard and flickering lights in LH 204',
      summary: 'Electrical noise in main distribution board and flickering lighting during projector operation in LH 204.',
      category: 'electricity',
      location: {
        building: 'Aryabhata Academic Block',
        floor: '2nd Floor',
        room: 'Lecture Hall 204',
      },
      status: 'In progress',
      assignedTo: 'Rajesh Kumar (Senior Electrician)',
      routingSuggestion: 'Estate Office / Electrical & Power Maintenance',
      routingReason: 'Campus Electrical Safety Standard S-12: reports buzzing switchboard and flickering fixtures.',
      clarifications: [],
      duplicateOf: null,
      hasDuplicateCandidates: false,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'ticket-103',
      reference: 'CC-2026-000103',
      createdBy: 'student-priya',
      creatorName: 'Priya Nair (BT-2025)',
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
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'ticket-104',
      reference: 'CC-2026-000104',
      createdBy: 'student-aditya',
      creatorName: 'Aditya Gupta (ME-2024)',
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
      actorId: 'student-ananya',
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
      actorId: 'student-rohit',
      actorName: 'Rohit Verma',
      actorRole: 'student',
      note: 'Ticket created with attached location details.',
      isInternal: false,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'evt-102-2',
      ticketId: 'ticket-102',
      type: 'ASSIGNMENT',
      fromStatus: 'Submitted',
      toStatus: 'Assigned',
      actorId: 'staff-admin',
      actorName: 'Chief Warden Office',
      actorRole: 'staff',
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
      actorId: 'staff-rajesh',
      actorName: 'Rajesh Kumar',
      actorRole: 'staff',
      note: 'Electrician on site with multimeter and replacement choke units.',
      isInternal: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'evt-103-1',
      ticketId: 'ticket-103',
      type: 'CREATED',
      toStatus: 'Submitted',
      actorId: 'student-priya',
      actorName: 'Priya Nair',
      actorRole: 'student',
      note: 'Cleanliness report submitted.',
      isInternal: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'evt-103-2',
      ticketId: 'ticket-103',
      type: 'STATUS_CHANGE',
      fromStatus: 'Submitted',
      toStatus: 'Acknowledged',
      actorId: 'staff-sanitation',
      actorName: 'Sanitation Supervisor',
      actorRole: 'staff',
      note: 'Scheduled for afternoon waste clearance round.',
      isInternal: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'evt-104-1',
      ticketId: 'ticket-104',
      type: 'CREATED',
      toStatus: 'Submitted',
      actorId: 'student-aditya',
      actorName: 'Aditya Gupta',
      actorRole: 'student',
      note: 'Ticket submitted.',
      isInternal: false,
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 'evt-104-2',
      ticketId: 'ticket-104',
      type: 'ASSIGNMENT',
      fromStatus: 'Submitted',
      toStatus: 'Assigned',
      actorId: 'staff-admin',
      actorName: 'IT Helpdesk Lead',
      actorRole: 'staff',
      note: 'Assigned to Sunita Rao (Network Administrator) to check AP-04 DHCP pool.',
      isInternal: false,
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ],
};

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
        if (parsed.tickets && parsed.ticketEvents) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[Storage] Could not parse existing DB file, reinitializing default seed:', err);
    }
    const fresh = JSON.parse(JSON.stringify(INITIAL_DATA));
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

  // Routing Rules
  getRoutingRules(): RoutingRule[] {
    return this.db.routingRules;
  }

  // Reset database helper for tests/demo
  resetSeed(): void {
    this.db = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
  }
}

export const storage = new StorageService();

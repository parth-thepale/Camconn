import dotenv from 'dotenv';
import { RoutingRule } from './types.js';

dotenv.config();

export const PORT = Number(process.env.PORT) || 8080;
export const NODE_ENV = process.env.NODE_ENV || 'production';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

// Official campus routing guidelines
export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  {
    id: 'rule-plumbing-01',
    category: 'plumbing',
    departmentLabel: 'Facilities / Plumbing & Water Systems',
    sourceLabel: 'Campus Facilities Maintenance Standard Operating Procedure Sec 4.1',
    matchingTerms: ['leak', 'pipe', 'tap', 'washroom', 'water', 'drain', 'toilet', 'flush', 'sink', 'sewage'],
    enabled: true,
    isDemo: false,
  },
  {
    id: 'rule-electricity-01',
    category: 'electricity',
    departmentLabel: 'Estate Office / Electrical & Power Maintenance',
    sourceLabel: 'Campus Electrical Engineering Standard Safety Protocol S-12',
    matchingTerms: ['light', 'power', 'switch', 'spark', 'socket', 'plug', 'fan', 'air conditioner', 'ac', 'blackout', 'breaker'],
    enabled: true,
    isDemo: false,
  },
  {
    id: 'rule-cleanliness-01',
    category: 'cleanliness',
    departmentLabel: 'Sanitation & Housekeeping Services',
    sourceLabel: 'Campus Environmental Hygiene & Waste Management Protocol H-03',
    matchingTerms: ['garbage', 'trash', 'dustbin', 'cleaning', 'stain', 'spill', 'odour', 'dirt', 'litter', 'pest'],
    enabled: true,
    isDemo: false,
  },
  {
    id: 'rule-internet-01',
    category: 'internet_connectivity',
    departmentLabel: 'IT Services / Campus Network & Wi-Fi Operations',
    sourceLabel: 'University Network Infrastructure & Telecommunications Service Charter IT-08',
    matchingTerms: ['wifi', 'wi-fi', 'internet', 'network', 'lan', 'ethernet', 'connection', 'router', 'access point', 'portal', 'signal'],
    enabled: true,
    isDemo: false,
  },
];

export const CAMPUS_LOCATIONS = [
  'Aryabhata Academic Block',
  'CV Raman Science Centre',
  'Central Library',
  'Hostel Block A (Boys)',
  'Hostel Block B (Girls)',
  'Student Dining Hall & Canteen',
  'Sports Complex & Gymnasium',
  'Administrative Bhavan',
];

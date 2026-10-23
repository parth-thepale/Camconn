import dotenv from 'dotenv';
import { RoutingRule } from './types.js';

dotenv.config();

export const PORT = Number(process.env.PORT) || 8080;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

// Replaceable demo routing rules as required by DevArambh PRD
export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  {
    id: 'rule-plumbing-01',
    category: 'plumbing',
    departmentLabel: 'Facilities / Plumbing & Water Systems',
    sourceLabel: 'Campus Maintenance Policy Section 4.1 (Demo Guideline)',
    matchingTerms: ['leak', 'pipe', 'tap', 'washroom', 'water', 'drain', 'toilet', 'flush', 'sink', 'sewage'],
    enabled: true,
    isDemo: true,
  },
  {
    id: 'rule-electricity-01',
    category: 'electricity',
    departmentLabel: 'Estate Office / Electrical & Power Maintenance',
    sourceLabel: 'Campus Electrical Safety Standard S-12 (Demo Guideline)',
    matchingTerms: ['light', 'power', 'switch', 'spark', 'socket', 'plug', 'fan', 'air conditioner', 'ac', 'blackout', 'breaker'],
    enabled: true,
    isDemo: true,
  },
  {
    id: 'rule-cleanliness-01',
    category: 'cleanliness',
    departmentLabel: 'Sanitation & Housekeeping Services',
    sourceLabel: 'Campus Hygiene & Waste Protocol H-03 (Demo Guideline)',
    matchingTerms: ['garbage', 'trash', 'dustbin', 'cleaning', 'stain', 'spill', 'odour', 'dirt', 'litter', 'pest'],
    enabled: true,
    isDemo: true,
  },
  {
    id: 'rule-internet-01',
    category: 'internet_connectivity',
    departmentLabel: 'IT Services / Campus Network & Wi-Fi Operations',
    sourceLabel: 'IT Infrastructure Service Charter IT-08 (Demo Guideline)',
    matchingTerms: ['wifi', 'wi-fi', 'internet', 'network', 'lan', 'ethernet', 'connection', 'router', 'access point', 'portal', 'signal'],
    enabled: true,
    isDemo: true,
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

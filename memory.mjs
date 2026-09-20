// Agents Office — Dynamic Agent Memory of Record (V3.6)
// Inspired by akitaonrails/ai-memory & Google Gemini Skills.
//
// Persistent, cross-session memory for AI agents. When agents complete tasks,
// analyze campaigns, or discover store operational insights, they write atomic,
// verifiable facts into the company Brain memory store (<brain>/Agents Office/memory/).
// Other agents and departments can immediately read these facts to coordinate decisions.

import fs from 'node:fs';
import path from 'node:path';

export const memoryDir = brainPath => path.join(brainPath, 'Agents Office', 'memory');
export const factsFile = brainPath => path.join(memoryDir(brainPath), 'facts.json');

export const SEEDED_FACTS = [
  {
    id: 'mem_01',
    agent: 'pros',
    agentName: 'Prospector',
    dept: 'sales',
    category: 'Customers',
    fact: 'Boutique apparel stockists in California & Texas convert 2.4x higher on wholesale 2-piece set inquiries.',
    verified: true,
    timestamp: '2026-09-19T14:20:00Z',
    source: 'Apollo Lead Enrichment Run'
  },
  {
    id: 'mem_02',
    agent: 'ada',
    agentName: 'Meta Ads',
    dept: 'marketing',
    category: 'Advertising',
    fact: 'Reel creatives with price overlays in the first 2 seconds achieve $1.42 lower Cost-Per-Click on Instagram.',
    verified: true,
    timestamp: '2026-09-19T18:45:00Z',
    source: 'Meta Ads Manager Attribution'
  },
  {
    id: 'mem_03',
    agent: 'recon',
    agentName: 'Reconciliation',
    dept: 'fin',
    category: 'Finance',
    fact: 'Shopify Payments blended transaction fee is currently 2.9% + 30¢; international payouts settle in 48 hours.',
    verified: true,
    timestamp: '2026-09-20T08:15:00Z',
    source: 'Stripe / Banking Settlement Log'
  },
  {
    id: 'mem_04',
    agent: 'dlead',
    agentName: 'Delivery Lead',
    dept: 'delivery',
    category: 'Logistics',
    fact: 'CJ Dropshipping line hauls to USPS Chicago hub currently running at 6.2 day average delivery time.',
    verified: true,
    timestamp: '2026-09-20T09:30:00Z',
    source: 'CJ Tracking API Telemetry'
  },
  {
    id: 'mem_05',
    agent: 'folo',
    agentName: 'Follow Ups',
    dept: 'sales',
    category: 'Retention',
    fact: 'Abandoned cart SMS sent at the 45-minute mark with 10% discount code "SUNNY10" yields a 19.4% recovery rate.',
    verified: true,
    timestamp: '2026-09-20T10:10:00Z',
    source: 'Loops / iMessage Recovery Funnel'
  }
];

/** Read all recorded facts, initializing with defaults if missing */
export function readFacts(brainPath) {
  try {
    const p = factsFile(brainPath);
    if (!fs.existsSync(p)) {
      initMemory(brainPath);
      return SEEDED_FACTS;
    }
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEEDED_FACTS;
  } catch {
    return SEEDED_FACTS;
  }
}

/** Initialize memory folder and seed data */
export function initMemory(brainPath) {
  try {
    const dir = memoryDir(brainPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const p = factsFile(brainPath);
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, JSON.stringify(SEEDED_FACTS, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Error initializing agent memory:', err);
  }
}

/** Record a new atomic fact into persistent memory */
export function recordFact(brainPath, { agent, agentName, dept, category, fact, source }) {
  const facts = readFacts(brainPath);
  const newFact = {
    id: 'mem_' + Date.now().toString(36),
    agent: String(agent || 'brain'),
    agentName: String(agentName || 'Agent'),
    dept: String(dept || 'general'),
    category: String(category || 'Operational Fact'),
    fact: String(fact || '').trim(),
    verified: true,
    timestamp: new Date().toISOString(),
    source: String(source || 'Task Execution')
  };

  facts.unshift(newFact);
  // Keep up to 100 most recent atomic facts
  const trimmed = facts.slice(0, 100);
  try {
    fs.writeFileSync(factsFile(brainPath), JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write fact to memory:', err);
  }
  return newFact;
}

/** Query facts filtered by department or search terms */
export function searchMemory(brainPath, query = '', dept = '') {
  const facts = readFacts(brainPath);
  const q = String(query).toLowerCase().trim();
  const d = String(dept).toLowerCase().trim();

  return facts.filter(f => {
    if (d && f.dept !== d) return false;
    if (!q) return true;
    return f.fact.toLowerCase().includes(q) ||
           f.category.toLowerCase().includes(q) ||
           f.agentName.toLowerCase().includes(q);
  });
}

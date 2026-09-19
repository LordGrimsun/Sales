// Vercel Serverless API Handler for Sales OS AI
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { askLLM, detectProvider, getProviderInfo } from '../llm.mjs';
import { DEPTS, DEPT_KEYS } from '../src/data.js';
import { normModel, modelName, MODEL_KEYS, DEFAULT_MODEL, EFFORT_KEYS } from '../src/models.js';

const ROOT = process.cwd();
const DATA_DIR = path.join(os.tmpdir(), 'sales-os-data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

function readJSON(p, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function loadTasks() {
  return readJSON(TASKS_FILE, []);
}

function saveTasks(list) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(TASKS_FILE, JSON.stringify(list, null, 2));
  } catch (e) {
    console.warn('saveTasks error:', e.message);
  }
}

const baseCfg = readJSON(path.join(ROOT, 'office.config.json'), { name: 'Sales', model: 'sonnet' });
const baseAgents = readJSON(path.join(ROOT, 'office.agents.json'), { agents: [] });
const AGENTS = baseAgents.agents || [];

function json(res, code, body) {
  res.setHeader('content-type', 'application/json');
  res.statusCode = code;
  res.end(JSON.stringify(body));
}

function getBody(req) {
  return new Promise((resolve) => {
    let s = '';
    req.on('data', d => { s += d; });
    req.on('end', () => {
      try { resolve(s ? JSON.parse(s) : {}); } catch { resolve({}); }
    });
  });
}

function leadOf(dept) {
  return AGENTS.find(a => a.department === dept && a.lead) || AGENTS.find(a => a.department === dept);
}

function parseJSON(text) {
  const s = String(text || '').replace(/```json|```/g, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) {
    try { return JSON.parse(s.slice(a, b + 1)); } catch {}
  }
  return {};
}

export default async function handler(req, res) {
  // enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const host = req.headers.host || 'localhost';
  const rawUrl = new URL(req.url, `http://${host}`);
  let pathname = rawUrl.pathname;

  const qId = rawUrl.searchParams.get('id');
  const qAct = rawUrl.searchParams.get('action');
  const qRid = rawUrl.searchParams.get('routineId');
  if (qId) {
    pathname = `/api/tasks/${qId}` + (qAct ? `/${qAct}` : '');
  } else if (qRid) {
    pathname = `/api/routines/${qRid}`;
  } else if (pathname.includes('[...') || !pathname.startsWith('/api')) {
    const xMatched = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
    if (xMatched) pathname = new URL(xMatched, `http://${host}`).pathname;
    if (pathname.includes('[...')) {
      const sub = rawUrl.searchParams.get('...path') || rawUrl.searchParams.get('path');
      const prefix = pathname.split('/[...')[0] || '/api';
      if (sub) pathname = prefix + '/' + sub.replace(/^\/+/, '');
    }
  }
  const url = rawUrl;

  try {
    // 1. Health
    if (pathname === '/api/health') {
      const pInfo = getProviderInfo();
      const hasComposio = !!(process.env.COMPOSIO_API_KEY && process.env.COMPOSIO_API_KEY.length > 5);
      const hasShopify = !!(process.env.SHOPIFY_ACCESS_TOKEN && process.env.SHOPIFY_ACCESS_TOKEN.length > 5);
      return json(res, 200, {
        ok: true,
        version: '3.2.1-sales-pro',
        backend: pInfo.provider,
        providerConfigured: pInfo.isConfigured,
        composioConfigured: hasComposio,
        shopifyConfigured: hasShopify,
        model: baseCfg.model || 'sonnet',
        modelName: modelName(baseCfg.model || 'sonnet'),
        models: MODEL_KEYS,
        efforts: EFFORT_KEYS,
        name: baseCfg.name || 'Sunnyeora',
        brain: 'Sunnyeora Brain',
        notes: 35,
        depts: DEPT_KEYS,
        agents: AGENTS.map(a => ({
          id: a.id,
          name: a.name,
          role: a.role,
          does: a.does,
          tools: a.tools || [],
          department: a.department,
          lead: !!a.lead,
        })),
        tools: true,
        teams: { enabled: true, max: 4 },
        browser: { enabled: false },
        mcp: { servers: [] },
      });
    }

    // 2. Agents list
    if (pathname === '/api/agents') {
      return json(res, 200, {
        agents: AGENTS.map(a => ({
          id: a.id,
          name: a.name,
          role: a.role,
          does: a.does,
          tools: a.tools || [],
          department: a.department,
          lead: !!a.lead,
        })),
        problems: [],
        files: [],
      });
    }

    // 3. Brain graph
    if (pathname === '/api/brain') {
      let braingraph = { notes: 35, nodes: [], links: [], floor: [] };
      try {
        const bgPath = path.join(ROOT, 'src', 'braingraph.js');
        if (fs.existsSync(bgPath)) {
          const content = fs.readFileSync(bgPath, 'utf8');
          const match = content.match(/export\s+(?:default|const\s+BRAIN\s*=)\s*(\{[\s\S]+\});?/);
          if (match) braingraph = JSON.parse(match[1]);
        }
      } catch {}
      return json(res, 200, braingraph);
    }

    // 4. Skills
    if (pathname === '/api/skills') {
      return json(res, 200, {
        count: 3,
        shipped: 3,
        brain: 0,
        problems: [],
        skills: [
          { name: 'proposal', description: 'How we write client proposals and quotes' },
          { name: 'client-reply', description: 'Rules for client communications and tone' },
          { name: 'house-style', description: 'Company voice and style rules' },
        ],
      });
    }

    // 5. Usage
    if (pathname === '/api/usage') {
      return json(res, 200, {
        source: 'sales-os',
        session: { percent: 12 },
        week: { percent: 18 },
        window: { tokens: 14200, runs: 6 },
      });
    }

    // 6. MCP / Platform Connectors
    if (pathname === '/api/mcp') {
      const platformServers = [
        { key: 'notion', name: 'Notion', status: 'connected', allowed: true, depts: ['marketing', 'emails', 'sales', 'ops', 'fin', 'delivery'] },
        { key: 'gmail', name: 'Gmail', status: 'connected', allowed: true, depts: ['emails', 'sales', 'ops', 'fin', 'delivery'] },
        { key: 'slack', name: 'Slack', status: 'connected', allowed: true, depts: ['marketing', 'emails', 'sales', 'ops', 'fin', 'delivery'] },
        { key: 'apollo', name: 'Apollo', status: 'connected', allowed: true, depts: ['sales'] },
        { key: 'fullenrich', name: 'FullEnrich', status: 'connected', allowed: true, depts: ['sales'] },
        { key: 'stripe', name: 'Stripe', status: 'connected', allowed: true, depts: ['fin'] },
        { key: 'xero', name: 'Xero', status: 'connected', allowed: true, depts: ['fin'] },
        { key: 'meta', name: 'Meta Ads', status: 'connected', allowed: true, depts: ['marketing'] },
        { key: 'canva', name: 'Canva', status: 'connected', allowed: true, depts: ['marketing', 'delivery'] },
        { key: 'loops', name: 'Loops', status: 'connected', allowed: true, depts: ['marketing'] },
        { key: 'beehiiv', name: 'Beehiiv', status: 'connected', allowed: true, depts: ['marketing'] },
        { key: 'pandadoc', name: 'PandaDoc', status: 'connected', allowed: true, depts: ['ops', 'delivery'] },
        { key: 'imessage', name: 'iMessage', status: 'connected', allowed: true, depts: ['sales'] },
        { key: 'clarity', name: 'Clarity', status: 'connected', allowed: true, depts: ['marketing'] },
        { key: 'hyperframes', name: 'HyperFrames', status: 'connected', allowed: true, depts: ['marketing'] },
        { key: 'chrome', name: 'Chrome', status: 'connected', allowed: true, depts: ['marketing', 'emails', 'sales', 'ops', 'fin', 'delivery'] },
      ];
      return json(res, 200, { servers: platformServers, tools: true, browser: { enabled: true } });
    }

    // 7. Tasks GET / POST
    if (pathname === '/api/tasks') {
      if (req.method === 'GET') {
        return json(res, 200, loadTasks());
      }
      if (req.method === 'POST') {
        const b = await getBody(req);
        const { dept, text } = b;
        if (!dept || !text) return json(res, 400, { error: 'dept and text required' });

        const pool = AGENTS.filter(a => a.department === dept);
        const lead = leadOf(dept) || pool[0];

        // Route using LLM
        let chosenAgent = lead.id;
        let title = text.slice(0, 70);
        let why = `Assigned to ${lead.name} based on request.`;
        let plan = ['Analyze requirements', 'Execute deliverable', 'Review against company notes'];

        try {
          const sys = `You are the AI task router for ${baseCfg.name || 'Sales'}. Return ONLY valid JSON in format: {"agent":"<id>","title":"<clean title max 70 chars>","why":"<short rationale>","plan":["step 1","step 2"]}`;
          const userPrompt = `Department: ${dept}\nAgents:\n${pool.map(a => `${a.id} - ${a.name} (${a.role}): ${a.does}`).join('\n')}\n\nTask request: "${text}"`;
          const resp = await askLLM(sys, userPrompt, { maxTokens: 400 });
          const parsed = parseJSON(resp.text);
          if (parsed.agent && pool.some(a => a.id === parsed.agent)) chosenAgent = parsed.agent;
          if (parsed.title) title = String(parsed.title).slice(0, 80);
          if (parsed.why) why = String(parsed.why);
          if (Array.isArray(parsed.plan)) plan = parsed.plan.slice(0, 4).map(String);
        } catch (e) {
          console.warn('AI routing fallback:', e.message);
        }

        const task = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          dept,
          agent: chosenAgent,
          title,
          text: String(text).trim(),
          plan,
          why,
          state: 'next',
          addedAt: Date.now(),
          by: 'you',
        };

        const list = loadTasks();
        list.push(task);
        saveTasks(list);
        return json(res, 200, task);
      }
    }

    // 8. Task Run / Revise
    const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)(?:\/(run|revise|approve|reject))?$/);
    if (taskMatch) {
      const taskId = taskMatch[1];
      const action = taskMatch[2];
      const list = loadTasks();
      const body = (req.method === 'POST') ? await getBody(req) : {};
      let task = list.find(t => t.id === taskId);

      if (!task && req.method !== 'DELETE') {
        task = {
          id: taskId,
          dept: body.dept || 'sales',
          agent: body.agent || 'lexi',
          title: body.title || body.text || 'Sales deliverable',
          text: body.text || body.title || 'Execute sales deliverable',
          state: 'next',
          addedAt: Date.now(),
          by: 'you',
        };
        list.push(task);
      }

      if (req.method === 'DELETE') {
        saveTasks(list.filter(t => t.id !== taskId));
        return json(res, 200, { ok: true });
      }

      if (req.method === 'POST' && (action === 'run' || action === 'revise')) {
        const feedback = body.feedback;
        const agent = AGENTS.find(a => a.id === task.agent) || AGENTS[0];

        task.state = 'doing';
        task.startedAt = Date.now();
        saveTasks(list);

        try {
          const sys = `You are ${agent.name}, ${agent.role} in the ${task.dept.toUpperCase()} department at ${baseCfg.name || 'Sales'}.\n` +
            `${agent.does || ''}\n` +
            `Produce the finished, professional deliverable directly in clean markdown. Be concise, actionable, and thorough. Output ONLY the deliverable content itself. Never output role recaps, persona bullet points, or thinking steps.`;
          const userPrompt = `Task: ${task.title}\nRequest details: ${task.text}` +
            (feedback ? `\n\nOwner requested revision: "${feedback}"\nPrevious version:\n${task.result || ''}` : '');

          const resp = await askLLM(sys, userPrompt, { maxTokens: 2500 });
          task.state = 'done';
          task.doneAt = Date.now();
          task.result = resp.text;
          task.error = false;
          task.modelUsed = resp.modelId;
        } catch (e) {
          task.state = 'done';
          task.doneAt = Date.now();
          task.result = `Execution note: ${e.message}`;
          task.error = true;
        }

        saveTasks(list);
        return json(res, 200, task);
      }
    }

    // 9. Chat with Agent
    if (pathname === '/api/chat' && req.method === 'POST') {
      const { agent: agentId, text, history = [] } = await getBody(req);
      if (!agentId || !text) return json(res, 400, { error: 'agent and text required' });

      const agent = AGENTS.find(a => a.id === agentId) || AGENTS[0];
      const deptName = agent.department?.toUpperCase() || 'SALES';

      const sys = `You are ${agent.name}, ${agent.role} in ${deptName} at ${baseCfg.name || 'Sales'}.\n` +
        `Your responsibility: ${agent.does || ''}\n` +
        `Tone: sharp, competent, proactive, direct. Speak in first person as the agent sitting at your desk in the command centre. Always give real, helpful sales domain answers. Speak directly to the user — do NOT include persona notes, bullet lists of your instructions, or thinking steps.`;

      const messages = history.map(m => `${m.who === 'user' ? 'User' : agent.name}: ${m.text}`).join('\n') + `\nUser: ${text}`;
      const resp = await askLLM(sys, messages, { maxTokens: 1000 });

      return json(res, 200, {
        reply: resp.text,
        read: [],
        tools: resp.tools || [],
        interview: false,
      });
    }

    // 10. Routines GET / POST
    if (pathname === '/api/routines') {
      return json(res, 200, []);
    }

    return json(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('API Error:', err);
    return json(res, 500, { error: err.message });
  }
}

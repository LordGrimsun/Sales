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
let AGENTS = baseAgents.agents || [];
try {
  const brainAgents = readJSON(path.join(ROOT, 'brain', 'Agents Office', 'agents.json'), {});
  if (Array.isArray(brainAgents.agents)) {
    for (const ba of brainAgents.agents) {
      const idx = AGENTS.findIndex(a => a.id === ba.id);
      if (idx >= 0) {
        AGENTS[idx] = { ...AGENTS[idx], ...ba };
      }
    }
  }
} catch {}

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
        shopifyStore: process.env.SHOPIFY_STORE_URL || process.env.SHOPIFY_SHOP_DOMAIN || baseCfg.store || 'sunnyeora.myshopify.com',
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
        let plan = ['Analyze requirements', 'Execute deliverable', 'Review against brand standards'];

        try {
          const sys = `You are the AI task router for ${baseCfg.name || 'Sunnyeora'}. Return ONLY valid JSON in format: {"agent":"agent_id","title":"Concise Actionable Title","why":"short rationale","plan":["step 1","step 2"]}`;
          const userPrompt = `Department: ${dept}\nAgents:\n${pool.map(a => `${a.id} - ${a.name} (${a.role}): ${a.does}`).join('\n')}\n\nTask request: "${text}"`;
          const resp = await askLLM(sys, userPrompt, { maxTokens: 400 });
          const parsed = parseJSON(resp.text);
          if (parsed.agent && pool.some(a => a.id === parsed.agent)) chosenAgent = parsed.agent;
          if (parsed.title && !parsed.title.includes('<')) title = String(parsed.title).slice(0, 80);
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
          title: body.title || body.text || 'Marketing & Sales deliverable',
          text: body.text || body.title || 'Execute deliverable',
          state: 'next',
          addedAt: Date.now(),
          by: 'you',
        };
        list.push(task);
      } else if (task && body.text) {
        task.text = body.text;
        if (body.title) task.title = body.title;
        if (body.agent) task.agent = body.agent;
        if (body.dept) task.dept = body.dept;
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
          const sys = `You are ${agent.name}, ${agent.role} in the ${task.dept.toUpperCase()} department at ${baseCfg.name || 'Sunnyeora'} (eCommerce store: sunnyeora.myshopify.com).\n` +
            `${agent.does || ''}\n` +
            (agent.brief ? `Standing instructions: ${agent.brief}\n` : '') +
            `Produce the finished, professional, publication-ready deliverable directly in clean markdown. Be concise, actionable, and thorough. Output ONLY the deliverable content itself. Never output role recaps, persona bullet points, or thinking steps.`;
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
      if (req.method === 'GET') {
        const routinesData = readJSON(path.join(ROOT, 'brain', 'Agents Office', 'routines.json'), { routines: [] });
        return json(res, 200, {
          routines: routinesData.routines || [
            {
              id: 'abandoned-cart-revival',
              dept: 'sales',
              agent: 'folo',
              title: 'Review stalled checkouts and generate recovery outreach',
              text: 'Review recent abandoned checkouts and shopping bags. Draft helpful, stylish follow-up recovery emails offering customer sizing help and the 10% discount code SUNNY10.',
              when: { kind: 'daily', at: '10:00' },
              needsOk: true,
              paused: false
            },
            {
              id: 'weekly-sales-review',
              dept: 'sales',
              agent: 'lexi',
              title: 'Weekly conversion and sales performance summary',
              text: 'Review weekly store order trends, best-selling product categories (dresses, knitwear, suits), average order value, and plan conversion targets for the coming week.',
              when: { kind: 'weekly', days: [1], at: '09:00' },
              needsOk: true,
              paused: false
            }
          ],
          depts: ['emails', 'fin', 'sales'],
          path: 'brain/Agents Office/routines.json',
          problems: []
        });
      }
      if (req.method === 'POST') {
        const b = await getBody(req);
        if (b.dept === 'marketing' || b.dept === 'ops' || b.dept === 'delivery') {
          return json(res, 400, { error: `Routines come to ${b.dept} in a later release. This release: Emails, Accounting and Sales.` });
        }
        return json(res, 200, { ok: true, routine: b });
      }
    }

    // 11. Winning Products Catalog (GET)
    if (pathname === '/api/products' && req.method === 'GET') {
      const storeUrl = (process.env.SHOPIFY_STORE_URL || process.env.SHOPIFY_SHOP_DOMAIN || 'sunnyeora.myshopify.com')
        .replace(/^https?:\/\//, '').replace(/\/+$/, '');
      try {
        const r = await fetch(`https://${storeUrl}/products.json?limit=50`);
        if (r.ok) {
          const d = await r.json();
          if (d && Array.isArray(d.products) && d.products.length > 0) {
            return json(res, 200, {
              ok: true,
              store: storeUrl,
              total: d.products.length,
              products: d.products.map(p => ({
                id: String(p.id),
                name: p.title,
                shortName: p.title.length > 35 ? p.title.slice(0, 35) + '...' : p.title,
                handle: p.handle,
                category: p.product_type || 'Fashion & Apparel',
                retailPrice: p.variants?.[0]?.price || '0',
                compareAtPrice: p.variants?.[0]?.compare_at_price || '',
                vendor: p.vendor || 'Sunnyeora',
                images: p.images?.map(i => i.src) || [],
                url: `https://${storeUrl}/products/${p.handle}`
              }))
            });
          }
        }
      } catch (e) {
        console.warn('Dynamic fetch products fallback:', e.message);
      }
      return json(res, 200, {
        ok: true,
        store: storeUrl,
        total: WINNING_PRODUCTS.length,
        products: WINNING_PRODUCTS,
      });
    }

    // 12. Push Product to Shopify Admin (POST)
    if (pathname === '/api/products/sync' && req.method === 'POST') {
      const body = await getBody(req);
      const prodId = body.productId || body.id;
      const prod = WINNING_PRODUCTS.find(p => p.id === prodId) || WINNING_PRODUCTS[0];
      const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN || body.shopifyToken;
      const storeUrl = (process.env.SHOPIFY_STORE_URL || process.env.SHOPIFY_SHOP_DOMAIN || 'sunnyeora.myshopify.com')
        .replace(/^https?:\/\//, '').replace(/\/+$/, '');

      if (shopifyToken && shopifyToken.length > 5) {
        try {
          const shopifyRes = await fetch(`https://${storeUrl}/admin/api/2024-01/products.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyToken,
            },
            body: JSON.stringify({
              product: {
                title: prod.name,
                body_html: prod.shopifyHtml,
                vendor: 'Sunnyeora',
                product_type: prod.category,
                tags: `dropshipping, fashion, authentic, ${prod.categorySlug}`,
                variants: [
                  {
                    price: String(prod.retailPrice),
                    compare_at_price: String(prod.compareAtPrice),
                    inventory_management: null,
                    requires_shipping: true,
                  }
                ]
              }
            })
          });
          const data = await shopifyRes.json();
          if (shopifyRes.ok && data.product) {
            return json(res, 200, {
              ok: true,
              live: true,
              productId: data.product.id,
              title: data.product.title,
              adminUrl: `https://${storeUrl}/admin/products/${data.product.id}`,
              message: `Successfully listed ${prod.name} on ${storeUrl}!`
            });
          }
          const errDetail = (data && data.errors) ? (typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors)) : 'Shopify API returned error';
          return json(res, 200, {
            ok: true,
            staged: true,
            productId: prod.id,
            title: prod.name,
            adminUrl: `https://${storeUrl}/admin/products`,
            message: `Product staged for ${storeUrl}. (Shopify API note: ${errDetail}).`
          });
        } catch (e) {
          return json(res, 200, {
            ok: true,
            staged: true,
            productId: prod.id,
            title: prod.name,
            adminUrl: `https://${storeUrl}/admin/products`,
            message: `Product staged for ${storeUrl}. Ready to paste into Shopify Admin!`
          });
        }
      }

      return json(res, 200, {
        ok: true,
        staged: true,
        productId: prod.id,
        title: prod.name,
        adminUrl: `https://${storeUrl}/admin/products`,
        message: `Product staged for ${storeUrl}. Ready to paste into Shopify Admin!`
      });
    }

    return json(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('API Error:', err);
    return json(res, 500, { error: err.message });
  }
}

const WINNING_PRODUCTS = [
  {
    id: '9039031304389',
    name: "Women's Thick Knitted Pullover Sweater Loose Fit Round Neck Casual Top",
    shortName: 'Thick Knitted Pullover',
    category: 'Sweaters & Knits',
    categorySlug: 'knitwear',
    tag: '#1 BESTSELLER KNIT',
    retailPrice: 48.99,
    compareAtPrice: 89.99,
    cogsPrice: 13.20,
    estCac: 14.00,
    stripeFee: 1.72,
    netProfit: 20.07,
    netMargin: '41.0%',
    supplierUrl: 'https://sunnyeora.myshopify.com/products/womens-thick-knitted-pullover-sweater-loose-fit-round-neck-casual-all-match-top-for-autumn-winter',
    rating: 4.9,
    shopifyHtml: `<h2>The Ultimate Coziest Winter Pullover</h2>\n<p>Stay effortlessly warm and stylish with the <b>Sunnyeora Thick Knitted Pullover Sweater</b>. Sculpted with a relaxed drop-shoulder cut, breathable thermal knit, and ultra-soft feel that never scratches.</p>\n<h3>Key Highlights:</h3>\n<ul>\n  <li><b>Cloud-Soft Thermal Knit:</b> Luxurious warmth without heaviness.</li>\n  <li><b>Drop-Shoulder Silhouette:</b> Flattering, relaxed drape for any body shape.</li>\n  <li><b>All-Match Versatility:</b> Pairs effortlessly with trousers, leggings, or skirts.</li>\n</ul>\n<p>Ships via tracked air mail (7–10 days). 30-day satisfaction guarantee.</p>`
  },
  {
    id: '9039031763141',
    name: "Ruffled Solid Color Pleated Lapel Blazer Women's Casual Suit Jacket",
    shortName: 'Ruffled Pleated Lapel Blazer',
    category: 'Jackets & Outerwear',
    categorySlug: 'jackets',
    tag: 'ELEVATED LUXURY CHIC',
    retailPrice: 64.99,
    compareAtPrice: 119.99,
    cogsPrice: 18.50,
    estCac: 18.00,
    stripeFee: 2.25,
    netProfit: 26.24,
    netMargin: '40.4%',
    supplierUrl: 'https://sunnyeora.myshopify.com/products/ruffled-jacket-solid-color-pleated-lapel-blazer-womens-fashion-casual-printed-suit-jacket-office-wear-clothing',
    rating: 4.9,
    shopifyHtml: `<h2>Sophistication Meets Modern Office & Evening Wear</h2>\n<p>Make a bold, elegant statement with the <b>Sunnyeora Ruffled Pleated Lapel Blazer</b>. Featuring unique architectural ruffled lapel detailing and a tailored waistline that flatters effortlessly.</p>\n<h3>Features:</h3>\n<ul>\n  <li><b>Architectural Lapel Design:</b> Unique pleated pleats add couture flair.</li>\n  <li><b>Premium Structured Fabric:</b> Wrinkle-resistant with structured shoulders.</li>\n  <li><b>Day-to-Night Chic:</b> Elevates denim for brunch or trousers for formal meetings.</li>\n</ul>\n<p>Tracked worldwide delivery. Hassle-free exchanges.</p>`
  },
  {
    id: '9039031075013',
    name: "2pcs Long-Sleeved Suits Loose V-Neck Top & High Waist Wide Leg Pants",
    shortName: '2pcs Wide Leg Suit Set',
    category: 'Suits & Coordinates',
    categorySlug: 'suits',
    tag: 'VIRAL 2-PIECE SET',
    retailPrice: 54.99,
    compareAtPrice: 98.00,
    cogsPrice: 15.80,
    estCac: 15.00,
    stripeFee: 1.89,
    netProfit: 22.30,
    netMargin: '40.6%',
    supplierUrl: 'https://sunnyeora.myshopify.com/products/2pcs-long-sleeved-suits-loose-v-neck-long-top-and-high-waist-wide-leg-pants-with-pockets-womens-clothing',
    rating: 4.9,
    shopifyHtml: `<h2>Effortless Elegance in One Matching Set</h2>\n<p>Say goodbye to morning outfit stress. The <b>Sunnyeora 2-Piece Loose V-Neck Set</b> delivers effortless chic with high-waist pleated wide leg pants (with deep pockets!) and a flowing draped top.</p>\n<h3>Highlights:</h3>\n<ul>\n  <li><b>Functional Deep Pockets:</b> Securely holds smartphone and essentials.</li>\n  <li><b>High-Elastic Comfort Waist:</b> Sits comfortably without digging in.</li>\n  <li><b>Draped Breathable Fabric:</b> Liquid movement that elongates legs.</li>\n</ul>\n<p>Fast tracked air shipping included.</p>`
  },
  {
    id: '9039031697605',
    name: "Chic Split Knitted Dress With Buttons Design Winter V-Neck Fleece Maxi Dress",
    shortName: 'Chic Split Knitted Maxi Dress',
    category: 'Dresses & Gowns',
    categorySlug: 'dresses',
    tag: 'COZY WINTER GLAMOUR',
    retailPrice: 69.99,
    compareAtPrice: 129.99,
    cogsPrice: 19.50,
    estCac: 19.00,
    stripeFee: 2.38,
    netProfit: 29.11,
    netMargin: '41.6%',
    supplierUrl: 'https://sunnyeora.myshopify.com/products/chic-split-knitted-dress-with-buttons-design-winter-v-neck-fleece-maxi-dresses-evening-party-club-fashion-womens-clothing',
    rating: 4.8,
    shopifyHtml: `<h2>Warmth Meets Siren Silhouette</h2>\n<p>Turn heads without freezing. The <b>Sunnyeora Chic Split Knitted Dress</b> combines warm fleece lining with elegant button accents and a graceful leg split.</p>\n<p>Fast tracked shipping (7-10 days).</p>`
  }
];


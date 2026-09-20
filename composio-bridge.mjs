// composio-bridge.mjs — Real tool execution bridge for Sunnyeora Command Centre
// Covers all 13 active Composio integrations across all 35 agents:
// 1. GitHub
// 2. Gmail
// 3. Google Calendar
// 4. Google Drive
// 5. Google Docs
// 6. Google Sheets
// 7. Google Maps
// 8. Slack
// 9. Notion
// 10. Canva
// 11. Canva MCP
// 12. Shopify
// 13. Beehiiv

let composioInstance = null;
let activeSession = null;
const USER_ID = process.env.COMPOSIO_USER_ID || 'sunnyeora_store_owner';

// Complete 13 platform triggers mapping
export const ALL_CONNECTED_PLATFORMS = [
  {
    name: 'Facebook / Meta Ads',
    slug: 'facebook',
    keywords: ['meta', 'facebook', 'fb', 'fb ads', 'meta ads', 'ad set', 'ad campaign', 'roas', 'page', 'social campaign'],
    depts: ['marketing', 'sales', 'delivery'],
    sampleTool: 'FACEBOOK_LIST_MANAGED_PAGES',
    icon: '📱',
    roleSummary: 'Autonomous Meta & Facebook Ads management, campaigns, and page feeds'
  },
  {
    name: 'Gmail',
    slug: 'gmail',
    keywords: ['email', 'emails', 'inbox', 'unread', 'mail', 'cmail', 'imail', 'vmail', 'kmail', 'gmail', 'elead', 'customer care'],
    depts: ['emails', 'sales', 'ops', 'fin'],
    sampleTool: 'GMAIL_CREATE_EMAIL_DRAFT',
    icon: '✉️',
    roleSummary: 'Customer replies, tracking queries, order status triage'
  },
  {
    name: 'Canva',
    slug: 'canva',
    keywords: ['canva', 'design', 'banner', 'graphic', 'poster', 'creative', 'visual', 'ad set', 'vid', 'thumbnail', 'tiktok', 'reels', 'hook'],
    depts: ['marketing', 'delivery', 'sales'],
    sampleTool: 'CANVA_POST_DESIGNS',
    icon: '🎨',
    roleSummary: 'Dynamic TikTok, Reels, ad creatives, and store hero banners'
  },
  {
    name: 'Canva MCP',
    slug: 'canva_mcp',
    keywords: ['canva mcp', 'template design', 'design template', 'batch graphic'],
    depts: ['marketing', 'delivery'],
    sampleTool: 'CANVA_POST_DESIGNS',
    icon: '🖌️',
    roleSummary: 'Direct MCP template generation for catalog banners'
  },
  {
    name: 'Shopify',
    slug: 'shopify',
    keywords: ['shopify', 'order', 'orders', 'product', 'products', 'inventory', 'storefront', 'sunnyeora', 'fulfill', 'checkout', 'sku'],
    depts: ['ops', 'delivery', 'sales', 'fin'],
    sampleTool: 'SHOPIFY_QUERY_SHOP',
    icon: '🛍️',
    roleSummary: 'Live orders, products, inventory sync on sunnyeora.myshopify.com'
  },
  {
    name: 'Slack',
    slug: 'slack',
    keywords: ['slack', 'channel', 'broadcast', 'alert', 'team ping', 'notify squad', 'squad message'],
    depts: ['emails', 'sales', 'marketing', 'ops', 'fin', 'delivery'],
    sampleTool: 'SLACK_SEND_MESSAGE',
    icon: '💬',
    roleSummary: 'Squad alerts, order notifications, executive briefings'
  },
  {
    name: 'Notion',
    slug: 'notion',
    keywords: ['notion', 'sop', 'knowledge base', 'wiki', 'notes database', 'playbook', 'supplier directory'],
    depts: ['emails', 'sales', 'marketing', 'ops', 'fin', 'delivery'],
    sampleTool: 'NOTION_SEARCH_NOTION_PAGE',
    icon: '📑',
    roleSummary: 'Persistent memory, winning product swipe file, SOPs'
  },
  {
    name: 'GitHub',
    slug: 'github',
    keywords: ['github', 'repo', 'issue', 'issues', 'pr', 'pull request', 'commit', 'branch', 'codebase', 'repository'],
    depts: ['ops', 'delivery'],
    sampleTool: 'GITHUB_LIST_REPOSITORY_ISSUES',
    icon: '🐙',
    roleSummary: 'Platform automations, code tracking, deployment commits'
  },
  {
    name: 'Google Calendar',
    slug: 'googlecalendar',
    keywords: ['calendar', 'gcal', 'meeting', 'event', 'appointment', 'schedule call', 'supplier meeting', 'call'],
    depts: ['emails', 'sales', 'delivery'],
    sampleTool: 'GOOGLECALENDAR_LIST_EVENTS',
    icon: '📅',
    roleSummary: 'Wholesale client calls, supplier check-ins, routine scheduling'
  },
  {
    name: 'Google Drive',
    slug: 'googledrive',
    keywords: ['drive', 'gdrive', 'folder', 'upload file', 'shared drive', 'cloud drive', 'backup assets'],
    depts: ['ops', 'delivery', 'fin'],
    sampleTool: 'GOOGLEDRIVE_LIST_FILES',
    icon: '📁',
    roleSummary: 'Asset cloud storage, product photography backups, supplier catalogs'
  },
  {
    name: 'Google Docs',
    slug: 'googledocs',
    keywords: ['doc', 'docs', 'google doc', 'document', 'proposal doc', 'contract document'],
    depts: ['ops', 'sales', 'delivery'],
    sampleTool: 'GOOGLEDOCS_GET_DOCUMENT',
    icon: '📄',
    roleSummary: 'Live contract drafting, vendor agreements, buyer pitch docs'
  },
  {
    name: 'Google Sheets',
    slug: 'googlesheets',
    keywords: ['sheet', 'sheets', 'spreadsheet', 'google sheets', 'ledger', 'p&l', 'reconciliation', 'row', 'cells'],
    depts: ['fin', 'ops'],
    sampleTool: 'GOOGLESHEETS_GET_SPREADSHEET_VALUES',
    icon: '📊',
    roleSummary: 'Cash ledger, CJ supplier costs, profit margin tracking'
  },
  {
    name: 'Google Maps',
    slug: 'googlemaps',
    keywords: ['maps', 'google maps', 'route', 'shipping route', 'distance', 'delivery zone', 'courier location', 'transit address'],
    depts: ['delivery', 'ops'],
    sampleTool: 'GOOGLEMAPS_GEOCODE',
    icon: '🗺️',
    roleSummary: 'Fulfillment routing, international carrier zone checks'
  },
  {
    name: 'Beehiiv',
    slug: 'beehiiv',
    keywords: ['beehiiv', 'newsletter', 'subscribers', 'publication', 'broadcast', 'email campaign', 'subscriber list'],
    depts: ['marketing'],
    sampleTool: 'BEEHIIV_GET_ALL_PUBLICATIONS',
    icon: '🐝',
    roleSummary: 'Sunnyeora weekly VIP newsletter & dropshipping subscriber blasts'
  }
];

export async function getComposioSession() {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) return null;

  if (activeSession) return activeSession;

  try {
    const { Composio } = await import('@composio/core');
    composioInstance = new Composio({ apiKey });
    activeSession = await composioInstance.create(USER_ID, {
      manageConnections: true,
    });
    return activeSession;
  } catch (err) {
    console.warn('[Composio Bridge] Session init notice:', err.message);
    return null;
  }
}

/**
 * Execute real Composio tool if task requests or matches one of the connected apps
 */
export async function executeComposioTool(taskText, dept, agent) {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    return {
      executed: false,
      reason: 'NO_KEY',
      note: 'Composio API key not set in environment. Running standard AI synthesis.'
    };
  }

  const textLower = String(taskText || '').toLowerCase();
  const matchedTrigger = ALL_CONNECTED_PLATFORMS.find(t =>
    t.keywords.some(k => textLower.includes(k)) || (t.depts.includes(dept) && textLower.includes(t.slug))
  );

  const session = await getComposioSession();
  if (!session) {
    return {
      executed: false,
      reason: 'SESSION_FAILED',
      note: 'Could not initialize Composio session with provided key.'
    };
  }

  try {
    let toolToRun = null;

    // Direct platform mappings with department-aware intent priority
    if (dept === 'emails') {
      if (textLower.includes('check') || textLower.includes('read') || textLower.includes('fetch') || textLower.includes('inbox') || textLower.includes('unread')) {
        toolToRun = 'GMAIL_FETCH_EMAILS';
      } else {
        toolToRun = 'GMAIL_CREATE_EMAIL_DRAFT';
      }
    } else if (textLower.includes('slack') || textLower.includes('broadcast') || textLower.includes('squad alert') || textLower.includes('notify squad')) {
      toolToRun = 'SLACK_SEND_MESSAGE';
    } else if (textLower.includes('email') || textLower.includes('mail') || textLower.includes('draft') || textLower.includes('inbox')) {
      if (textLower.includes('check') || textLower.includes('read') || textLower.includes('fetch')) {
        toolToRun = 'GMAIL_FETCH_EMAILS';
      } else {
        toolToRun = 'GMAIL_CREATE_EMAIL_DRAFT';
      }
    } else if (textLower.includes('canva') || textLower.includes('design') || textLower.includes('creative') || textLower.includes('banner') || textLower.includes('poster') || textLower.includes('tiktok') || textLower.includes('reels')) {
      toolToRun = 'CANVA_POST_DESIGNS';
    } else if (textLower.includes('facebook') || textLower.includes('meta') || textLower.includes('ad set') || textLower.includes('roas')) {
      toolToRun = 'FACEBOOK_LIST_MANAGED_PAGES';
    } else if (textLower.includes('shopify') || textLower.includes('order') || textLower.includes('inventory') || textLower.includes('sku')) {
      toolToRun = 'SHOPIFY_QUERY_SHOP';
    }

    // Dynamic search fallback
    if (!toolToRun) {
      const searchQuery = matchedTrigger ? `${matchedTrigger.slug} ${taskText}` : taskText;
      const searchRes = await session.execute('COMPOSIO_SEARCH_TOOLS', { query: searchQuery }).catch(() => ({ data: {} }));
      const primary = searchRes?.data?.results?.[0]?.primary_tool_slugs || [];
      const related = searchRes?.data?.results?.[0]?.related_tool_slugs || [];
      toolToRun = primary[0] || related[0] || matchedTrigger?.sampleTool;
    }

    if (!toolToRun) {
      return {
        executed: false,
        reason: 'NO_TOOL_MATCH',
        note: 'No specific connected tool matched for this prompt.'
      };
    }

    console.log(`[Composio Bridge] Calling live tool: ${toolToRun} for task "${taskText.slice(0, 50)}..."`);

    // 2. Prepare verified parameter payloads
    let args = {};
    if (toolToRun === 'CANVA_POST_DESIGNS') {
      const cleanTitle = (taskText || 'Sunnyeora Ad Creative').replace(/[^\w\s-]/gi, '').slice(0, 40).trim() || 'Sunnyeora Promo';
      args = {
        design_type: { type: 'custom', width: 1080, height: 1080 },
        title: cleanTitle
      };
    } else if (toolToRun === 'GMAIL_CREATE_EMAIL_DRAFT') {
      const cleanSubject = (taskText || 'Sunnyeora Customer & Marketing Update').slice(0, 50).trim();
      args = {
        recipient_email: 'sunnyeora.store@gmail.com',
        subject: `[Sunnyeora] ${cleanSubject}`,
        body: `Hello,\n\n${taskText}\n\nBest regards,\n${agent?.name || 'Sales Lead'} | Sunnyeora E-commerce Team`
      };
    } else if (toolToRun === 'GMAIL_FETCH_EMAILS' || toolToRun === 'GMAIL_LIST_THREADS') {
      args = { max_results: 5 };
    } else if (toolToRun === 'SLACK_SEND_MESSAGE') {
      args = {
        channel: 'C0C2ZM5FTT7',
        markdown_text: `*[Sunnyeora ${agent?.name || dept.toUpperCase()} Alert]*:\n${taskText}`
      };
    } else if (toolToRun === 'FACEBOOK_LIST_MANAGED_PAGES' || toolToRun === 'SHOPIFY_QUERY_SHOP') {
      args = {};
    } else if (toolToRun.includes('LIST') || toolToRun.includes('GET') || toolToRun.includes('FETCH')) {
      args = { max_results: 5, query: taskText };
    }

    // 3. Execute tool
    const execResult = await session.execute(toolToRun, args);

    return {
      executed: true,
      toolSlug: toolToRun,
      platform: matchedTrigger?.name || 'Composio Tool',
      icon: matchedTrigger?.icon || '⚡',
      toolkit: matchedTrigger?.slug || 'composio',
      data: execResult?.data || execResult,
      logId: execResult?.logId,
      summary: `Successfully executed live tool ${toolToRun} via Composio.`
    };
  } catch (err) {
    console.warn(`[Composio Bridge] Tool call ${taskText.slice(0, 30)} failed:`, err.message);
    return {
      executed: false,
      error: err.message,
      note: `Tool execution skipped: ${err.message}`
    };
  }
}

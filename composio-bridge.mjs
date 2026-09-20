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
    name: 'Gmail',
    slug: 'gmail',
    keywords: ['email', 'emails', 'inbox', 'unread', 'mail', 'cmail', 'imail', 'vmail', 'kmail', 'gmail', 'elead', 'customer care'],
    depts: ['emails', 'sales', 'ops', 'fin'],
    sampleTool: 'GMAIL_LIST_MESSAGES',
    icon: '✉️',
    roleSummary: 'Customer replies, tracking queries, order status triage'
  },
  {
    name: 'Canva',
    slug: 'canva',
    keywords: ['canva', 'design', 'banner', 'graphic', 'poster', 'creative', 'visual', 'ad set', 'vid', 'thumbnail'],
    depts: ['marketing', 'delivery'],
    sampleTool: 'CANVA_CREATE_DESIGN',
    icon: '🎨',
    roleSummary: 'Dynamic TikTok, Reels, ad creatives, and store hero banners'
  },
  {
    name: 'Canva MCP',
    slug: 'canva_mcp',
    keywords: ['canva mcp', 'template design', 'design template', 'batch graphic'],
    depts: ['marketing', 'delivery'],
    sampleTool: 'CANVA_CREATE_DESIGN',
    icon: '🖌️',
    roleSummary: 'Direct MCP template generation for catalog banners'
  },
  {
    name: 'Shopify',
    slug: 'shopify',
    keywords: ['shopify', 'order', 'orders', 'product', 'products', 'inventory', 'storefront', 'sunnyeora', 'fulfill', 'checkout', 'sku'],
    depts: ['ops', 'delivery', 'sales', 'fin'],
    sampleTool: 'SHOPIFY_GET_ALL_ORDERS',
    icon: '🛍️',
    roleSummary: 'Live orders, products, inventory sync on sunnyeora.myshopify.com'
  },
  {
    name: 'Slack',
    slug: 'slack',
    keywords: ['slack', 'channel', 'broadcast', 'alert', 'team ping', 'notify squad', 'squad message'],
    depts: ['emails', 'sales', 'marketing', 'ops', 'fin', 'delivery'],
    sampleTool: 'SLACK_CHAT_POST_MESSAGE',
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
 * Execute real Composio tool if task requests or matches one of the 13 connected apps
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
    // 1. Search for matching tool in Composio
    const searchQuery = matchedTrigger ? `${matchedTrigger.slug} ${taskText}` : taskText;
    const searchRes = await session.execute('COMPOSIO_SEARCH_TOOLS', {
      query: searchQuery
    }).catch(e => ({ data: [] }));

    let toolToRun = null;
    if (Array.isArray(searchRes?.data) && searchRes.data.length > 0) {
      toolToRun = searchRes.data[0]?.slug || searchRes.data[0]?.name;
    } else if (matchedTrigger?.sampleTool) {
      toolToRun = matchedTrigger.sampleTool;
    }

    if (!toolToRun) {
      return {
        executed: false,
        reason: 'NO_TOOL_MATCH',
        note: 'No specific connected tool matched for this prompt.'
      };
    }

    console.log(`[Composio Bridge] Calling live tool: ${toolToRun} for task "${taskText.slice(0, 50)}..."`);

    // 2. Prepare safe parameters for execution
    let args = {};
    if (toolToRun.includes('LIST') || toolToRun.includes('GET_ALL') || toolToRun.includes('SEARCH')) {
      args = { maxResults: 5, query: taskText };
    } else if (toolToRun.includes('CREATE_DESIGN')) {
      args = { title: `Sunnyeora: ${taskText.slice(0, 40)}`, type: 'social_media' };
    } else if (toolToRun.includes('POST_MESSAGE')) {
      args = { text: `[Sunnyeora Agent Alert - ${agent?.name || dept}]: ${taskText}` };
    } else if (toolToRun.includes('GEOCODE')) {
      args = { address: taskText.slice(0, 50) };
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

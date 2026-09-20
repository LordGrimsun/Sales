// composio-bridge.mjs — Real tool execution bridge for Sunnyeora Command Centre
// Connects 35 autonomous agents to 13 active Composio integrations:
// Gmail, Canva, Shopify, Slack, Notion, GitHub, Google Drive/Docs/Sheets/Calendar/Maps, Beehiiv

let composioInstance = null;
let activeSession = null;
const USER_ID = process.env.COMPOSIO_USER_ID || 'sunnyeora_store_owner';

// Toolkit mapping by intent keywords and departments
const TOOLKIT_TRIGGERS = [
  {
    slug: 'gmail',
    keywords: ['email', 'emails', 'inbox', 'unread', 'mail', 'cmail', 'imail', 'vmail', 'kmail', 'gmail', 'elead'],
    depts: ['emails'],
    sampleTool: 'GMAIL_LIST_MESSAGES'
  },
  {
    slug: 'canva',
    keywords: ['canva', 'design', 'banner', 'graphic', 'poster', 'creative', 'visual', 'ad set', 'vid'],
    depts: ['marketing'],
    sampleTool: 'CANVA_CREATE_DESIGN'
  },
  {
    slug: 'shopify',
    keywords: ['shopify', 'order', 'orders', 'product', 'products', 'inventory', 'storefront', 'sunnyeora', 'fulfill'],
    depts: ['ops', 'delivery', 'sales', 'fin'],
    sampleTool: 'SHOPIFY_GET_ALL_ORDERS'
  },
  {
    slug: 'slack',
    keywords: ['slack', 'channel', 'broadcast', 'alert', 'team ping', 'notify squad'],
    depts: ['emails', 'sales', 'marketing', 'ops', 'fin', 'delivery'],
    sampleTool: 'SLACK_CHAT_POST_MESSAGE'
  },
  {
    slug: 'notion',
    keywords: ['notion', 'sop', 'knowledge base', 'wiki', 'notes database', 'playbook'],
    depts: ['emails', 'sales', 'marketing', 'ops', 'fin', 'delivery'],
    sampleTool: 'NOTION_SEARCH_NOTION_PAGE'
  },
  {
    slug: 'github',
    keywords: ['github', 'repo', 'issue', 'issues', 'pr', 'pull request', 'commit', 'branch'],
    depts: ['ops', 'delivery'],
    sampleTool: 'GITHUB_LIST_REPOSITORY_ISSUES'
  },
  {
    slug: 'googlesheets',
    keywords: ['sheet', 'sheets', 'spreadsheet', 'ledger', 'row', 'cells', 'p&l', 'reconciliation'],
    depts: ['fin', 'ops'],
    sampleTool: 'GOOGLESHEETS_GET_SPREADSHEET_VALUES'
  },
  {
    slug: 'googledrive',
    keywords: ['drive', 'folder', 'upload file', 'shared drive', 'backup'],
    depts: ['ops', 'delivery', 'fin'],
    sampleTool: 'GOOGLEDRIVE_LIST_FILES'
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
  const matchedTrigger = TOOLKIT_TRIGGERS.find(t =>
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

    console.log(`[Composio Bridge] Calling real tool: ${toolToRun} for task "${taskText.slice(0, 50)}..."`);

    // 2. Prepare safe parameters for execution
    let args = {};
    if (toolToRun.includes('LIST') || toolToRun.includes('GET_ALL') || toolToRun.includes('SEARCH')) {
      args = { maxResults: 5, query: taskText };
    } else if (toolToRun.includes('CREATE_DESIGN')) {
      args = { title: `Sunnyeora: ${taskText.slice(0, 40)}`, type: 'social_media' };
    } else if (toolToRun.includes('POST_MESSAGE')) {
      args = { text: `[Sunnyeora Agent Alert - ${agent?.name || dept}]: ${taskText}` };
    }

    // 3. Execute tool
    const execResult = await session.execute(toolToRun, args);

    return {
      executed: true,
      toolSlug: toolToRun,
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

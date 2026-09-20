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
    if (textLower.includes('slack') || textLower.includes('broadcast') || textLower.includes('squad') || textLower.includes('alert') || textLower.includes('briefing')) {
      toolToRun = 'SLACK_SEND_MESSAGE';
    } else if (dept === 'emails') {
      if (/\b(check\s+inbox|check\s+emails?|read\s+emails?|fetch\s+emails?|unread)\b/i.test(taskText)) {
        toolToRun = 'GMAIL_FETCH_EMAILS';
      } else {
        toolToRun = 'GMAIL_CREATE_EMAIL_DRAFT';
      }
    } else if (/\b(email|emails|mail|draft|inbox)\b/i.test(taskText)) {
      if (/\b(check\s+inbox|check\s+emails?|read\s+emails?|fetch\s+emails?)\b/i.test(taskText)) {
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
      let subject = '🍂 Early VIP Access: Take 20% Off Sunnyeora Autumn Trends';
      if (taskText.includes('Subject:')) {
        const subMatch = taskText.match(/Subject:\s*([^\n\r]+)/i);
        if (subMatch) subject = subMatch[1].trim();
      } else {
        const firstLine = taskText.split('\n')[0].replace(/[^\w\s-]/gi, '').slice(0, 50).trim();
        if (firstLine) subject = firstLine;
      }

      // Format customer-facing HTML layout
      const cleanContent = taskText.replace(/^Subject:\s*[^\n\r]+\n*/i, '').trim();
      const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.6; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
  <div style="background-color: #b85d19; padding: 24px 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">SUNNYEORA</h1>
    <p style="color: #fcefe6; margin: 4px 0 0; font-size: 13px; letter-spacing: 1px;">AUTUMN FLASH SALE &bull; LIMITED TIME ONLY</p>
  </div>
  <div style="padding: 28px 24px; background-color: #ffffff;">
    <p style="font-size: 16px; margin-top: 0;">Hey there,</p>
    <p style="font-size: 15px; color: #444;">${cleanContent.replace(/\n\n/g, '</p><p style="font-size: 15px; color: #444;">')}</p>
    <div style="background-color: #faf6f0; border: 2px dashed #d97736; padding: 18px; text-align: center; margin: 24px 0; border-radius: 8px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 4px;">Exclusive Promo Code</div>
      <div style="font-size: 26px; font-weight: 800; color: #b85d19; letter-spacing: 4px;">AUTUMN20</div>
      <div style="font-size: 13px; color: #666; margin-top: 4px;">20% OFF storewide at checkout</div>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="https://sunnyeora.myshopify.com/collections/all" style="background-color: #111111; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px; display: inline-block;">Shop Autumn Collection &rarr;</a>
    </div>
    <p style="font-size: 14px; color: #666;">Claim your favorites while supplies last.</p>
    <p style="font-size: 15px; margin-bottom: 0;">Warm regards,<br/><strong>The Sunnyeora Team</strong></p>
  </div>
  <div style="background-color: #f9f9f9; padding: 16px 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
    <p style="margin: 0 0 4px;">Free shipping available &bull; Secure checkout via Shopify</p>
    <p style="margin: 0;"><a href="https://sunnyeora.myshopify.com" style="color: #b85d19; text-decoration: none;">sunnyeora.myshopify.com</a></p>
  </div>
</div>`;

      args = {
        recipient_email: 'sunnyeora.store@gmail.com',
        subject: subject,
        body: htmlBody,
        is_html: true
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

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
    } else if (dept === 'emails' || /\b(email|emails|mail|draft|inbox)\b/i.test(taskText)) {
      if (/\b(check\s+inbox|check\s+emails?|read\s+emails?|fetch\s+emails?|unread)\b/i.test(taskText)) {
        toolToRun = 'GMAIL_FETCH_EMAILS';
      } else if (/\b(send\s+draft|send\s+email|dispatch\s+email|send\s+out|mail\s+to|send\s+to|send\s+now)\b/i.test(taskText)) {
        toolToRun = 'GMAIL_SEND_EMAIL';
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
    } else if (toolToRun === 'GMAIL_CREATE_EMAIL_DRAFT' || toolToRun === 'GMAIL_SEND_EMAIL') {
      let subject = '🍂 Early VIP Access: Take 20% Off Sunnyeora Autumn Trends';
      if (taskText.includes('Subject:')) {
        const subMatch = taskText.match(/Subject:\s*([^\n\r]+)/i);
        if (subMatch) subject = subMatch[1].trim();
      } else {
        const firstLine = taskText.split('\n')[0].replace(/[^\w\s-]/gi, '').slice(0, 50).trim();
        if (firstLine) subject = firstLine;
      }

      // Extract recipient email if specified in task prompt
      let recipientEmail = 'sunnyeora.store@gmail.com';
      const emailMatch = taskText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) recipientEmail = emailMatch[1];

      // Format customer-facing HTML layout
      const cleanContent = taskText.replace(/^Subject:\s*[^\n\r]+\n*/i, '').trim();
      const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); color: #1a1a1a;">
  <div style="background-color: #1a1a1a; color: #ffffff; padding: 8px 16px; text-align: center; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
    🍂 Private VIP Access &bull; 48 Hours Only &bull; Code: <strong>AUTUMN20</strong>
  </div>
  <div style="padding: 28px 24px 16px; text-align: center; border-bottom: 1px solid #f0eee9;">
    <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; letter-spacing: 5px; font-weight: 700; color: #1a1a1a; text-transform: uppercase;">SUNNYEORA</div>
    <div style="font-size: 11px; letter-spacing: 2px; color: #8c827a; margin-top: 4px; text-transform: uppercase;">Modern Luxury &bull; Autumn Capsule</div>
  </div>
  <div style="background: linear-gradient(135deg, #a45318 0%, #cb7632 50%, #d8894a 100%); padding: 40px 28px; text-align: center; color: #ffffff;">
    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; margin-bottom: 12px;">The Autumn Edit // 2026</span>
    <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 30px; margin: 0 0 10px; font-weight: 700;">Elegance in Every Layer</h1>
    <p style="font-size: 14px; line-height: 1.6; max-width: 420px; margin: 0 auto 20px; color: #fff1e6;">Discover rich earth tones, cozy knitwear, and timeless essentials designed for the season.</p>
    <a href="https://sunnyeora.myshopify.com/collections/all" style="display: inline-block; background-color: #ffffff; color: #1a1a1a; padding: 12px 30px; border-radius: 24px; font-weight: 700; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; text-decoration: none;">Explore Collection &rarr;</a>
  </div>
  <div style="padding: 24px 20px 8px;">
    <div style="background-color: #faf7f2; border: 2px dashed #d97736; border-radius: 10px; padding: 18px; text-align: center;">
      <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #8a7c70; font-weight: 600;">Exclusive VIP Voucher</div>
      <div style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #b85d19; font-family: monospace; margin: 4px 0;">AUTUMN20</div>
      <div style="font-size: 13px; color: #524b45;">Take <strong>20% OFF</strong> your entire cart at checkout</div>
    </div>
  </div>
  <div style="padding: 20px 24px 8px; text-align: center;">
    <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #b85d19; font-weight: 700; margin-bottom: 4px;">Curated Pieces</div>
    <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #1a1a1a; margin: 0 0 16px;">Trending This Week</h2>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="48%" style="vertical-align: top; background-color: #faf9f7; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #edebe6;">
          <div style="font-size: 26px; margin-bottom: 4px;">🧥</div>
          <div style="font-size: 13px; font-weight: 700; color: #1a1a1a;">Cashmere Knit Cardigan</div>
          <div style="font-size: 14px; font-weight: 800; color: #b85d19; margin: 4px 0 8px;">$48.00 <span style="font-size: 11px; color: #a89f97; text-decoration: line-through; font-weight: 400;">$60.00</span></div>
          <a href="https://sunnyeora.myshopify.com/collections/all" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 6px 14px; border-radius: 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-decoration: none;">Shop Item</a>
        </td>
        <td width="4%"></td>
        <td width="48%" style="vertical-align: top; background-color: #faf9f7; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #edebe6;">
          <div style="font-size: 26px; margin-bottom: 4px;">👜</div>
          <div style="font-size: 13px; font-weight: 700; color: #1a1a1a;">Terracotta Leather Tote</div>
          <div style="font-size: 14px; font-weight: 800; color: #b85d19; margin: 4px 0 8px;">$38.40 <span style="font-size: 11px; color: #a89f97; text-decoration: line-through; font-weight: 400;">$48.00</span></div>
          <a href="https://sunnyeora.myshopify.com/collections/all" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 6px 14px; border-radius: 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-decoration: none;">Shop Item</a>
        </td>
      </tr>
    </table>
  </div>
  <div style="padding: 20px 24px; background-color: #f7f5f0; text-align: center; font-size: 14px; color: #444; line-height: 1.6; border-top: 1px solid #eee9e0; border-bottom: 1px solid #eee9e0;">
    &ldquo;Quiet luxury, seasonal textures, and effortless cuts &mdash; without the retail markup.&rdquo;
  </div>
  <div style="background-color: #111111; padding: 20px; text-align: center; font-size: 11px; color: #777777;">
    <p style="margin: 0 0 6px;">&copy; 2026 Sunnyeora Studio &bull; Free worldwide shipping available</p>
    <p style="margin: 0;"><a href="https://sunnyeora.myshopify.com" style="color: #b85d19; text-decoration: none;">sunnyeora.myshopify.com</a></p>
  </div>
</div>`;

      args = {
        recipient_email: recipientEmail,
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

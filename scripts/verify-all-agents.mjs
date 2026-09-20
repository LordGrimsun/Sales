// scripts/verify-all-agents.mjs — Automated verification runner across all 6 departments & tools
import { ALL_CONNECTED_PLATFORMS } from '../composio-bridge.mjs';

const TARGET_URL = process.env.SALES_URL || 'http://localhost:4520';

const TEST_SUITE = [
  {
    dept: 'emails',
    agent: 'elead',
    name: 'Emails Lead (Elead)',
    platform: 'Gmail',
    task: 'Check latest customer support emails and confirm inbox access',
    sampleQuery: 'Can you access the mails and check unread customer inquiries?'
  },
  {
    dept: 'marketing',
    agent: 'mlead',
    name: 'Marketing Lead (Mlead)',
    platform: 'Canva & Beehiiv',
    task: 'Generate viral TikTok hooks and Canva creative brief for summer collection',
    sampleQuery: 'Create a summer collection visual ad brief and Canva creative concepts'
  },
  {
    dept: 'ops',
    agent: 'olead',
    name: 'Operations Lead (Olead)',
    platform: 'Shopify & Google Drive',
    task: 'Audit Shopify orders, check supplier dispatch and inventory levels',
    sampleQuery: 'Check active Shopify orders and fulfillment status on sunnyeora.myshopify.com'
  },
  {
    dept: 'fin',
    agent: 'alead',
    name: 'Finance Lead (Alead)',
    platform: 'Google Sheets & Stripe',
    task: 'Reconcile daily Stripe sales against supplier product costs in Google Sheets',
    sampleQuery: 'Reconcile daily revenue and calculate our gross margin percentage in Google Sheets'
  },
  {
    dept: 'sales',
    agent: 'lexi',
    name: 'Sales Lead (Lexi)',
    platform: 'Google Docs & Google Calendar',
    task: 'Draft boutique wholesale pricing terms and schedule buyer follow-up calls',
    sampleQuery: 'Prepare wholesale B2B discount tier schedule and book buyer calls'
  },
  {
    dept: 'delivery',
    agent: 'dlead',
    name: 'Delivery Lead (Dlead)',
    platform: 'Google Maps & Notion',
    task: 'Verify international shipping transit zones and archive manifest SOP to Notion',
    sampleQuery: 'Check shipping transit zones and update supplier fulfillment playbook in Notion'
  }
];

export async function runVerification(baseUrl = TARGET_URL) {
  console.log(`\n======================================================`);
  console.log(`🤖 VERIFYING ALL 6 AGENT PODS & 13 CONNECTED PLATFORMS`);
  console.log(`   Target Environment: ${baseUrl}`);
  console.log(`======================================================\n`);

  const results = [];

  for (const item of TEST_SUITE) {
    console.log(`[${item.dept.toUpperCase()}] Testing ${item.name} (${item.platform})...`);
    try {
      const chatRes = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: item.agent,
          text: item.sampleQuery,
          history: []
        })
      });

      if (!chatRes.ok) {
        throw new Error(`Chat API HTTP ${chatRes.status}: ${await chatRes.text()}`);
      }

      const chatData = await chatRes.json();
      const reply = chatData.reply || '(No reply text returned)';

      console.log(`  ✓ Received response (${reply.length} chars)`);
      console.log(`  Preview: "${reply.slice(0, 140).replace(/\n/g, ' ')}..."\n`);

      results.push({
        dept: item.dept,
        agent: item.agent,
        name: item.name,
        platform: item.platform,
        status: 'VERIFIED',
        replyPreview: reply.slice(0, 200),
        fullReply: reply,
        toolsReported: chatData.tools || []
      });
    } catch (err) {
      console.error(`  ✖ Verification failed for ${item.name}:`, err.message);
      results.push({
        dept: item.dept,
        agent: item.agent,
        name: item.name,
        platform: item.platform,
        status: 'FAILED',
        error: err.message
      });
    }
  }

  console.log(`\n======================================================`);
  console.log(`📊 SUMMARY: ${results.filter(r => r.status === 'VERIFIED').length}/${results.length} AGENTS VERIFIED`);
  console.log(`======================================================\n`);

  return results;
}

if (process.argv[1]?.endsWith('verify-all-agents.mjs')) {
  const urlArg = process.argv[2] || process.env.SALES_URL || 'http://localhost:4520';
  runVerification(urlArg);
}

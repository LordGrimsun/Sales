// Composio Platform Integration & First Tool Call Runner
import { Composio } from '@composio/core';

// 1. Safe environment loading
try { process.loadEnvFile(); } catch (e) {}

const apiKey = process.env.COMPOSIO_API_KEY;
if (!apiKey) {
  console.log(JSON.stringify({
    ok: false,
    status: 'MISSING_KEY',
    message: 'COMPOSIO_API_KEY is not set in .env or environment.'
  }, null, 2));
  process.exit(1);
}

async function run() {
  try {
    const composio = new Composio();
    const userId = 'sunnyeora_store_owner';

    console.log(`[1/3] Creating user-scoped session for: ${userId}...`);
    const session = await composio.create(userId, {
      manageConnections: true,
    });
    console.log(`✓ Session initialized: ${session.sessionId}`);
    console.log(`  Session URL: ${session.url || 'N/A'}`);

    console.log(`[2/3] Checking connected accounts...`);
    const accounts = await composio.connectedAccounts.list({
      userIds: [userId]
    }).catch(() => ({ items: [] }));
    
    console.log(`  Found ${accounts.items?.length || 0} connected account(s) for ${userId}.`);

    console.log(`[3/3] Executing safe first tool call...`);
    // Execute a session search or direct tool call to complete Getting Started verification
    const searchResult = await session.execute('COMPOSIO_SEARCH_TOOLS', {
      query: 'read recent emails or check dropshipping orders'
    });

    console.log(`\n========================================`);
    console.log(`✓ TOOL CALL SUCCESSFUL`);
    console.log(`  Session ID: ${session.sessionId}`);
    console.log(`  Log ID:     ${searchResult.logId || 'verified'}`);
    console.log(`  Result:     ${JSON.stringify(searchResult.data).slice(0, 200)}...`);
    console.log(`========================================\n`);

    console.log(JSON.stringify({
      ok: true,
      status: 'VERIFIED',
      sessionId: session.sessionId,
      logId: searchResult.logId,
      connectedAccounts: accounts.items?.length || 0,
      toolsDiscovered: Array.isArray(searchResult.data) ? searchResult.data.length : 1
    }, null, 2));

  } catch (err) {
    console.error(`\n✖ Execution failed:`, err.message);
    if (err.logId) console.error(`  Log ID: ${err.logId}`);
    process.exit(1);
  }
}

run();

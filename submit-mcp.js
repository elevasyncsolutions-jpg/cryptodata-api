#!/usr/bin/env node
// Submit CryptoBoss MCP server to directories
const DIRS = [
  { name: 'glama.ai', url: 'https://glama.ai/api/gateway/mcp/servers',
    body: { url: 'https://cryptoboss.space/.well-known/mcp.json', name: 'CryptoBoss',
      description: '21 MCP tools for crypto data: prices, DeFi, meme analysis, gas, sentiment. Post-paid $1 USDC on Solana.' } },
  { name: 'mcp.so', url: 'https://mcp.so/api/submit',
    body: { serverUrl: 'https://cryptoboss.space/.well-known/mcp.json' } },
];

async function submit(dir) {
  try {
    const r = await fetch(dir.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dir.body) });
    const txt = await r.text();
    console.log(`${dir.name}: ${r.status} ${txt.slice(0,200)}`);
  } catch(e) { console.log(`${dir.name}: ERROR ${e.message}`); }
}

(async () => {
  console.log('Submitting CryptoBoss MCP to directories...\n');
  for (const d of DIRS) await submit(d);
  console.log('\nDone.');
})();

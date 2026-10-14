const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://stitch.googleapis.com/mcp';
const API_KEY = process.env.STITCH_API_KEY;
if (!API_KEY) {
  console.error('STITCH_API_KEY environment variable is missing.');
}

async function callTool(name, args = {}) {
  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name,
      arguments: args
    }
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300000), // 5 min timeout
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(`RPC Error [${json.error.code}]: ${json.error.message}`);
  }
  return json.result;
}

const [,, toolName, arg2] = process.argv;
if (!toolName) {
  console.log('Usage: node stitch-cli.cjs <toolName> [argsJson | @file.json]');
  process.exit(1);
}

let args = {};
if (arg2) {
  if (arg2.startsWith('@')) {
    args = JSON.parse(fs.readFileSync(arg2.slice(1), 'utf8'));
  } else {
    args = JSON.parse(arg2);
  }
}

callTool(toolName, args)
  .then(res => {
    console.log(JSON.stringify(res, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });

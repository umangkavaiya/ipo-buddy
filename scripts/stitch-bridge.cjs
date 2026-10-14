const readline = require('readline');

const ENDPOINT = 'https://stitch.googleapis.com/mcp';
const API_KEY = process.env.STITCH_API_KEY;
if (!API_KEY) {
  console.error('STITCH_API_KEY environment variable is missing.');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return;
  }

  const isNotification = parsed.id === undefined || parsed.id === null;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
      },
      body: trimmed,
    });

    if (isNotification) return;

    const text = await res.text();
    if (text && text.trim()) {
      process.stdout.write(text.trim() + '\n');
    }
  } catch (err) {
    if (!isNotification) {
      const errResponse = {
        jsonrpc: '2.0',
        id: parsed.id,
        error: {
          code: -32603,
          message: err.message || 'Internal bridge error'
        }
      };
      process.stdout.write(JSON.stringify(errResponse) + '\n');
    }
  }
});

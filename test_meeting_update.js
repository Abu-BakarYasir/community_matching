// Test script to update a meeting and trigger admin notification
const https = require('https');

const data = JSON.stringify({
  scheduledAt: "2025-01-20T19:00:00.000Z",
  duration: 45
});

const options = {
  hostname: '1c8a8ffd-e3d9-4c00-9b85-d2ad8e3a36ce-00-20g7aag1gtzjb.riker.replit.dev',
  port: 443,
  path: '/api/meetings/30',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log(`headers:`, res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
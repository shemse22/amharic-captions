const https = require('https');

https.get('https://bgern.com/admin', (res) => {
  let data = '';
  res.on('data', (c) => (data += c));
  res.on('end', () => {
    const matches = [...data.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
    console.log('Script matches:', matches);

    // Also look for buildId or main chunks
    const buildIdMatch = data.match(/"buildId":"([^"]+)"/);
    console.log('Live buildId:', buildIdMatch ? buildIdMatch[1] : 'not found');
  });
});

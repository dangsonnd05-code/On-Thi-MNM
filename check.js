const https = require('https');

const data = JSON.stringify({ roomCode: '24043977' });

const req = https.request({
  hostname: 'game.quizizz.com',
  path: '/play-api/v4/checkRoom',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let chunks = '';
  res.on('data', (d) => { chunks += d; });
  res.on('end', () => {
    console.log(chunks);
    const fs = require('fs');
    fs.writeFileSync('checkRoom.json', chunks);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();

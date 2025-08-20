// API 테스트 스크립트
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/creatures',
  method: 'GET',
  rejectUnauthorized: false
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('SUCCESS: Received', jsonData.length, 'creatures');
      console.log('First creature:', jsonData[0]?.name);
    } catch (error) {
      console.log('RAW RESPONSE:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
const http = require('http');

module.exports = function(callback) {
  this.app = http.createServer((req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    let body = '';
    req.on('data', (data) => {
      body += data;
    });

    req.on('end', () => {
      callback(JSON.parse(body));
      res.writeHead(200);
      return res.end('');
    });
  });

  this.server = this.app.listen({ port: 3001 }, () => {
    let addr = this.server.address();
    console.log(`CSGO GSI server listening on ${addr.address}:${addr.port}`);
  });
};

var http = require('http');
var fs = require('fs');

http.createServer(function (req, res) {
    var url = req.url.replace(/\/$/, '');
    console.log('request url: '+url);
    if (url.substring(0, 6) === '/node/'){
        var file = 'views/'+url.substring(6)+'.html';
        fs.exists(file, function(exists) {
            if (exists){
                res.writeHead(200, { 'Content-Type': 'text/html'});
                res.write(fs.readFileSync(file, 'utf-8').toString());
                res.end();
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Page Not Found\n');
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Page Not Found\n');
    }
}).listen(8080, "127.0.0.1");
console.log('Server running at http://127.0.0.1/');

var http = require('http');
var fs = require('fs');
var path=require('path');

var MIME_TYPE = {
    "css": "text/css",
    "gif": "image/gif",
    "html": "text/html",
    "ico": "image/x-icon",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "text/javascript",
    "json": "application/json",
    "pdf": "application/pdf",
    "png": "image/png",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tiff": "image/tiff",
    "txt": "text/plain",
    "wav": "audio/x-wav",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "xml": "text/xml"
};
http.createServer(function (req, res) {
    var url = req.url.replace(/\/$/, '');
    console.log('request url: '+url);
    switch (url){
        case '/node':
            res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('Hello World\n');
            break;
        case '/node/ppt':
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(fs.readFileSync('views/ppt.html', 'utf-8').toString());
            res.end();
            break;
        default:
            res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Page Not Found\n');
            break;
    }
}).listen(8080, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8080/');

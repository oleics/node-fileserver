
var http = require('http');
var url = require('url');
var fs = require('fs');

var createPathmap = require('./pathmap').createPathmap;

function onError(req, res, err) {
  res.statusCode = 404;
  res.end(err.toString());
}

function createServer() {
  var pathmap = createPathmap();
  
  var server = http.createServer(function(req, res) {
    var urlParts = url.parse(req.url),
        localPath = pathmap.getPath(urlParts.pathname);
    
    if(localPath) {
      fs.stat(localPath, function(err, s) {
        var readStream;
        
        if(err) {
          return onError(req, res, err);
        }
        
        if(s.isDirectory()) {
          onError(req, res, new Error('Path is a directory'));
        } else {
          res.statusCode = 200;
          
          var readStream = fs.createReadStream(localPath);
          
          readStream.on('error', function(err) {
            readStream.removeAllListeners();
            onError(req, res, err);
          });
          
          readStream.pipe(res);
        }
      });
    } else {
      onError(req, res, new Error('Invalid path'));
    }
  });
  
  function listen(port, host) {
    if(port && host) {
      server.listen(port, host);
    } else {
      server.listen(port);
    }
  }
  
  return {
    server: server,
    listen: listen,
    pathmap: pathmap
  };
}

module.exports = {
  createServer: createServer
};

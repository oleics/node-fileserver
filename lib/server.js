
var http = require('http');
var url = require('url');
var fs = require('fs');

var createPathmap = require('./pathmap').createPathmap;

function createServer(options, onRequest, onError) {
  var server,
      pathmap = createPathmap(),
      requestHandlers = [];
  
  
  if(typeof options === 'function') {
    onError = onRequest;
    onRequest = options;
    options = {};
  }
  
  if(!options) options = {};
  
  if(!onError) {
    onError = function(req, res, err) {
      res.statusCode = 404;
      res.end(err.toString());
    };
  }
  
  if(onRequest) {
    requestHandlers.push(onRequest);
  }
  
  function defaultOnRequest(req, res) {
    var urlParts = url.parse(req.url),
        pathname = urlParts.pathname,
        localPath;
    
    // Remove any trailing slash
    if(pathname.slice(-1) === '/') {
      pathname = pathname.slice(0, -1);
    }
    
    localPath = pathmap.getPath(pathname);
    
    if(localPath != null) {
      fs.stat(localPath, function(err, s) {
        var readStream;
        
        if(err) {
          return onError(req, res, err);
        }
        
        if(s.isDirectory()) {
          // Redirect folder-paths without a trailing slash
          if(urlParts.pathname.slice(-1) !== '/') {
            urlParts.pathname += '/';
            res.writeHead(302, {
              'Location': url.format(urlParts)
            });
            return res.end();
          }
          
          // onError(req, res, new Error('Path is a directory'));
          
          // List files in folder
          fs.readdir(localPath, function(err, files) {
            if(err) return onError(req, res, err);
            
            res.writeHead(200, {
              'Content-Type': 'text/html'
            });
            res.write('<h1>' + pathname + '/</h1><div>');
            files.forEach(function(file) {
              if(file[0] !== '.') {
                res.write('<div><a href="' + file + '">' + file + '</a></div>');
              }
            });
            res.write('</div>');
            res.end();
          });
        } else {
          // Pipe the file to client
          res.statusCode = 200;
          
          if(pathmap.getMimeType(pathname)) {
            res.setHeader('Content-Type', pathmap.getMimeType(pathname));
          }
          
          var readStream = fs.createReadStream(localPath);
          
          readStream.on('error', function(err) {
            readStream.removeAllListeners();
            onError(req, res, err);
          });
          
          readStream.pipe(res);
        }
      });
    } else if(requestHandlers.length) {
      function next(index, pending) {
        if(index === pending) return;
        
        var onRequest = requestHandlers[index++];
        
        if(onRequest.length > 2) {
          onRequest(req, res, function(err) {
            if(err) {
              return onError(req, res, err);
            }
            
            next(index, pending);
          });
        } else {
          onRequest(req, res);
        }
      }
      
      next(0, requestHandlers.length);
    } else {
      onError(req, res, new Error('Invalid path: ' + urlParts.pathname));
    }
  }
  
  server = http.createServer(defaultOnRequest);
  
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

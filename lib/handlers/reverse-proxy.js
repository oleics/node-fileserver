
/**
 * options.reverseProxy = [{
 *   proxy: 'http://localhost:3000/foo/bar',
 *   host: 'foo.example.com',
 *   pathname: '/foo'
 * }]
 */

module.exports = createHandler;

var request = require('request');

function createHandler(options) {
//  console.log('Creating reverseProxy', options);
  var reverseProxy = options.reverseProxy || [];
  
  function onRequest(req, res, next) {
    execute(0, reverseProxy.length, req, res, next);
  }
  
  function execute(index, pending, req, res, next) {
    if(index === pending) return next(true);
    
    var proxiedServer = reverseProxy[index++];
    
    if(proxiedServer.proxy == null) {
      return execute(index, pending, req, res, next);
    }
    
    if(proxiedServer.host != null && proxiedServer.host !== req.headers.host) {
      return execute(index, pending, req, res, next);
    }
    
    if(proxiedServer.pathname != null && req.urlParts.pathname.slice(0, proxiedServer.pathname.length) !== proxiedServer.pathname) {
      return execute(index, pending, req, res, next);
    }
    
//    console.log('proxiedServer', proxiedServer, proxiedServer.proxy + req.url);
    req.pipe(request(proxiedServer.proxy + req.url)).pipe(res);
    req.resume();
    
    next(false);
  }
  
  return onRequest;
}
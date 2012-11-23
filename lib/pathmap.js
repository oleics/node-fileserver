
var fs = require('fs');
var path = require('path');

function createPathmap() {
  var paths = {},
      skipDoted = true;
  
  function scanFolders(folders, cb) {
    var pending = 0,
        roots = [];
    
    folders.forEach(function(folder) {
      ++pending;
      
      scanFolder(folder, null, function(err, root) {
        if(err) return cb(err);
        
        roots.push(root);
        if(!--pending) return cb(null, roots);
      });
    });
  }
  
  function scanFolder(root, file, cb) {
    var self = this,
        folder;
    
    if(typeof file === 'function') {
      cb = file;
      file = null;
    }
    
    root = path.resolve(root);
    if(file == null) {
      folder = path.resolve(root);
    } else {
      folder = path.resolve(path.join(root, file));
    }
    
    fs.readdir(folder, function(err, files) {
      if(err) return cb(err);
      
      if(files.length === 0) return cb(null, root);
      
      var pending = 0;
      files.forEach(function(file) {
        if(skipDoted === true && file[0] === '.') return;
        
        ++pending;
        
        var fullpath = path.join(folder, file);
        var p = addPath(fullpath, null, root);
        
        fs.stat(fullpath, function(err, s) {
          if(err) return cb(err);
          
          if(s.isDirectory()) {
            scanFolder(root, p, function(err) {
              if(err) return cb(err);
              
              if(!--pending) return cb(null, root);
            });
          } else {
            if(!--pending) return cb(null, root);
          }
        });
      });
    });
  }
  
  function addPath(fullpath, p, root) {
    if(p == null) {
      p = fullpath.slice(root.length);
    }
    
    if(path.sep !== '/') {
      p = p.split(path.sep).join('/');
    }
    
    if(paths[p] != null) {
      console.warn('COLLISION DETECTED');
      console.warn(p);
      console.warn(paths[p]);
      console.warn(fullpath);
      console.warn('');
    }
    
    paths[p] = fullpath;
    
    return p;
  }
  
  function getPath(p) {
    return paths[p];
  }
  
  return {
    paths: paths,
    createPathmap: createPathmap,
    scanFolder: scanFolder,
    scanFolders: scanFolders,
    getPath: getPath
  };
};

module.exports = createPathmap();

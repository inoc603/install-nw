var spawn = require('child_process').spawn;  
var path = require('path');
var fs = require('fs');
var http = require('http');
var Fast = require('fast-download');
var progress = require('progress-stream');
var semver = require('semver');

var platform = process.platform === 'darwin' ? 'osx' : 
  process.platform === 'win32' ? 'win' : process.platform;

var ext = platform === 'linux' ? '.tar.gz' : '.zip';

var homedir = (platform === 'win') ? 
  process.env.HOMEPATH : 
  process.env.HOME;


installNw.hasCachedSync = function (version, opts) {
  opts = opts || {};
  var dirPath = opts.dirPath || path.join(homedir, '.nw-cache');
  return fs.existsSync(path.join(dirPath, vToF(version)));
}

installNw.hasCached = function (version, opts, cb) {
  if (opts instanceof Function) {
    cb = opts; 
    opts = null;
  }

  opts = opts || {};

  var dirPath = opts.dirPath || path.join(homedir, '.nw-cache');

  fs.exists(path.join(dirPath, vToF(version)), function (exists) {
    cb(null, exists);
  });
}

module.exports = installNw;

function installNw(opts, cb) {
  opts = opts || {};
  var version = opts.version;
  var dirPath = opts.dirPath || path.join(homedir, '.nw-cache');
  var url = opts.url;
  var filename = opts.filename;
  var isGlobal = !!opts.isGlobal;
  var filePath;
  if (!version) { throw 'version required'; }
  if (!filename) { throw 'filename required'; }
  if (!url) { throw 'url required'; }

  filePath = path.join(dirPath, filename);

  if (!fs.existsSync(filePath)) {
    console.log(version, 
      fs.existsSync(filePath + '.part')
       ? 'partially cached, resuming...\n' 
       : 'not in cache, fetching...\n', 
      url);  

    
    var req = new Fast(url, {
        chunksAtOnce: 8,
        destFile: filePath + '.part',
        resumeFile: true
      });

    req.on('start', function (res) {

      var pro = progress({
        time: 100, 
        length: +res.headers['content-length'],
        transferred: res._options.start,
        drain: true
      });

      res.pipe(pro);

      res.on('error', cb);

      console.log();

      pro.on('progress', function (p) {
        process.stdout.write(
          '  Downloading nw.js: ' 
          + (+p.percentage).toPrecision(3)
          + '%        \n');

        process.stdout.write(Buffer([0x1b, 0x5b, 0x31, 0x41]));
        process.stdout.write(Buffer([0x1b, 0x5b, 0x30, 0x47]));
        
        if (p.percentage === 100) {
          process.stdout.write('   Download Complete            \n\n')
          fs.renameSync(filePath + '.part', filePath);
          install(fs.createReadStream(filePath));

        }

      });
    }); 
    return;
  }

  install(fs.createReadStream(filePath));

  function install(stream, port) {
    console.log('\n Installing nw.js....\n');

    port = port || 54329;

    var server = http.createServer(function (req, res) {
      stream.pipe(res);
    }).listen(54329);

    var args = [
      'install', 
      'nw', 
      '--nwjs_urlbase=http://localhost:' + port +'/'];

    if (isGlobal) { args.push('--global'); }   

    var npm = spawn('npm', args, {stdio:'inherit'})

    npm.on('close', function (code) {
      if (code) {
        var err = Error('Install failed');
        err.code = code;
        return cb();
      }
      cb();
    })

  }
}



function vToF(version) {
  version = down(version);
  return [
    'nwjs-v', version, '-',
    platform, '-', process.arch, 
    ext].join('');
}

function down(version) {
  var v = semver.parse(version);
  
  version = [v.major, v.minor, v.patch].join('.');
  if (v.prerelease && typeof v.prerelease[0] === 'string') {
    var prerelease = v.prerelease[0].split('-');
    if (prerelease.length > 1) {
      prerelease = prerelease.slice(0, -1);
    }
    version += '-' + prerelease.join('-');
  }

  return version;
}

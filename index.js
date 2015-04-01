var spawn = require('child_process').spawn;  
var fs = require('fs');
var http = require('http');
var Fast = require('fast-download');
var progress = require('progress-stream');


module.exports = function (opts, cb) {
  var version = opts.version;
  var filePath = opts.filePath;
  var url = opts.url;
  var isGlobal = !!opts.isGlobal;

  if (!version) { throw 'version required'; }
  if (!filePath) { throw 'filePath required'; }
  if (!url) { throw 'url required'; }

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
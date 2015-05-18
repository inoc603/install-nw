#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var install = require('./');
var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var semver = require('semver');

var platform = process.platform === 'darwin' ? 'osx' : 
  process.platform === 'win3' ? 'win' : process.platform;

var ext = platform === 'linux' ? '.tar.gz' : '.zip';

var homedir = (platform === 'win') ? 
  process.env.HOMEPATH : 
  process.env.HOME;

var cache = argv.cache || 
  process.env.npm_config_nwjs_cache || 
  process.env.NWJS_CACHE ||  
  path.join(homedir, '.nw-cache');

var pack = path.resolve(__dirname, '..', '..', 'package.json');
var isGlobal = isGlobalInstall();
var local = !isGlobal && fs.existsSync(pack);

var nwpack;
var nwp;

if (!fs.existsSync(cache)) { 
  fs.mkdirSync(cache); 
}

if (argv._.length) {
  return init(argv._[0]);
}

if (local) {
  toggleNwPostinstall()
  return init(require(pack).nw);
}

function toggleNwPostinstall() {
  var nwpack = path.resolve(__dirname, '..', 'nw', 'package.json');
  if (!fs.existsSync(nwpack)) {return;}
  var nwp = require(nwpack);

  if (nwp && nwp.scripts) {
    if (nwp.scripts._postinstall) {
      nwp.scripts.postinstall = nwp.scripts._postinstall;
      nwp.scripts._postinstall = undefined;
      fs.writeFileSync(nwpack, JSON.stringify(nwp, 0, 2));
      return;
    }
    if (nwp.scripts.postinstall) {
      nwp.scripts._postinstall = nwp.scripts.postinstall;
      nwp.scripts.postinstall = undefined;
      fs.writeFileSync(nwpack, JSON.stringify(nwp, 0, 2));
      return;
    }
  }

}

exec('npm info nw --json', function (err, stdout) {
  var info = JSON.parse(stdout);
  init(info.version);
})

function init(version) { 
  var v = down(version);

  var urlBase = argv.urlBase ||
    process.env.npm_config_nwjs_urlbase || 
    process.env.NWJS_URLBASE || 
    'http://dl.nwjs.io/v';

  var filename = [
    'nwjs-v', v, '-',
    platform, '-', process.arch, 
    ext].join('');

  var url = [
    urlBase, down(version, true), '/', filename]
    .join('');

  install({
    dirPath: cache, 
    filename: filename,
    url: url,
    version: v,
    isGlobal: isGlobal
  }, function (err) {
    if (err) { 
      console.log(err.message);
      return process.exit(err.code);
    }

    if (local) {
      toggleNwPostinstall();
    }

    process.exit();
  });

}

function isGlobalInstall() { 
  var conf = process.env.npm_config_argv;
  return conf && !!~(JSON
    .parse(conf)
    .cooked
    .indexOf('--global'));
}


function down(version, alt) {
  var v = semver.parse(version);
  
  version = [v.major, v.minor, v.patch].join('.');
  if (v.prerelease && typeof v.prerelease[0] === 'string') {
    var prerelease = v.prerelease[0].split('-');
    if (prerelease.length > 1) {
      prerelease = prerelease.slice(0, -1);
    }
    version += ((alt && v.minor >= 13) ? '/' : '-') + prerelease.join('-');
  }

  return version;
}
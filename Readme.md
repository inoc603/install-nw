# install-nw

Quickly and robustly install and cache NW.js.

Installs the [nw](http://npmjs.com/nw) module, which 
in turn installs NW.js. `install-nw` compliments `nw` by implementing resumable, multi-threaded downloads and archive caching.

## Usage

### In package.json

This module is mainly intended for usage as a caching install mechanism for other modules. 

```sh
npm i --save install-nw
```

It installs an executable in local to a project in node_modules/.bin, since NPM sets this folder as your path during install, we can simply do this in our package.json

```json
{
  "scripts" : { 
    "postinstall": "install-nw"
  },
  "nw": "0.12.0-1"
}
```

Note the addition of the `nw` field, 
this holds the version of NW.js to install.

#### npm arguments and environment variables

##### Cache

```sh
npm install --nwjs_cache=/path/to/cache
```

```sh
export NWJS_CACHE=/path/to/cache
npm install
```

This can also be added to an `.npmrc` file:

```
nwjs_cache=/path/to/cache
```

See CLI `cache` argument for details

##### URL Base

```sh
npm install --nwjs_urlbase=http://my.nwjs.repo/v
```

```sh
export NWJS_CACHE=http://my.nwjs.repo/v
npm install
```

This can also be added to an `.npmrc` file:

```
nwjs_urlbase=http://my.nwjs.repo/v
```

See CLI `urlBase` argument for details


### CLI

It can be used as a global install too, 

```sh
npm -g install install-nw
install-nw 0.12.0-1  
```

Not supplying a version will result in the
latest NW.js version.

#### `cache`

nw-install will install to the default cache location (`~/.nw-cache`), to install else where (say to `~/Applications`), simply pass a `--cache` argument.

```sh
install-nw --cache ~/Applications
```

#### `urlBase`

The default urlBase is as per the `nw` module:
http://dl.nwjs.io/v

This can be changed with a `--urlBase` argument:

```sh
install-nw --urlBase http://my.nwjs.repo/v
```

### Programmatic

nw-install can also be used programmatically


```js
var install = require('nw-install');
var opts = {
  filePath: '/path/to/save/nwjs/zipfile', 
  url: ' http://dl.nwjs.io/v0.12.0-1/nwjs-v0.12.0-1-osx-x64.zip',
  version: '0.12.0-1',
  isGlobal: false
};

install(opts, function (err) {
  if (err) { 
    console.log(err.message); 
    return process.exit(err.code);
  }

  process.exit();
});
```

## license
MIT license.

## Kudos

Sponsored by nearForm

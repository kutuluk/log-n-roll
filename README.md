# log-n-roll

Tiny <900b logger for fun logging.

[![NPM version](https://img.shields.io/npm/v/log-n-roll.svg?style=flat-square)](https://www.npmjs.com/package/log-n-roll)[![Build Status](https://img.shields.io/travis/kutuluk/log-n-roll/master.svg?style=flat-square)](https://travis-ci.org/kutuluk/log-n-roll)

- **Tiny:** weighs less than 900 bytes gzipped
- **Pluggable:** one built-in plugin for pretty formatting and limitless possibilities for expansion

## Note

**This packege is Proof-of-Concept and should be considered as an unstable. Nevertheless, the basic idea has already been proved. Release coming soon.**

## Install

This project uses [node](http://nodejs.org) and [npm](https://npmjs.com). Go check them out if you don't have them locally installed.

```sh
$ npm install log-n-roll
```

Then with a module bundler like [rollup](http://rollupjs.org/) or [webpack](https://webpack.js.org/), use as you would anything else:

```javascript
// using ES6 modules
import log from 'log-n-roll'

// using CommonJS modules
var log = require('log-n-roll')
```

The [UMD](https://github.com/umdjs/umd) build is also available on [unpkg](https://unpkg.com):

```html
<script src="https://unpkg.com/log-n-roll/dist/log-n-roll.umd.js"></script>
```

You can find the library on `window.log`.

## Usage

```javascript
const log = require('log-n-roll');

log.trace('Trace shows stacktrace');

// Using the built-in plugin
log.use(log.prefixer);
log.trace('Using any number of plugins adds to the stacktrace only one extra line');

// Loading the processor
let sum = 2;
for (let i = 0; i < 1000000; i++) {
  sum = Math.sqrt(sum);
}

log.debug('Debug shows the time difference from the last call of any logger method');
log.info('Placeholders are supported. Sum=%s', sum);
log.warn('Warn message');
log.error('Error message');

// Getting the named logger
const child = log('child', 'warn');
child.info('Messages below the level of the logger are ignored');

child.level = 'info';
child.info('The level of the logger can be changed at any time');

child('anotherone').info('Any logger can be obtained from any logger');
log('anotherone').debug('Anotherone logger has extended the level from the "child" logger');
child('anotherone').info('Anotherone logger has extended the plugins props from the root (not child) logger');

child().info('Root logger can be obtained from any logger');
```

Output:

```
Trace: Trace shows stacktrace
    at Object.<anonymous> (C:\Users\u36\Dropbox\kutuluk\log-n-roll\examples\example.js:3:5)
    ...
Trace: [17:59:14] TRACE: Using any number of plugins adds to the stacktrace only one extra line
    at Function.trace (C:\Users\u36\Dropbox\kutuluk\log-n-roll\lib\log-n-roll.js:49:26)
    at Object.<anonymous> (C:\Users\u36\Dropbox\kutuluk\log-n-roll\examples\example.js:7:5)
    ...
[   +61ms] DEBUG: Debug shows the time difference from the last call of any logger method
[17:59:14] INFO: Placeholders are supported. Sum=1
[17:59:14] WARN: Warn message
[17:59:14] ERROR: Error message
[17:59:14] INFO (child): The level of the logger can be changed at any time
[17:59:14] INFO (anotherone): Any logger can be obtained from any logger
[17:59:14] INFO (anotherone): Anotherone logger has extended the plugins props from the root (not child) logger
[17:59:14] INFO: Root logger can be obtained from any logger
```

## Plugins

**filetransport.js**
```javascript
const fs = require('fs');
const util = require('util');

module.exports = function fileTransport(logger, props) {
  props = Object.assign(
    {
      file: 'app.log',
      console: true,
    },
    props,
  );

  return (args) => {
    fs.appendFileSync(props.file, `${util.format(...args)}\n`);
    if (props.console) return args;
    return null;
  };
};
```

**main.js**
```javascript
const log = require('log-n-roll');
const fileTransport = require('./filetransport');

log.use(log.prefixer);
log.info('Hello, console!');

log.use(fileTransport, { file: 'my.log' });
log.info('Hello, file!');

log.use(fileTransport, { console: false });
log.info('Goodbye, console!');
```

**Console output:**
```
[17:59:14] INFO: Hello, console!
[17:59:14] INFO: Hello, file!
```

**my.log:**
```
[17:59:14] INFO: Hello, file!
[17:59:14] INFO: Goodbye, console!
```
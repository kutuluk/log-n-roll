# log-n-roll

Tiny <900b logger for fun logging.

[![NPM version](https://img.shields.io/npm/v/log-n-roll.svg?style=flat-square)](https://www.npmjs.com/package/log-n-roll)[![Build Status](https://img.shields.io/travis/kutuluk/log-n-roll/master.svg?style=flat-square)](https://travis-ci.org/kutuluk/log-n-roll)

- **Tiny:** weighs less than 900 bytes gzipped

## Installation

```sh
npm install log-n-roll
```

## API

**Proof-of-Concept**

## Example

```javascript
const log = require('log-n-roll');

const child = log('child');

(function StackTraceTestBeforeUse() {
  child.trace('Stacktrace before use plugin');
}());

child.use(log.prefixer);

(function StackTraceTestAfterUse() {
  child.trace('Stacktrace after use plugin');
}());

let sum = 0;
for (let i = 0; i < 1000000; i++) {
  sum += Math.log(10);
}

log.info('Root logger before use');

log.use(log.prefixer);
log.debug('Root logger debug message');
log.info('Root logger info message');
log.warn('Root logger warn message');
log.error('Root logger error message');

child.debug('Time diff for child logger. Sum = %s', sum);

child('another').info('Another logger has extended the plugin from the root logger');
```

Output:

```
Trace: Stacktrace before use plugin
    at StackTraceTestBeforeUse (C:\Users\u36\Dropbox\kutuluk\log-n-roll\examples\example.js:6:9)
    ...
Trace: [15:00:07] TRACE (child): Stacktrace after use plugin
    at Function.trace (C:\Users\u36\Dropbox\kutuluk\log-n-roll\lib\log-n-roll.js:49:26)
    at StackTraceTestAfterUse (C:\Users\u36\Dropbox\kutuluk\log-n-roll\examples\example.js:12:9)
    ...
Root logger before use
[    +0ms] DEBUG: Root logger debug message
[15:00:07] INFO: Root logger info message
[15:00:07] WARN: Root logger warn message
[15:00:07] ERROR: Root logger error message
[   +15ms] DEBUG (child): Time diff for child logger. Sum = 2302585.0930085
[15:00:07] INFO (another): Another logger has extended the plugin from the root logger
```

## Transports

**filefransport.js**
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
    fs.appendFile(props.file, `${util.format(...args)}\n`, (err) => {
      if (err) throw err;
    });
    if (props.console) return args;
    return null;
  };
};
```

**main.js**
```javascript
const log = require('../lib/log-n-roll');
const fileTransport = require('../examples/filetransport');

log.use(log.prefixer);
log.use(fileTransport, { file: 'my.log' });

log.info('Hello, file!');

log.use(fileTransport, { console: false });

log.info('Goodbye, console!');
```

**Console output:**
```
[15:58:26] INFO: Hello, file!
```

**my.log:**
```
[15:58:26] INFO: Hello, file!
[15:58:26] INFO: Goodbye, console!
```
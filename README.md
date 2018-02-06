# log-n-roll

Tiny <1kb logger for fun logging.

[![NPM version](https://img.shields.io/npm/v/log-n-roll.svg?style=flat-square)](https://www.npmjs.com/package/log-n-roll)[![Build Status](https://img.shields.io/travis/kutuluk/log-n-roll/master.svg?style=flat-square)](https://travis-ci.org/kutuluk/log-n-roll)

- **Tiny:** weighs less than kilobyte gzipped
- **Pluggable:** one built-in plugin for pretty formatting and limitless possibilities for extension

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
import log from 'log-n-roll';

// using CommonJS modules
var log = require('log-n-roll');
```

The [UMD](https://github.com/umdjs/umd) build is also available on [unpkg](https://unpkg.com):

```html
<script src="https://unpkg.com/log-n-roll/dist/log-n-roll.umd.js"></script>
```

You can find the library on `window.log`.

## Usage

```javascript
const log = require('../dist/log-n-roll');

log.trace('Trace shows stacktrace');

// Using the built-in plugin
log.use(log.prefixer);
log.trace('Using any number of plugins adds to the stacktrace only one extra line');

log.info("By default, the level of the root logger is 'trace'. All messages are displayed");

// Loading the processor
let two = 2;
for (let i = 0; i < 1000000; i++) {
  two *= two;
  two = Math.sqrt(two);
}

log.debug('Debug shows the time difference from the last call of any logger method');
log.info('Placeholders are supported. Two = %s', two);
log.warn('Warn message');
log.error('Error message');

// Getting the named logger and setting its level to 'warn'
const child = log('child', 'warn');
child.info('Messages below the level of the logger are ignored');

child.level = 'info';
child.info('The level of the logger can be changed at any time');

child('anotherone').info('Any logger can be obtained from any logger');
log('anotherone').debug('Anotherone logger has extended the level from the "child" logger');
child('anotherone').info('Anotherone logger has extended the plugins props from the root (not child) logger');

child().info('Root logger can be obtained from any logger');
```

**Output:**
```
Trace: Trace shows stacktrace
    at Object.<anonymous> (C:\Users\u36\Dropbox\kutuluk\log-n-roll\examples\example.js:3:5)
    ...
Trace: [15:57:11] TRACE: Using any number of plugins adds to the stacktrace only one extra line
    at Function.trace (C:\Users\u36\Dropbox\kutuluk\log-n-roll\dist\log-n-roll.js:1:712)
    at Object.<anonymous> (C:\Users\u36\Dropbox\kutuluk\log-n-roll\examples\example.js:7:5)
    ...
[15:57:11] INFO: By default, the level of the root logger is 'trace'. All messages are displayed
[   +15ms] DEBUG: Debug shows the time difference from the last call of any logger method
[15:57:11] INFO: Placeholders are supported. Two = 2
[15:57:11] WARN: Warn message
[15:57:11] ERROR: Error message
[15:57:11] INFO (child): The level of the logger can be changed at any time
[15:57:11] INFO (anotherone): Any logger can be obtained from any logger
[15:57:11] INFO (anotherone): Anotherone logger has extended the plugins props from the root (not child) logger
[15:57:11] INFO: Root logger can be obtained from any logger
```

## Plugin examples

**stacktracer.js**
```javascript
function getStackTrace() {
  try {
    throw new Error();
  } catch (trace) {
    return trace.stack;
  }
}

module.exports = (logger, props) => {
  // Return noop plugin if stacktrace support is absent
  if (!getStackTrace()) {
    return () => {};
  }

  props = Object.assign(
    {
      levels: ['trace', 'warn', 'error'],
      depth: 3,
    },
    props,
  );

  return (state) => {
    if (!props.levels.some(level => level === state.label)) {
      return;
    }

    let stacktrace = getStackTrace();

    const lines = stacktrace.split('\n');
    lines.splice(0, 4);
    const { depth } = props;
    if (depth && lines.length !== depth + 1) {
      const shrink = lines.splice(0, depth);
      stacktrace = shrink.join('\n');
      if (lines.length) stacktrace += `\n    and ${lines.length} more`;
    } else {
      stacktrace = lines.join('\n');
    }

    state.stacktrace = stacktrace;
  };
};
```

**stacktrace.js**
```javascript
const log = require('../dist/log-n-roll');
const stacktracer = require('../src/plugins/stacktracer');

log.use(stacktracer);

const stacktracePrinter = () => (state) => {
  // eslint-disable-next-line no-console
  console.log(state.stacktrace);
};

log.use(stacktracePrinter);

(function StackTraceTest() {
  log.warn('test');
}());
```

**Output**
```
    at StackTraceTest (C:\Users\u36\Dropbox\kutuluk\log-n-roll\examples\stacktrace.js:14:7)
    at Object.<anonymous> (C:\Users\u36\Dropbox\kutuluk\log-n-roll\examples\stacktrace.js:15:2)
    at Module._compile (module.js:635:30)
    and 4 more
test
```

**log-to-file.js**
```javascript
const fs = require('fs');
const util = require('util');

module.exports = (logger, props) => {
  props = Object.assign(
    {
      file: 'app.log',
      roll: true,
    },
    props,
  );

  return (state) => {
    fs.appendFileSync(
      props.file,
      `${util.format(...state.args)}\n${state.stacktrace ? `${state.stacktrace}\n` : ''}`,
    );
    state.roll = props.roll;
  };
};
```

**transport.js**
```javascript
const log = require('../dist/log-n-roll');
const stacktracer = require('../src/plugins/stacktracer');
const logToFile = require('../src/plugins/log-to-file');

log.use(log.prefixer);
log.info('Hello, console!');

log.use(stacktracer);
log.use(logToFile, { file: 'my.log' });
log.info('Hello, file!');

log.use(logToFile, { roll: false });
log.trace('Goodbye, console!');
```

**Console output:**
```
[15:57:11] INFO: Hello, console!
[15:57:11] INFO: Hello, file!
```

**my.log:**
```
[15:57:11] INFO: Hello, file!
[15:57:11] TRACE: Goodbye, console!
    at Object.<anonymous> (C:\Users\u36\Dropbox\kutuluk\log-n-roll\examples\transport.js:13:5)
    at Module._compile (module.js:635:30)
    at Object.Module._extensions..js (module.js:646:10)
    and 4 more
```
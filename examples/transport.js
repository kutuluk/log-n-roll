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

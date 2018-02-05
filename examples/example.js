const log = require('../lib/log-n-roll');

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

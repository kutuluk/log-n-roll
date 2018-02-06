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

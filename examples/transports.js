const log = require('../lib/log-n-roll');
const fileTransport = require('../examples/filetransport');

log.use(log.prefixer);
log.use(fileTransport, { file: 'my.log' });

log.info('Hello, file!');

log.use(fileTransport, { console: false });

log.info('Goodbye, console!');

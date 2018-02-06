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

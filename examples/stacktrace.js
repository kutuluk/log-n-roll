const log = require('../dist/log-n-roll');
const stacktrace = require('../examples/plugins/log-stacktrace');

log.use(stacktrace);

const stacktracePrinter = () => (state) => {
  // eslint-disable-next-line no-console
  console.log(state.stacktrace);
};

log.use(stacktracePrinter);

(function StackTraceTest() {
  log.warn('test');
}());

/* eslint-disable no-console */

const noop = () => {};
const levels = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];

const plugins = [];
const properties = [];
const loggers = {};

// Build the best logging method possible for this env
// Wherever possible we want to bind, not wrap, to preserve stack traces
function nativeRoller() {
  return (level) => {
    if (typeof console === 'undefined') return noop;

    let nativeMethod = console[levels[level]] ? levels[level] : 'log';
    if (nativeMethod === 'debug') nativeMethod = 'log';

    return console[nativeMethod] ? console[nativeMethod].bind(console) : noop;
  };
}

function pluginsRoller(logger) {
  const loggerName = logger.sign;
  let prevTimestamp = 0;

  const rollers = [];
  plugins.forEach((plugin, index) => {
    const rootProps = properties[index][''];
    const loggerProps = properties[index][loggerName];
    if (rootProps || loggerProps) {
      rollers.push(plugin(logger, Object.assign({}, rootProps, loggerProps)));
    }
  });

  return (level) => {
    const label = levels[level];
    const nativeMethod = nativeRoller()(level);

    return (...args) => {
      const timestamp = Date.now();
      const delta = timestamp - (prevTimestamp || timestamp);
      prevTimestamp = timestamp;

      const state = {
        args,
        logger: loggerName,
        level,
        label,
        timestamp,
        delta,
        roll: true,
      };

      for (let i = 0; i < rollers.length; i++) {
        rollers[i](state);
        if (!state.roll) return;
      }
      nativeMethod(...state.args);
    };
  };
}

let roller = nativeRoller;

function rebuildMethods(logger) {
  const factory = roller(logger);
  for (let i = 0; i < levels.length - 1; i++) {
    logger[levels[i]] = i < logger.level ? noop : factory(i);
  }
}

function applyPlugin(logger, plugin, props) {
  if (typeof plugin !== 'function') {
    throw new Error(`Invalid plugin: ${plugin}`);
  }

  plugins.forEach((p, index) => {
    if (p === plugin) {
      plugin = index;
    }
  });

  if (typeof plugin !== 'number') {
    // lazy plugging
    plugin = plugins.push(plugin) - 1;
    properties[plugin] = {};
    roller = pluginsRoller;
  }

  properties[plugin][logger.sign] = Object.assign({}, properties[plugin][logger.sign], props);
  rebuildMethods(logger);
}

function getLogger(logName, logLevel) {
  const logger = (name, level) => {
    name = name || '';
    if (typeof name !== 'string') {
      throw new TypeError(`Invalid name: ${name}`);
    }

    return loggers[name] || getLogger(name, level || logger.level);
  };

  Object.defineProperties(logger, {
    sign: {
      get() {
        return logName;
      },
    },
    level: {
      get() {
        return logLevel;
      },
      set(newLevel) {
        let level = newLevel;

        if (typeof level === 'string') {
          level = levels.indexOf(level.toLowerCase());
        }

        if (typeof level === 'number' && level >= 0 && level < levels.length) {
          logLevel = level;
          rebuildMethods(logger);
        } else {
          throw new Error(`Invalid level: ${newLevel}`);
        }
      },
    },
    use: {
      value: applyPlugin.bind(null, logger),
      writable: false,
    },
  });

  logger.level = logLevel;
  loggers[logName] = logger;
  return logger;
}

const log = getLogger('', 0);

Object.defineProperties(log, {
  prefixer: {
    value: (logger, props) => {
      props = Object.assign(
        {
          format(state) {
            const timestamp = state.level === 1
              ? `${`      +${state.delta}`.slice(-6)}ms`
              : new Date(state.timestamp).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
            return `[${timestamp}] ${state.label.toUpperCase()}${state.logger ? ` (${state.logger})` : ''}:`;
          },
        },
        props,
      );

      return (state) => {
        const prefix = props.format(state);
        const { args } = state;
        if (args.length && typeof args[0] === 'string') {
          // concat prefix with first argument to support string substitutions
          args[0] = `${prefix} ${args[0]}`;
        } else {
          args.unshift(prefix);
        }
      };
    },
    writable: false,
  },
  levels: {
    get() {
      return levels.splice();
    },
  },
  api: {
    value: '0.1',
    writable: false,
  },
});

export default log;

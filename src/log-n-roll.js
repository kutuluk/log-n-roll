/* eslint-disable no-console */

const noop = () => {};
const { defineProperty } = Object;
const levels = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];

const plugins = [];
const properties = [];
const loggers = {};

// Build the best logging method possible for this env
// Wherever possible we want to bind, not wrap, to preserve stack traces
function nativeRoller() {
  return (level) => {
    let nativeMethod = console[levels[level]] ? levels[level] : 'log';
    if (nativeMethod === 'debug') nativeMethod = 'log';

    return console[nativeMethod].bind(console);
  };
}

function pluginsRoller(logger) {
  const loggerName = logger.sign;
  let prevTimestamp = 0;

  const wrappers = [];
  plugins.forEach((plugin, index) => {
    const rootProps = properties[index][''];
    const loggerProps = properties[index][loggerName];
    if (rootProps || loggerProps) {
      wrappers.push(plugin(logger, Object.assign({}, rootProps, loggerProps)));
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
        logger: loggerName,
        level,
        label,
        timestamp,
        delta,
      };

      for (let i = 0; i < wrappers.length; i++) {
        args = wrappers[i](args, state);
        if (!args) return;
      }
      nativeMethod(...args);
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

function prefixer(logger, props) {
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

  return (args, state) => {
    const prefix = props.format(state);
    if (args.length && typeof args[0] === 'string') {
      // concat prefix with first argument to support string substitutions
      args[0] = `${prefix} ${args[0]}`;
    } else {
      args.unshift(prefix);
    }
    return args;
  };
}

function getLogger(logName, logLevel) {
  function logger(name, level) {
    name = name || '';
    if (typeof name !== 'string') {
      throw new TypeError(`Invalid name: ${name}`);
    }

    return loggers[name] || getLogger(name, level || logger.level);
  }

  defineProperty(logger, 'sign', {
    get() {
      return logName;
    },
  });

  defineProperty(logger, 'level', {
    get() {
      return logLevel;
    },
    set(lvl) {
      let newLevel = lvl;

      if (typeof newLevel === 'string') {
        newLevel = levels.indexOf(newLevel.toLowerCase());
      }

      if (typeof newLevel === 'number' && newLevel >= 0 && newLevel < levels.length) {
        logLevel = newLevel;
        rebuildMethods(logger);
      } else {
        throw new Error(`Invalid level: ${lvl}`);
      }
    },
  });

  logger.use = (plugin, props) => {
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

    properties[plugin][logName] = Object.assign({}, properties[plugin][logName], props);
    rebuildMethods(logger);
  };

  logger.prefixer = prefixer;
  logger.level = logLevel;

  loggers[logName] = logger;
  return logger;
}

export default getLogger('', 0);

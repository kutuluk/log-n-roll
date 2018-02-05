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

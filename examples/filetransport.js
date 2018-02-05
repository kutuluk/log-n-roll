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
    fs.appendFileSync(props.file, `${util.format(...args)}\n`);
    if (props.console) return args;
    return null;
  };
};

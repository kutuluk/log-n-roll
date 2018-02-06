const fs = require('fs');
const util = require('util');

module.exports = (logger, props) => {
  props = Object.assign(
    {
      file: 'app.log',
      roll: true,
    },
    props,
  );

  return (state) => {
    fs.appendFileSync(
      props.file,
      `${util.format(...state.args)}\n${state.stacktrace ? `${state.stacktrace}\n` : ''}`,
    );
    state.roll = props.roll;
  };
};

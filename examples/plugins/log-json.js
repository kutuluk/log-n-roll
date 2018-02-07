module.exports = (logger, props) => (state) => {
  const json = {};

  const fields = Object.keys(props);
  fields.forEach((name) => {
    json[name] = typeof props[name] === 'function'
      ? props[name](state)
      : state[props[name]] || state[name];
  });

  state.json = JSON.stringify(json, null, '\t');
};

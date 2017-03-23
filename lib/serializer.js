const version = '1.0';

const Serializer = {
  serialize: idx => (
    JSON.stringify({
      version,
      fields: idx.fields,
      docs:   idx.docs,
      index:  idx.index,
    })
  ),
  deserialize: (json) => {
    const config = JSON.parse(json);

    if (config.version !== version) {
      throw new Error(`Can't deserialize from version ${config.version}`);
    }

    return config;
  },
};

export default Serializer;

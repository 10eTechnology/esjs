import expect from 'expect.js';

import normalize, { configValidatorMap } from '../../src/config/normalize';

// Iterate over configValidatorMap (expected config spec), pull out
// default values, and put into an object. This is a representation
// 'default' configuration.
const defaultConfig = Object.keys(configValidatorMap)
  .reduce((newConfig, field) => {
    const fieldConfig = configValidatorMap[field];

    if (Object.prototype.hasOwnProperty.call(fieldConfig, 'default')) {
      // eslint-disable-next-line no-param-reassign
      newConfig[field] = fieldConfig.default;
    }

    return newConfig;
  }, {});


describe('config normalizer / validator', () => {
  it('returns a config object with defult values via configValidatorMap',
     () => {
       expect(normalize({})).to.eql(defaultConfig);
     },
  );

  it('merges passed in config with default config', () => {
    const myConfig = {
      stopwords: true,
    };

    const expected = Object.assign({}, defaultConfig, { stopwords: true });

    expect(normalize(myConfig)).to.eql(expected);
  });

  it('merges passed in config with default config', () => {
    const fields = {
      name:        null,
      description: {
        boost:    1,
        analyzer: 'standard',
      },
    };

    const myConfig = {
      fields,
    };

    const expected = Object.assign({}, defaultConfig, { fields });

    expect(normalize(myConfig)).to.eql(expected);
  });

  it('throws if an invalid config option is given', () => {
    const fields = {
      description: {
        boost:    1,
        analyzer: 'unsupported',
      },
    };

    const myConfig = {
      fields,
    };

    expect(() => {
      normalize(myConfig);
    }).to.throwError();
  });

  it('throws if an invalid config option is given', () => {
    const fields = {
      description: {
        boost: 'BOOST!!',
      },
    };

    const myConfig = {
      fields,
    };

    expect(() => {
      normalize(myConfig);
    }).to.throwError();
  });

  it('throws if an invalid config option is given', () => {
    const myConfig = {
      stopwords: 'MATT DAMON',
    };

    expect(() => {
      normalize(myConfig);
    }).to.throwError();
  });
});

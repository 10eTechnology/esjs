import Validators from './validators';

export const configValidatorMap = {
  fields: {
    validate: Validators.shape({
      '*': Validators.oneOf([
        Validators.shape({
          boost:    Validators.number,
          analyzer: Validators.oneOf(['keyword', 'standard']),
        }),
        null,
      ]),
    }),
    default: {},
  },
  storeDocs: {
    validate: Validators.bool,
    default:  false,
  },
  allowPartial: {
    validate: Validators.bool,
    default:  false,
  },
  stopwords: {
    validate: Validators.bool,
    default:  false,
  },
};

/**
 * Given a config object, return a normalized verison with default
 * values.
 * @param {Object} config 
 * @return {Object} normalized config
 */
export default function normalize(config) {
  return Object.keys(configValidatorMap).reduce((newConfig, configKey) => {
    let configValue = config[configKey];
    const validatorMap = configValidatorMap[configKey];

    // Use default value specified in `configValidatorMap`, if exists
    if (
      typeof configValue === 'undefined' &&
      Object.prototype.hasOwnProperty.call(validatorMap, 'default')
    ) {
      configValue = validatorMap.default;
    }

    if (!validatorMap.validate(configValue)) {
      throw new Error(`Invalid value given for '${configKey}', ${configValue}`);
    }

    newConfig[configKey] = configValue; // eslint-disable-line no-param-reassign

    return newConfig;
  }, {});
}

/**
 * Given an array of allowable values, return a validator function
 * which compares given argument against allowable values.
 * Other validator functions are accepted as options. Validator 
 * functions have an arity of 1 and should return a boolean value.
 * 
 * @param {Array} options 
 * @return {Function} validator function
 */
export default function oneOf(options) {
  if (!Array.isArray(options)) {
    throw new Error(
      `oneOf must be given an array of options. ${typeof options} given`,
    );
  }

  /**
   * Validator function. Compare above options against given value.
   * Other validator functions are accepted as options.
   * 
   * @param {*} value
   * @return {boolean}
   */
  return function validate(value) {
    return options.some((option) => {
      // Allow validator functions
      if (typeof option === 'function') {
        return option(value);
      }

      // Otherwise, check strict equality
      return option === value;
    });
  };
}

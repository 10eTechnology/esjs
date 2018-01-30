/**
 * Given a shape descriptor object [the shape], return a function
 * which will execute validation validation rules upon each value
 * of given object. Shape should contain a mapping of object value
 * to validation function. Validation functions have an arity of 1
 * and should return a boolean value.
 * 
 * e.g.:
 * ```
 * shape({
 *   booleanField: value => typeof value === 'boolean',
 *   numberField: value => typeof value === 'number',
 * })
 * ```
 * @param {Object} shapeDescriptor 
 * @return {Function} curried validator function
 */
export default function shape(shapeDescriptor) {
  if (typeof shapeDescriptor !== 'object' || shapeDescriptor === null) {
    throw new Error(
      `Shape validator config expected an object. 
      ${typeof shapeDescriptor} given`,
    );
  }

  // Every key must correspond to a validator function
  Object.keys(shapeDescriptor).forEach((key) => {
    if (typeof shapeDescriptor[key] !== 'function') {
      throw new Error(`Invalid validator function given for ${key}`);
    }
  });

  /**
   * Validator function. Compare above option config against given
   * object.
   * 
   * @param {*} value
   * @return {boolean}
   */
  return function validate(value) {
    // No object given? Fail validation. `shape` MUST be an object.
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    return Object.keys(shapeDescriptor).every((field) => {
      const validateFn = shapeDescriptor[field];

      // '*' acts as a wildcard, which treats input values as a
      // string map, rather than a sealed object type. Effectively,
      // this allows passing in an object with arbitrary keys
      // whose values should all be of like-type.
      if (field === '*') {
        // Call the validation function on every object value
        return Object.values(value).every(valueItem => validateFn(valueItem));
      }

      if (!Object.prototype.hasOwnProperty.call(value, field)) {
        // Ignore nonexistent values
        return true;
      }

      return validateFn(value[field]);
    });
  };
}

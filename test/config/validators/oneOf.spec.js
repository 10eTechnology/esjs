import expect from 'expect.js';
import oneOf from '../../../src/config/validators/oneOf';
import bool from '../../../src/config/validators/bool';
import number from '../../../src/config/validators/number';

describe('oneOf validator', () => {
  it('throws an exception if an array is not given', () => {
    expect(() => oneOf(1)).to.throwError();
  });

  it('throws an exception if an array is not given', () => {
    expect(() => oneOf({ test: 'test' })).to.throwError();
  });

  it('returns true if one of the values exists in the given config array',
     () => {
       expect(oneOf([1, 2])(1)).to.be(true);
     });

  it(
    'returns false if one of the values doesnt exist in the given config array',
    () => {
      expect(oneOf([1, 2])(5)).to.be(false);
    });

  it('handles other validators', () => {
    expect(oneOf([bool, number])(5)).to.be(true);
  });

  it('handles other validators', () => {
    expect(oneOf([bool, number])(false)).to.be(true);
  });
});

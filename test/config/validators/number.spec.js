/* eslint-disable import/no-extraneous-dependencies */
import expect from 'expect.js';
/* eslint-enable import/no-extraneous-dependencies */
import number from '../../../src/config/validators/number';

describe('number validator', () => {
  it('returns true given number values', () => {
    expect(number(1)).to.be(true);
  });

  it('returns true given float values', () => {
    expect(number(1.38)).to.be(true);
  });

  it('returns false given string values', () => {
    expect(number('1')).to.be(false);
  });

  it('returns false given null values', () => {
    expect(number(null)).to.be(false);
  });

  it('returns false given undefined values', () => {
    expect(number(undefined)).to.be(false);
  });

  it('returns false given object values', () => {
    expect(number({})).to.be(false);
  });

  it('returns false given array values', () => {
    expect(number([])).to.be(false);
  });
});

import expect from 'expect.js';
import bool from '../../../src/config/validators/bool';

describe('bool validator', () => {
  it('returns true for boolean values', () => {
    expect(bool(true)).to.be(true);
  });

  it('returns true for boolean values', () => {
    expect(bool(false)).to.be(true);
  });

  it('returns false for string values', () => {
    expect(bool('test')).to.be(false);
  });

  it('returns false for number values', () => {
    expect(bool(5)).to.be(false);
  });

  it('returns false for null values', () => {
    expect(bool(null)).to.be(false);
  });

  it('returns false for undefined values', () => {
    expect(bool(undefined)).to.be(false);
  });

  it('returns false for object values', () => {
    expect(bool({})).to.be(false);
  });

  it('returns false for array values', () => {
    expect(bool([])).to.be(false);
  });
});

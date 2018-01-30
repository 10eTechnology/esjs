/* eslint-disable import/no-extraneous-dependencies */
import expect from 'expect.js';
/* eslint-enable import/no-extraneous-dependencies */
import Validators from '../../../src/config/validators';

describe('shape validator', () => {
  it('returns true when one field passes', () => {
    const v = Validators.shape({
      test: Validators.number,
    });

    expect(v({ test: 1 })).to.be(true);
  });

  it('returns false when one field fails', () => {
    const v = Validators.shape({
      test: Validators.number,
    });

    expect(v({ test: '1' })).to.be(false);
  });

  it('returns true when all values pass', () => {
    const v = Validators.shape({
      test:    Validators.number,
      enabled: Validators.bool,
    });

    expect(v({ test: 1, enabled: true })).to.be(true);
  });

  it('returns false when one value fails', () => {
    const v = Validators.shape({
      test:    Validators.number,
      enabled: Validators.bool,
    });

    expect(v({ test: 1, enabled: null })).to.be(false);
  });

  it('ignores nonexistent values', () => {
    const v = Validators.shape({
      test:    Validators.number,
      enabled: Validators.bool,
    });

    expect(v({ test: 1 })).to.be(true);
  });

  it('applies validators over maps', () => {
    const v = Validators.shape({
      '*': Validators.number,
    });

    expect(v({ test: 1, test2: 2, test3: 3 })).to.be(true);
  });

  it('applies validators over maps', () => {
    const v = Validators.shape({
      '*': Validators.number,
    });

    expect(v({ test: 1, test2: 2, test3: 'string' })).to.be(false);
  });

  it('handles nested maps', () => {
    const v = Validators.shape({
      '*': Validators.shape({
        boost:    Validators.number,
        analyzer: Validators.oneOf(['standard', 'keyword']),
      }),
    });

    expect(v({
      name: {
        boost:    1,
        analyzer: 'standard',
      },
    })).to.be(true);
  });

  it('handles nested maps', () => {
    const v = Validators.shape({
      '*': Validators.shape({
        boost:    Validators.number,
        analyzer: Validators.oneOf(['standard', 'keyword']),
      }),
    });

    expect(v({
      name: {
        boost:    1,
        analyzer: 'UNSUPPORTED',
      },
    })).to.be(false);
  });
});

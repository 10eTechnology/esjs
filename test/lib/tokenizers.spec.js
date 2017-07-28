/* eslint-disable import/no-extraneous-dependencies */
import expect from 'expect.js';
/* eslint-enable import/no-extraneous-dependencies */
import { StandardTokenizer, tokenCount } from '../../src/tokenizers';

describe('StandardTokenizer', () => {
  const input =
    'This.String. has#much punctions! They \'should\' be "removed"'
      .split(/\s+/);

  it('produces the expected output', () => {
    expect(StandardTokenizer.run(input)).to.eql([
      'this',
      'string',
      'has',
      'much',
      'punctions',
      'they',
      'should',
      'be',
      'removed',
    ]);
  });
});

describe('tokenCount', () => {
  const counts = tokenCount(['apple', 'pear', 'apple']);

  it('returns the expected counts', () => {
    expect(counts).to.eql({
      apple: 2,
      pear:  1,
    });
  });
});

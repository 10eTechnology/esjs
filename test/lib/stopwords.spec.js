/* eslint-disable import/no-extraneous-dependencies */
import expect from 'expect.js';
/* eslint-enable import/no-extraneous-dependencies */
import { Stopwords } from '../../lib/stopwords';

describe('Stopwords', () => {
  const input = [
    'a',
    'big',
    'red',
    'apple',
    'for',
    'me',
  ];

  it('produces the expected output', () => {
    expect(Stopwords.run(input)).to.eql([
      'big',
      'red',
      'apple',
    ]);
  });
});

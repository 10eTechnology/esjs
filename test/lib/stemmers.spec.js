/* eslint-disable import/no-extraneous-dependencies */
import expect from 'expect.js';
/* eslint-enable import/no-extraneous-dependencies */
import { PorterStemmer, SnowballStemmer } from '../../src/stemmers';

describe('PorterStemmer', () => {
  const input = [
    'running',
    'created',
    'leaving',
    'cats',
    'attainable',
    'archeology',
    'archeological',
    'possibly',
    'possible',
  ];

  it('produces the expected output', () => {
    expect(PorterStemmer.run(input)).to.eql([
      'run',
      'creat',
      'leav',
      'cat',
      'attain',
      'archeolog',
      'archeolog',
      'possibl',
      'possibl',
    ]);
  });
});

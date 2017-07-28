/* eslint-disable import/no-extraneous-dependencies */
import expect from 'expect.js';
/* eslint-enable import/no-extraneous-dependencies */
import Pipeline from '../../src/pipeline';

describe('Pipeline', () => {
  const input = 'This is a_string with $# white&space etc, running';

  describe('whitespace', () => {
    const pipes = ['whitespace'];

    it('splits on whitespace', () => {
      expect(Pipeline.run(input, pipes)).to.eql([
        'This',
        'is',
        'a_string',
        'with',
        '$#',
        'white&space',
        'etc,',
        'running',
      ]);
    });
  });

  describe('strip', () => {
    const pipes = ['whitespace', 'strip'];

    it('removes disallowed characters from the ends of words', () => {
      expect(Pipeline.run(input, pipes)).to.eql([
        'This',
        'is',
        'a_string',
        'with',
        'white&space',
        'etc',
        'running',
      ]);
    });
  });

  describe('tokenize', () => {
    const pipes = ['whitespace', 'strip', 'tokenize'];

    it('tokenizes the strings', () => {
      expect(Pipeline.run(input, pipes)).to.eql([
        'this',
        'is',
        'a',
        'string',
        'with',
        'white',
        'space',
        'etc',
        'running',
      ]);
    });
  });

  describe('stopwords', () => {
    const pipes = [
      'whitespace', 'strip', 'tokenize', 'stopwords',
    ];

    it('removes stopwords', () => {
      expect(Pipeline.run(input, pipes)).to.eql([
        'string',
        'white',
        'space',
        'running',
      ]);
    });
  });

  describe('stemmer', () => {
    const pipes = ['whitespace', 'strip', 'tokenize', 'stopwords', 'stemmer'];

    it('stems the strings', () => {
      expect(Pipeline.run(input, pipes)).to.eql([
        'string',
        'white',
        'space',
        'run',
      ]);
    });
  });
});

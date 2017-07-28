import { StandardTokenizer } from './tokenizers';
import { PorterStemmer } from './stemmers';
import { Stopwords } from './stopwords';
import charRegex from './charRegex';

const Whitespace = {
  run: input => String(input).split(/\s+/),
};

const startChars = new RegExp(`^${charRegex}`);
const endChars = new RegExp(`${charRegex}$`);
const StripChars = {
  run: input => input.reduce((words, word) => {
    const clean = word.replace(startChars, '').replace(endChars, '');

    if (clean) {
      words.push(clean);
    }

    return words;
  }, []),
};

const pipeMap = {
  whitespace: Whitespace,
  strip:      StripChars,
  tokenize:   StandardTokenizer,
  stemmer:    PorterStemmer,
  stopwords:  Stopwords,
};

const Pipeline = {
  run: (input, pipes) => pipes.reduce((s, pipe) => pipeMap[pipe].run(s), input),
};

export default Pipeline;

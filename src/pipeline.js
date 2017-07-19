import { StandardTokenizer } from './tokenizers';
import { PorterStemmer } from './stemmers';
import { Stopwords } from './stopwords';

const runWithMiddlewares = (input, middlewares) => {
  let output = String(input);

  middlewares.forEach((middleware) => {
    output = middleware.run(output);
  });

  return output;
};

const Pipeline = {
  run: (input) => {
    const middlewares = [
      StandardTokenizer,
      Stopwords,
      PorterStemmer,
    ];

    return runWithMiddlewares(input, middlewares);
  },
  runWithoutStopwords: (input) => {
    const middlewares = [
      StandardTokenizer,
      PorterStemmer,
    ];

    return runWithMiddlewares(input, middlewares);
  },
  tokenize: (input) => {
    const middlewares = [
      StandardTokenizer,
      Stopwords,
    ];

    return runWithMiddlewares(input, middlewares);
  },
  tokenizeWithoutStopwords: (input) => {
    const middlewares = [
      StandardTokenizer,
    ];

    return runWithMiddlewares(input, middlewares);
  },
};

export default Pipeline;

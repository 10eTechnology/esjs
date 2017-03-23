export { default as StandardTokenizer } from './tokenizers/StandardTokenizer';

export const tokenCount = (tokens) => {
  const count = {};

  tokens.forEach((token) => {
    if (!count[token]) {
      count[token] = 0;
    }

    count[token] += 1;
  });

  return count;
};

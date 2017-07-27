import stopwords from './stopwords/english';

// eslint-disable-next-line import/prefer-default-export
export const Stopwords = {
  run: input => input.filter(word => stopwords.indexOf(word) === -1),
};

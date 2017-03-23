import stopwords from './stopwords/english';

export const Stopwords = {
  run: input => input.filter(word => stopwords.indexOf(word) === -1),
};

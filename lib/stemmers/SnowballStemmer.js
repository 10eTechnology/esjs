import { stemword } from 'node-snowball';

const SnowballStemmer = {
  run: words => stemword(words, 'english'),
};

export default SnowballStemmer;

import { stemmer } from 'porter-stemmer';

const PorterStemmer = {
  run: words => words.map(w => stemmer(w)),
};

export default PorterStemmer;

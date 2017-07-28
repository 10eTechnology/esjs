import { stemmer } from 'porter-stemmer';

const PorterStemmer = {
  run: input => input.map(w => stemmer(w)),
};

export default PorterStemmer;

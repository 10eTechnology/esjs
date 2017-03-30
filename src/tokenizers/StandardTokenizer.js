const regexp =
  /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,-./:;<=>?@[\]^_`{|}~]/g;

const StandardTokenizer = {
  run: (input) => {
    const tokens = [];

    if (!input) {
      return tokens;
    }

    return input
      .replace(regexp, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t !== '');
  },
};

export default StandardTokenizer;

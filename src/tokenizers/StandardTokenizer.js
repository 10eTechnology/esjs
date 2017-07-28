import charRegex from '../charRegex';

const reTokens = new RegExp(charRegex, 'g');

const StandardTokenizer = {
  run: input => input.reduce((tokens, word) => {
    const clean = word
      .replace(reTokens, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(t => !!t);

    return (clean.length > 0) ? tokens.concat(clean) : tokens;
  }, []),
};

export default StandardTokenizer;

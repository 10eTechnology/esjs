import Pipeline from './pipeline';

export default class Search {
  static normalizeQuery(query) {
    if (typeof query === 'string') {
      return { must: { match: { _all: query } } };
    }

    return query;
  }

  static mergeMatches(a, b) {
    const merged = JSON.parse(JSON.stringify(a));

    Object.keys(b).forEach((id) => {
      if (!merged[id]) {
        merged[id] = 0;
      }

      merged[id] += b[id];
    });

    return merged;
  }

  static valueForType(query, indexType) {
    const valueKey = indexType === 'raw' ? 'value' : 'query';

    return Search.valueFromQuery(query, valueKey);
  }

  static valueFromQuery(query, key) {
    if (typeof query === 'string') {
      return query;
    }

    return query[key];
  }

  constructor(idx, query) {
    this.query = Search.normalizeQuery(query);
    this.idx = idx;

    this.idfCache = {};
  }

  search() {
    // return all docs if the must obj is empty
    const matches = this.filterResults(
      this.query.matchAll ? this.matchAll()
        : this.searchFields(this.query.must),
    );

    const results = [];

    Object
      .keys(matches)
      .forEach(id => results.push({ id, score: matches[id] }));

    results.sort((a, b) => (b.score - a.score));

    return results;
  }

  searchFields(queries) {
    let docs = {};

    const queriesArray = Array.isArray(queries) ? queries : [queries];

    queriesArray.forEach((q) => {
      Object.keys(q).forEach((type) => {
        const results = this[type](q[type]);

        docs = Search.mergeMatches(docs, results);
      });
    });

    return docs;
  }

  filterResults(results) {
    if (!this.query.filter) {
      return results;
    }
    if (Array.isArray(this.query.filter) && this.query.filter.length === 0) {
      return results;
    }

    const resultIds = Object.keys(results);

    if (resultIds.length === 0) {
      return results;
    }

    const filtersArray = Array.isArray(this.query.filter) ?
      this.query.filter : [this.query.filter];
    const resultsClone = Object.assign({}, results);

    filtersArray.forEach((filter) => {
      Object.keys(filter).forEach((operation) => {
        const filterResults = this[operation](filter[operation]);

        // Filter behavior should function as an AND operation.
        // Results from EVERY filter query should be present
        // in our initial result set.
        resultIds.forEach((id) => {
          if (typeof filterResults[id] === 'undefined') {
            delete resultsClone[id];
          }
        });
      });
    });

    return resultsClone;
  }

  matchAll() {
    const matches = {};

    Object.keys(this.idx.docs).forEach((id) => {
      matches[id] = 1;
    });

    return matches;
  }

  match(query) {
    return this.matchOnIndex(query, 'tokenized');
  }

  term(query) {
    return this.matchOnIndex(query, 'raw');
  }

  matchOnIndex(query, indexType) {
    let matches = {};
    const fields = this.fieldsFromQuery(query, indexType);

    Object.keys(fields).forEach((field) => {
      const results = this.matchField(field, fields[field], indexType);

      matches = Search.mergeMatches(matches, results);
    });

    return matches;
  }

  matchField(field, query, indexType) {
    const matches = {};

    query.tokens.forEach((token) => {
      const node = this.idx.getNode(field, token, indexType);

      if (node) {
        Object.keys(node.docs).forEach((id) => {
          matches[id] = this.scoreDoc({
            id,
            token,
            field,
            query,
            df: node.df,
            tf: node.docs[id].tf,
          });
        });
      }
    });

    return matches;
  }

  scoreDoc(matchInfo) {
    const idf = this.idf(matchInfo);
    const fn  = this.fieldNorm(matchInfo);
    const tf  = matchInfo.tf;
    const boost = matchInfo.query.boost;
    const score = idf * fn * tf * boost;

    return score;
  }

  idf(matchInfo) {
    const key = `${matchInfo.field}/${matchInfo.token}`;

    if (!this.idfCache[key]) {
      const docCount = this.idx.docCount();
      const df = matchInfo.df;
      const idf = 1 + Math.log(docCount / (df + 1));

      this.idfCache[key] = idf;
    }

    return this.idfCache[key];
  }

  fieldNorm(matchInfo) {
    const doc = this.idx.getDoc(matchInfo.id);
    const size = doc[matchInfo.field] ? doc[matchInfo.field].size : 0;

    if (size === 0) {
      return 1;
    }

    return 1 / Math.sqrt(size);
  }

  boostFromQuery(field, query) {
    if (typeof query === 'object' && query.boost) {
      return query.boost;
    }

    return this.idx.fieldBoost(field);
  }

  pipelineForType(type) {
    return (type === 'raw')
      ? this.idx.pipesForTerms()
      : this.idx.pipesForTokens();
  }

  tokenize(value, type) {
    const pipes = this.pipelineForType(type);

    return Pipeline.run(value, pipes);
  }

  fieldsFromQuery(query, indexType) {
    /* eslint-disable no-underscore-dangle */
    if (query._all) {
      return this.allFieldsQuery(query._all, indexType);
    }
    /* eslint-enable no-underscore-dangle */

    const fields = {};

    Object.keys(query).forEach((field) => {
      const value = Search.valueForType(query[field], indexType);
      const boost = this.boostFromQuery(field, query[field]);
      const tokens = this.tokenize(value, indexType);

      fields[field] = { tokens, boost };
    });

    return fields;
  }

  allFieldsQuery(query, indexType) {
    const fields = {};
    const value = Search.valueForType(query, indexType);
    const tokens = this.tokenize(value, indexType);

    Object.keys(this.idx.fields).forEach((field) => {
      const boost = this.boostFromQuery(field, query);

      fields[field] = { tokens, boost };
    });

    return fields;
  }
}

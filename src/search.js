import Pipeline from './pipeline';

// vanilla utilities
const keys = Object.keys;
const values = Object.values;
const isArray = Array.isArray;
const clone = item => (JSON.parse(JSON.stringify(item)));

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
    this.OPERATORS = {
      AND: 'and',
    };
    this.query = Search.normalizeQuery(query);
    this.idx = idx;
    this.idfCache = {};
    // register information about query filters onto instance
    this.filtersOperator = null;
    this.filtersArray = [];
    this.registerFilters();
  }

  registerFilters() {
    if (isArray(this.query.filter)) {
      this.filtersArray = this.query.filter;
    }

    if (typeof this.query.filter === 'object') {
      this.validateCompoundFilter();

      // set filter information
      this.filtersOperator = keys(this.query.filter)[0];
      this.filtersArray = values(this.query.filter)[0];
    }
  }

  validateCompoundFilter() {
    const filtersOperator = keys(this.query.filter)[0];
    const operatorSupported = (
      values(this.OPERATORS).indexOf(filtersOperator) > -1
    );
    const filtersArray = values(this.query.filter)[0];

    if (!operatorSupported || !isArray(filtersArray)) {
      throw Error('Invalid query syntax.');
    }
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

  static intersectMatches(docs, results) {
    const intersection = clone(docs);

    keys(docs).forEach((docID) => {
      if (!results[docID]) {
        delete intersection[docID];
      }
    });

    return intersection;
  }

  processANDFilters() {
    let docs = {};

    this.filtersArray.forEach((query, index) => {
      keys(query).forEach((type) => {
        const results = this[type](query[type]);

        // no intersections needed on first pass, return the results
        docs = (index === 0) ?
          results :
          Search.intersectMatches(docs, results);
      });
    });

    return docs;
  }

  getDocsForCompoundFilterQuery() {
    let docs = {};

    switch (this.filtersOperator) {
      case this.OPERATORS.AND:
        docs = this.processANDFilters();
        break;
      default:
        // TODO: Support more compound filter types
    }

    return docs;
  }

  filterResults(results) {
    if (isArray(this.filtersArray) && this.filtersArray.length === 0) {
      return results;
    }

    let docIds;

    if (this.filtersOperator) {
      docIds = keys(this.getDocsForCompoundFilterQuery());
    } else {
      docIds = keys(this.searchFields(this.filtersArray));
    }

    const filtered = {};

    keys(results).forEach((id) => {
      if (docIds.indexOf(id) !== -1) {
        filtered[id] = results[id];
      }
    });

    return filtered;
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

import Pipeline from './pipeline';
import Serializer from './serializer';
import { tokenCount } from './tokenizers';
import Search from './search';

export default class ESjs {

  constructor(config = {}, json = '') {
    this.fields = config ? config.fields : {};
    this.docs = {};
    this.index = { tokenized: {}, raw: {} };
    this.storeDocs = config ? config.storeDocs : false;
    this.allowPartial = config ? config.allowPartial : false;
    this.stopwords = config ? config.stopwords : true;

    if (json) {
      this.deserialize(json);
    }
  }

  serialize() {
    return Serializer.serialize(this);
  }

  deserialize(json) {
    const config = Serializer.deserialize(json);

    this.fields = config.fields;
    this.docs = config.docs;
    this.index = config.index;
  }

  addDocs(docs) {
    docs.forEach(doc => this.addDoc(doc));
  }

  addDoc(doc) {
    if (!doc.id) {
      throw new Error('documents must have an id attribute');
    }

    this.storeDoc(doc);
    this.indexDoc(doc);
  }

  search(query) {
    const results = new Search(this, query).search();

    return this.storeDocs ? this.hydrateResults(results) : results;
  }

  hydrateResults(results) {
    return results.map(result => (
      {
        id:    result.id,
        score: result.score,
        doc:   this.docs[result.id].doc,
      }
    ));
  }

  storeDoc(doc) {
    this.docs[doc.id] = {};

    if (this.storeDocs) {
      this.docs[doc.id].doc = JSON.parse(JSON.stringify(doc));
    }
  }

  updateDocFieldLength(doc, field, size) {
    if (!this.docs[doc.id][field]) {
      this.docs[doc.id][field] = {};
    }

    this.docs[doc.id][field].size = size;
  }

  indexDoc(doc) {
    Object.keys(this.fields).forEach((field) => {
      this.indexField(field, doc);
    });
  }

  ensureFieldIndex(field) {
    [
      'tokenized',
      'raw',
    ].forEach((type) => {
      if (!this.index[type][field]) {
        this.index[type][field] = {};
      }
    });
  }

  indexField(field, doc) {
    if (!doc[field]) {
      return;
    }

    this.ensureFieldIndex(field);
    this.addTokens(doc, field);
    this.addTerms(doc, field);
  }

  addTokens(doc, field) {
    const pipe = this.stopwords ? 'run' : 'runWithoutStopwords';
    const tokens = Pipeline[pipe](doc[field]);

    this.updateDocFieldLength(doc, field, tokens.length);
    this.addTokensWithCounts(doc, field, tokens);
  }

  addTerms(doc, field) {
    const pipe = this.stopwords ? 'tokenize' : 'tokenizeWithoutStopwords';
    const tokens = Pipeline[pipe](doc[field], {
      stopwords: this.stopwords,
    });

    this.addTokensWithCounts(doc, field, tokens, 'raw');
  }

  addTokensWithCounts(doc, field, tokens, type = 'tokenized') {
    const counts = tokenCount(tokens);

    Object.keys(counts).forEach((token) => {
      const tf = Math.sqrt(counts[token]);

      this.addToken(field, token, { id: doc.id, tf }, type);
    });
  }

  addToken(field, token, data, type = 'tokenized') {
    if (this.allowPartial) {
      this.addTokenSubstrings(field, token, data, type);
    }

    this.addTokenToNode(field, token, data, type);
  }

  addTokenSubstrings(field, token, data, type) {
    for (let i = 1; i < token.length; i += 1) {
      const str = token.substr(0, i);

      this.addTokenToNode(field, str, {
        id: data.id,
        tf: Math.sqrt(data.tf / str.length),
      }, type);
    }
  }

  addTokenToNode(field, token, data, type) {
    const node = this.getNode(field, token, type, true);

    if (!node.docs[data.id]) {
      node.docs[data.id] = { tf: data.tf };
      node.df += 1;
    } else {
      node.docs[data.id].tf = data.tf;
    }
  }

  fieldBoost(field) {
    if (this.fields[field] && this.fields[field].boost) {
      return this.fields[field].boost;
    }

    return 1;
  }

  docCount() {
    return Object.keys(this.docs).length;
  }

  getDoc(id) {
    return this.docs[id];
  }

  getNode(field, token, type = 'tokenized', create = false) {
    let i = 0;
    let idx = this.index[type][field];

    if (!idx) {
      return null;
    }

    while (i < token.length) {
      const c = token[i];

      if (!(c in idx)) {
        if (create) {
          idx[c] = { docs: {}, df: 0 };
        } else {
          return null;
        }
      }

      i += 1;
      idx = idx[c];
    }

    return idx;
  }
}

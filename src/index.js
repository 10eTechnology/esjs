import stringify from 'json-stable-stringify';
import Pipeline from './pipeline';
import Serializer from './serializer';
import { tokenCount } from './tokenizers';
import Search from './search';
import { normalize as normalizeConfig } from './config';

export default class ESjs {
  constructor(config = {}, json = '') {
    const normalizedConfig = normalizeConfig(config);

    this.fields = normalizedConfig.fields;
    this.docs = {};
    this.docHashMap = {}; // key is hash of the document
    this.docHashMapReverse = {}; // key is document id, value is document hash
    this.index = { tokenized: {}, raw: {} };
    this.storeDocs = normalizedConfig.storeDocs;
    this.allowPartial = normalizedConfig.allowPartial;
    this.stopwords = normalizedConfig.stopwords;

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
    const docHash = stringify(doc);

    if (docHash in this.docHashMap) {
      return;
    }

    this.storeDoc(doc);
    this.indexDoc(doc);

    this.docHashMap[docHash] = true;
    this.docHashMapReverse[doc.id] = docHash;
  }

  removeDoc(id) {
    if (!(id in this.docs)) {
      return;
    }

    this.removeDocFromIndexTree(id);
    delete this.docs[id];
    const docHash = this.docHashMapReverse[id];

    delete this.docHashMap[docHash];
    delete this.docHashMapReverse[id];
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
    if (doc.id in this.docs) {
      this.removeDoc(doc.id);
    }
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

    let analyzer = 'standard';

    if (this.fields[field] && this.fields[field].analyzer) {
      analyzer = this.fields[field].analyzer;
    }

    const analyzerToIndexOps = {
      keyword:  [this.addTerms],
      standard: [this.addTokens, this.addTerms],
    };

    analyzerToIndexOps[analyzer].forEach(op => op.call(this, doc, field));
  }

  pipesForTokens() {
    const pipes = ['whitespace', 'strip', 'tokenize', 'stopwords', 'stemmer'];

    // eventually could be more elaborate based on configuration
    return pipes.filter(pipe => this.stopwords || pipe !== 'stopwords');
  }

  addTokens(doc, field) {
    const pipes = this.pipesForTokens(field);
    const tokens = Pipeline.run(doc[field], pipes);

    this.updateDocFieldLength(doc, field, tokens.length);
    this.addTokensWithCounts(doc, field, tokens);
  }

  pipesForTerms() {
    const pipes = ['whitespace', 'strip', 'stopwords'];

    // eventually could be more elaborate based on configuration
    return pipes.filter(pipe => this.stopwords || pipe !== 'stopwords');
  }

  addTerms(doc, field) {
    const pipes = this.pipesForTerms(field);
    const tokens = Pipeline.run(doc[field], pipes);

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

  removeDocFromIndexTree(id) {
    [
      'tokenized',
      'raw',
    ].forEach((type) => {
      Object.keys(this.fields).forEach((field) => {
        this.removeDocFromNode(id, this.index[type][field]);
      });
    });
  }

  removeDocFromNode(id, node) {
    if (!node) {
      return;
    }
    Object.keys(node).forEach((key) => {
      if (key !== 'docs' && key !== 'df') {
        this.removeDocFromNode(id, node[key]);
      }
    });
    /* eslint-disable no-param-reassign */
    if (node.docs) {
      delete node.docs[id];
      // TODO: Cleanup leaf nodes without documents:
      //  https://github.com/10eTechnology/esjs/issues/14
    }
    /* eslint-enable no-param-reassign */
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

# esjs

Elasticsearch-ish inverse indexed search engine for Node.

## Quickstart

Install

```
yarn add https://github.com/10eTechnology/esjs
```

Use

```javascript

import ESjs from 'esjs';

const fields = {
  name:        { boost: 2 },
  description: { boost: 1 },
  job:         null,
  status:      { analyzer: 'keyword' },
};

const idx = new ESjs({ fields });

idx.addDoc({
  id: 1,
  name: 'Larry Jones',
  description: 'A nice guy',
  job: 'plumber',
  status: 'AVAILABLE',
});

idx.addDoc({
  id: 2,
  name: 'Moe Jones',
  description: "Larry's brother, a decent guy",
  job: 'architect',
  status: 'AVAILABLE',
});

idx.addDoc({
  id: 2,
  name: 'Curly Jones',
  description: "Moe's brother, a funny guy",
  job: 'mathematician',
  status: 'UNAVAILABLE',
});

idx.search('Larry');
idx.search({ must: { match: { _all: 'Larry' } } }); // equivalent
// [{ id: 1, score: 0.1 }, { id: 2, score: 0.05 }] (scores are not real)
idx.search({ must: { match: { name: 'Larry' } } });
// [{ id: 1, score: 0.9 }]
idx.search({
  must: {
    match: {
      name:        { query: 'Larry', boost: 5 },
      description: { query: 'guy', boost: 1 },
    },
  },
});
// [{ id: 1, score: 0.1 }, { id: 2, score: 0.05 }, { id: 3, score: 0.05 }]
idx.search({
  must: {
    match: { description: 'brother' },
    term:  { job: 'plumber' },
  },
});
// [{ id: 1, score: 0.1 }, { id: 2, score: 0.01 }, { id: 3, score: 0.01 }]
idx.search({
  must: {
    match: {
      name: 'Jones',
      description: 'brother',
    },
  },
  filter: [{
    term: { job: 'plumber' }
  }],
});
// []
idx.search({
  must: {
    match: {
      name: 'Jones',
    },
  },
  filter: [{
    term: { status: 'AVAILABLE' }, 
  }],
});
// [{ id: 1, score: 0.1 }, { id: 2, score: 0.1 }]
idx.search('AVAILABLE');
// []

const json = idx.serialize();
// JSON string suitable for persisting somewhere
serializedIndex = new idx(null, json);

serializedIndex.search('Larry');
```

You can save documents in the index and they will be returned in the results data:
```javascript
const idx = new ESjs({ fields, storeDocs: true });

// add some docs, then

idx.search('Larry');
// [{ id: 1, score: 0.9, doc: {...} }]
```

### Partial string matches

You can configure ESjs to search partial strings (from the beginning of each)
word, at the cost of a greatly increased index size.

Partial matches are penalized during the scoring phase, causing them to appear
below matches on full words.

```javascript
const idx = new ESjs({ fields, allowPartial: true });

// add some docs, then

idx.search('lar');
// [{ id: 1, score: 0.3 }]
```

### Turning off stopwords

You can turn off stopwords by setting `stopwords: false` in your configuration.

**This is a temporary implementation.  Configuring the tokenizer pipeline
will improve with time***

## Field analyzer

You may specify a custom `analyzer` per field with the `analyzer` config option.
```javascript
const fields = {
  status: { analyzer: 'keyword' },
};
```
Currently, the only analyzer supported is `keyword` or `standard`. This option defaults to `standard`.

### `standard`
Default behavior. Field will be searchable through text search or term filters.

### `keyword`

The `keyword` analyzer will *not* index specified field for text searching. The only way to surface results containing a `keyword` field is through the an exact match on a `filter` `term` query configuration.

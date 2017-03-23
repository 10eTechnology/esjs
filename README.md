# esjs

Elasticsearch-ish inverse indexed search engine for Node.

## Quickstart

Install

```
yarn add esjs
```

Use

```javascript

import ESjs from 'esjs';

const fields = {
  name:        { boost: 2 },
  description: { boost: 1 },
  age:         null,
  job:         null,
};

const idx = new ESjs({ fields });

const doc = {
  name: 'Larry',
  description: 'A nice guy',
};

idx.addDoc({
  id: 1,
  name: 'Larry Jones',
  description: 'A nice guy',
  age: 42,
  job: 'plumber',
});

idx.addDoc({
  id: 2,
  name: 'Frank Jones',
  description: "Larry's brother, a decent guy",
  age: 38,
  job: 'architect',
});

idx.search('Larry');
idx.search({ _any: 'Larry' }); // equivalent
// [{ id: 1, score: 0.1 }, { id: 2, score: 0.05 }]
idx.search({ name: 'Larry' });
// [{ id: 1, score: 0.9 }]
idx.search({
  name: { query: 'Larry', boost: 5 },
  description: { query: 'guy', boost: 1 },
});
// [{ id: 1, score: 0.1 }, { id: 2, score: 0.05 }]
idx.search({
  must: [{
    match: {
      name: 'Jones',
      description: 'brother',
    },
  }],
  filter: [{
    term: { job: 'plumber' }
  }],
});
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

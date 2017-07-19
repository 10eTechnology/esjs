/* eslint-disable import/no-extraneous-dependencies */
import expect from 'expect.js';
/* eslint-enable import/no-extraneous-dependencies */
import ESjs from '../src';
import serializedIndex from './fixtures/serialized-index.json';
import indexedDocs from './fixtures/indexed-docs.json';

const fields = {
  title: { boost: 1 },
  body:  { boost: 2 },
};

const docs = [{
  id:    1,
  title: 'title',
  body:  'body',
}];

const storedDocs = {};

docs.forEach((doc) => {
  storedDocs[doc.id] = { doc, title: { size: 1 }, body: { size: 1 } };
});

function storeDocs(config) {
  const idx = new ESjs(config);

  idx.addDocs(docs);

  return JSON.parse(idx.serialize());
}

function searchIds(results) {
  return results.map(result => result.id);
}


describe('.new()', () => {
  context('given an index configuration', () => {
    const idx = new ESjs({ fields });
    const json = JSON.parse(idx.serialize());

    it('stores the config', () => {
      expect(json.fields).to.eql(fields);
    });
  });

  context('given a seralized index', () => {
    const idx = new ESjs(null, JSON.stringify(serializedIndex));
    const json = JSON.parse(idx.serialize());

    it('loads the fields', () => {
      expect(json.fields).to.eql(serializedIndex.fields);
    });

    it('loads the docs', () => {
      expect(json.docs).to.eql(serializedIndex.docs);
    });

    it('loads the index', () => {
      expect(json.index).to.eql(serializedIndex.index);
    });
  });

  context('given a serialized index with the wrong version', () => {
    it('throws an error', () => {
      expect(() => {
        /* eslint-disable no-new */
        new ESjs(null, JSON.stringify({ version: '0.0' }));
        /* eslint-enable no-new */
      }).to.throwError("Error: Can't deserialize from version 0.0");
    });
  });
});

describe('.serialize()', () => {
  const json = storeDocs({ fields, storeDocs: true });

  it('serializes the version', () => {
    expect(json.version).to.equal('1.0');
  });

  it('serializes the fields', () => {
    expect(json.fields).to.eql(fields);
  });

  it('serializes the docs', () => {
    expect(json.docs).to.eql(storedDocs);
  });

  it('serializes the index', () => {
    expect(json.index.tokenized.title).to.be.ok();
    expect(json.index.raw.title).to.be.ok();
  });
});

describe('.addDoc()', () => {
  context('given a doc with no id', () => {
    it('throws an error', () => {
      const idx = new ESjs({ fields });
      let passed = false;

      try {
        idx.addDoc({ title: 'the title' });
        passed = true;
      } catch (e) {
        expect(e.toString())
          .to
          .equal('Error: documents must have an id attribute');
      }

      expect(passed).to.be(false);
    });
  });

  context('given storeDocs: false', () => {
    const json = storeDocs({ fields });

    it('indexes the docs', () => {
      expect(json.index).to.eql(indexedDocs);
    });

    it('does not store the docs', () => {
      expect(json.docs).to.eql(
        { 1: { title: { size: 1 }, body: { size: 1 } } },
      );
    });
  });

  context('given storeDocs: true', () => {
    const json = storeDocs({ fields, storeDocs: true });

    it('stores the docs', () => {
      expect(json.docs).to.eql(storedDocs);
    });
  });

  context('given a null field value', () => {
    const idx = new ESjs({ fields });

    it('does not throw an error', () => {
      expect(() => {
        idx.addDoc({ id: 1, title: 'title', body: null });
      }).not.to.throwError();
    });
  });

  context('given an integer field value', () => {
    const idx = new ESjs({ fields: { age: null } });

    it('does not throw an error', () => {
      expect(() => {
        idx.addDoc({ id: 1, age: 42 });
      }).not.to.throwError();
    });
  });
});

describe('.search()', () => {
  const searchFields = {
    title:    { boost: 3 },
    body:     { boost: 2 },
    category: null,
    unused:   null,
  };

  const searchDocs = [{
    id:       1,
    title:    'Reading Railroad on sale',
    body:     'The popular Reading Railroad goes on the auction block.',
    category: 'news',
  }, {
    id:       2,
    title:    'Mystery sale at Park Place apartments',
    body:     'Police responded today to a mysterious sign in the yard.',
    category: 'crime',
  }, {
    id:       3,
    title:    'Tickets on sale for festival on the Boardwalk this weekend',
    body:     'Popular music and delicious food to be enjoyed by all.',
    category: 'events',
  }, {
    id:       4,
    title:    'Special: I got out of jail for free!',
    body:     'Read about a life of crime in the Weekend journal.',
    category: 'crime',
  }];

  const idx = new ESjs({
    fields:       searchFields,
    storeDocs:    true,
    allowPartial: true,
  });

  idx.addDocs(searchDocs);

  context.only('given a partial string', () => {
    const results = idx.search('spe');

    it('returns the expected results', () => {
      expect(searchIds(results)).to.eql([4]);
    });
  });

  context('given a simple string', () => {
    const results = idx.search('sale');

    it('returns the expected results', () => {
      expect(searchIds(results)).to.eql([1, 2, 3]);
    });

    it('hydrates the docs', () => {
      expect(results[0].doc).to.eql(searchDocs[0]);
    });
  });

  context('given a simple multi term string', () => {
    const results = idx.search('mysterious sale');

    it('returns the expected results', () => {
      expect(searchIds(results)).to.eql([2, 1, 3]);
    });

    it('hydrates the docs', () => {
      expect(results[0].doc).to.eql(searchDocs[1]);
    });
  });

  context('given a stemmable string', () => {
    const results = idx.search('reading');

    it('returns the expected results', () => {
      expect(searchIds(results)).to.eql([1, 4]);
    });
  });

  context('given a query for all fields', () => {
    const results = idx.search({
      must: {
        match: { _all: 'weekend' },
      },
    });

    it('returns the expected results', () => {
      expect(searchIds(results)).to.eql([3, 4]);
    });
  });

  context('given a query that changes boosting', () => {
    const results = idx.search({
      must: {
        match: {
          title: {
            query: 'weekend',
            boost: 1,
          },
          body: {
            query: 'weekend',
            boost: 5,
          },
        },
      },
    });

    it('returns the expected results', () => {
      expect(searchIds(results)).to.eql([4, 3]);
    });
  });

  context('given a term query', () => {
    const results = idx.search({
      must: {
        match: {
          title: 'sale',
        },
        term: {
          category: {
            value: 'crime',
            boost: 3,
          },
        },
      },
    });

    it('returns the expected results', () => {
      expect(searchIds(results)).to.eql([2, 4, 1, 3]);
    });
  });

  context('given a query with filters', () => {
    const results = idx.search({
      must: {
        match: { _all: 'weekend' },
      },
      filter: {
        term: {
          category: 'crime',
        },
      },
    });

    it('returns the expected results', () => {
      expect(searchIds(results)).to.eql([3]);
    });
  });
});

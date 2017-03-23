/* eslint-disable import/no-extraneous-dependencies */
import 'babel-register';
import _ from 'lodash';
import Benchmark from 'benchmark';
/* eslint-enable import/no-extraneous-dependencies */
import ESjs from '../';
import docs from './docs.json';

const benchmark = Benchmark.runInContext({ _, process });
const suite = new benchmark.Suite();

const fields = {
  name:           { boost: 3 },
  status:         null,
  event_timezone: null,
  event_type:     null,
  event_datetime: null,
};

const idx = new ESjs({ fields });

suite
  .add('indexing data', () => {
    idx.addDocs(docs);
  })
  .add('search on simple string', () => {
    idx.search('tribute');
  })
  .add('search on query', () => {
    idx.search({
      must: {
        match: {
          name: {
            query: 'group',
            boost: 5,
          },
          status: 'live',
        },
      },
    });
  })
  .add('search on filtered query', () => {
    idx.search({
      must: {
        match: {
          name: 'magic',
        },
      },
      filter: {
        term: {
          event_type: 'concert',
        },
      },
    });
  })
  .on('cycle', (event) => {
    console.log(event.target.name);

    if (event.target.error) {
      console.log(event.target.error);
    } else {
      console.log(
        `mean of ${event.target.stats.sample.length} samples (seconds)`,
        event.target.stats.mean,
      );
      console.log('==================');
    }
  })
  .run();

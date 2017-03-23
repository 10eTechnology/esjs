/* eslint-disable import/no-extraneous-dependencies */
import expect from 'expect.js';
/* eslint-enable import/no-extraneous-dependencies */
import Pipeline from '../../lib/pipeline';

describe('Pipeline', () => {
  const input = 'The greatest show on Earth running!';

  it('produces the expected output', () => {
    expect(Pipeline.run(input)).to.eql([
      'greatest',
      'show',
      'earth',
      'run',
    ]);
  });
});

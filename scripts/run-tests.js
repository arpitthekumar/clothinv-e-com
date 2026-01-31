const assert = require('assert');
const { slugify } = require('../src/server/storage/impl/products.impl');

try {
  // Basic slugify behavior
  assert.strictEqual(slugify('Hello World'), 'hello-world');
  assert.strictEqual(slugify('   SPACES   '), 'spaces');
  assert.strictEqual(slugify('Special & Chars!'), 'special-chars');

  console.log('All slug tests passed');
  process.exit(0);
} catch (err) {
  console.error('Test failure', err);
  process.exit(1);
}

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {qaTestDesignAdvisor: advisor} = require('../web/test-design-advisor.js');
const ids = answers => advisor.recommend(answers).map(t => t.id);

test('task characteristics recommend complementary techniques', () => {
  assert.deepEqual(ids({limits: 'yes'}), ['bva', 'ep']);
  assert.deepEqual(ids({combinations: 'yes'}), ['pairwise']);
  assert.deepEqual(ids({conditions: 'yes'}), ['decision']);
  assert.deepEqual(ids({states: 'yes'}), ['state']);
  assert.deepEqual(ids({business: 'yes'}), ['decision', 'scenario']);
  assert.deepEqual(ids({limits: 'yes', states: 'yes'}), ['bva', 'ep', 'state']);
  const all = advisor.recommend(Object.fromEntries(advisor.questions.map(q => [q.id, 'yes'])));
  assert.equal(all.length, 6);
  assert.equal(all.find(t => t.id === 'decision').reasons.length, 2);
});

test('negative, unknown and missing answers do not invent recommendations; edits recompute', () => {
  for (const value of ['no', 'unknown', undefined, 'invalid']) {
    assert.deepEqual(ids(Object.fromEntries(advisor.questions.map(q => [q.id, value]))), []);
  }
  const answers = {states: 'yes'};
  assert.deepEqual(ids(answers), ['state']);
  answers.states = 'no';
  assert.deepEqual(ids(answers), []);
});

test('configuration has complete content and real qaHelp topic links', () => {
  const context = vm.createContext({window: {qaModules: {}}});
  vm.runInContext(fs.readFileSync('web/modules/test-design.js', 'utf8'), context);
  const anchors = context.window.qaModules['test-design'].topics.map(t => t.id);
  assert.equal(new Set(advisor.questions.map(q => q.id)).size, advisor.questions.length);
  assert.equal(new Set(advisor.techniques.map(t => t.id)).size, advisor.techniques.length);
  for (const rule of advisor.rules) {
    assert.ok(advisor.questions.some(q => q.id === rule.question));
    assert.ok(rule.reason);
    rule.recommends.forEach(id => assert.ok(advisor.techniques.some(t => t.id === id)));
  }
  for (const technique of advisor.techniques) {
    assert.ok(technique.example && technique.steps.length && technique.mistakes.length);
    assert.equal(technique.href.split('#')[0], '/test-design');
    assert.ok(anchors.includes(technique.href.split('#')[1]));
  }
});

test('advisor assets are served as JavaScript', async () => {
  const base = process.env.QA_BASE_URL || 'http://127.0.0.1:8081';
  for (const file of ['test-design-advisor.js', 'test-design-advisor-ui.js']) {
    const response = await fetch(base + '/' + file);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/javascript/);
  }
});

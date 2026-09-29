const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');
const context = vm.createContext({window:{}, URL, Map});
for (const file of ['web/data.js','web/knowledge.js', ...fs.readdirSync('web/modules').map(file => 'web/modules/'+file)]) {
  vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const {qaData,qaKnowledge,qaModules} = context.window;
const catalog = qaData.sections;
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:8081';
const contents = catalog.map(meta => meta.id === 'http-codes' ? {
  topics: qaData.httpGroups.map(g => ({id:'codes-'+g.prefix,title:g.prefix+' '+g.title,blocks:[{type:'table',headers:['Код','Название','Описание'],rows:g.codes}]}))
} : qaModules[meta.id]);
const index = qaKnowledge.index(catalog,contents);

test('22 unique modules; valid structured content and links', () => {
  assert.equal(catalog.length,22);
  assert.equal(new Set(catalog.map(m => m.id)).size,22);
  assert.equal(new Set(catalog.map(m => m.href)).size,22);
  assert.equal(qaData.httpGroups.flatMap(g => g.codes).length,25);
  const types = new Set(['paragraph','list','table','code','note','diagram','links','checklist']);
  for (const [i,meta] of catalog.entries()) {
    assert.equal(meta.href,'/'+meta.id);
    if (meta.file) assert.ok(fs.existsSync('web'+meta.file));
    const content = contents[i];
    assert.ok(content.topics.length >= 3,meta.id);
    assert.equal(new Set(content.topics.map(t => t.id)).size,content.topics.length,meta.id);
    if (!['http-codes','glossary','what-to-test'].includes(meta.id)) assert.ok(content.topics.some(t => t.id === 'checklist'),meta.id);
    for (const topic of content.topics) {
      assert.match(topic.id,/^[a-z0-9-]+$/);
      assert.ok(topic.title && topic.blocks.length);
      for (const block of topic.blocks) {
        assert.ok(types.has(block.type));
        assert.ok(qaKnowledge.blockText(block).length > 0);
        if (block.type === 'table') assert.ok(block.rows.every(row => row.length === block.headers.length),meta.id);
        if (block.type === 'links') for (const [,href] of block.items) assert.ok(catalog.some(m => m.href === href));
      }
    }
  }
  assert.doesNotMatch(fs.readFileSync('README.md','utf8'),/^(<<<<<<<|=======|>>>>>>>)/m);
});

test('search: titles, examples, multiple words, case, ё, empty and absent terms', () => {
  assert.equal(qaKnowledge.search(index,'').length,0);
  assert.equal(qaKnowledge.search(index,'неттакогослова123456').length,0);
  assert.ok(qaKnowledge.search(index,'SQL')[0].module.includes('SQL'));
  assert.ok(qaKnowledge.search(index,'SELECT COALESCE').some(r => r.href === '/sql#join'));
  assert.ok(qaKnowledge.search(index,'PRESERVE LOG').some(r => r.href.startsWith('/devtools#')));
  assert.ok(qaKnowledge.search(index,'404').some(r => r.href === '/http-codes#codes-4xx'));
  assert.equal(qaKnowledge.search(index,'отчет').length,qaKnowledge.search(index,'отчёт').length);
  assert.ok(qaKnowledge.search(index,'отчёт').length > 0);
  assert.ok(qaKnowledge.excerpt('x '.repeat(200)+'needle '+ 'z '.repeat(100),'needle').includes('needle'));
  assert.equal(qaKnowledge.search(index,'<script>alert(1)</script>').length,0);
});

test('HTTP pages, assets, HEAD, 404, 405 and encoded traversal', async () => {
  const paths = ['/', '/practice', '/styles.css','/data.js','/knowledge.js','/app.js',...catalog.map(m => m.href),...catalog.filter(m => m.file).map(m => m.file)];
  for (const path of paths) {
    const response = await fetch(base+path);
    assert.equal(response.status,200,path);
    const type = path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html';
    assert.ok(response.headers.get('content-type').startsWith(type),path);
    const body = await response.text(); assert.ok(body.length > 100,path);
    const head = await fetch(base+path,{method:'HEAD'});
    assert.equal(head.status,200); assert.equal(await head.text(),'');
  }
  for (const path of ['/missing','/modules/missing.js','/modules/%2e%2e%2fsrc%2fMain.java','/module.html']) {
    assert.equal((await fetch(base+path)).status,404,path);
  }
  const post = await fetch(base+'/sql',{method:'POST'});
  assert.equal(post.status,405); assert.equal(post.headers.get('allow'),'GET, HEAD');
});

// Execute the documented queries against the same small SQLite dataset.
test('SQL examples produce the documented rows and rollback restores data', () => {
  const {DatabaseSync} = require('node:sqlite');
  const db = new DatabaseSync(':memory:');
  const sql = qaModules.sql;
  const examples = id => sql.topics.find(t => t.id === id).blocks.filter(b => b.type === 'code').map(b => b.text);
  try {
    db.exec(examples('dataset')[0]);
    assert.deepEqual(db.prepare("SELECT id, amount FROM orders WHERE status = 'paid' AND amount >= 100 ORDER BY amount DESC, id ASC").all().map(r => [r.id,r.amount]),[[103,200],[101,100]]);
    assert.equal(db.prepare('SELECT name FROM users WHERE email IS NULL').get().name,'Анна');
    const joined = db.prepare(examples('join')[0]).all().map(r => [r.name,r.order_count,r.total]);
    assert.deepEqual(joined,[['Анна',2,150],['Борис',0,0],['Вера',1,200]]);
    const aggregate = db.prepare(examples('join')[1]).get();
    assert.equal(aggregate.status,'paid'); assert.equal(aggregate.count,2); assert.equal(aggregate.average,150);
    db.exec(examples('write')[0]);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM orders').get().n,3);
    assert.equal(db.prepare('SELECT COUNT(email) AS n FROM users').get().n,2);
  } finally { db.close(); }
});

test('ready-made checklists: 17 scenarios, stable IDs and searchable expectations', () => {
 const scenarios=qaModules['what-to-test'].topics;
 const kindSet=new Set(['positive','negative','boundary','ui-ux','technical']);
 for(const s of scenarios){
  const covered=new Set(s.blocks[0].items.flatMap(i=>i.kinds));
  for(const kind of kindSet)assert.ok(covered.has(kind),s.id+' '+kind);
 }

 assert.equal(scenarios.length,17);
 assert.equal(scenarios[0].id,'login');
 assert.equal(scenarios[0].blocks[0].items.length,15);
 for(const scenario of scenarios) {
  const items=scenario.blocks[0].items;
  assert.ok(items.length>=15);
  assert.equal(new Set(items.map(i=>i.id)).size,items.length);
  items.forEach(i=>assert.ok(i.id && i.title && i.expected));
 }
 assert.ok(qaKnowledge.search(index,'Remember me').some(r=>r.href==='/what-to-test#login'));
 assert.ok(qaKnowledge.search(index,'високосном').some(r=>r.href==='/what-to-test#dates'));
});

test('checklist search and Markdown/plain text export',()=>{
 const local=vm.createContext({window:{},document:{body:{dataset:{}}}});
 vm.runInContext(fs.readFileSync('web/checklists.js','utf8'),local);
 const tools=local.window.qaChecklistTools, scenarios=qaModules['what-to-test'].topics;
 assert.equal(tools.find(scenarios,'').length,17);
 assert.equal(tools.find(scenarios,'','sorting').length,1);
 assert.equal(tools.find(scenarios,'nothing-123').length,0);
 assert.ok(tools.find(scenarios,'remember ME').some(r=>r.scenario.id==='login'));
 assert.equal(tools.find(scenarios,'remember','forms').length,0);
 assert.ok(tools.find(scenarios,'срок код','email').length);
 assert.equal(tools.find(scenarios,'отчет').length,tools.find(scenarios,'отчёт').length);
 const scenario={title:'Title *x*',blocks:[{items:[{id:'a',title:'[item]',expected:'<b>safe</b>'}]}]};
 const plain=tools.exportText(scenario,new Set(['a']),'text');
 const md=tools.exportText(scenario,new Set(['a']),'markdown');
 assert.ok(plain.startsWith('Title *x*'));
 assert.ok(plain.includes('[x] [item] — <b>safe</b>'));
 assert.ok(md.startsWith('# Title '));
 assert.ok(md.includes('- [x] '));
 assert.ok(!md.includes('<b>'));
 assert.ok(md.includes(String.fromCharCode(92)+'['));
});

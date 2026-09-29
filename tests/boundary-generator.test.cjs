const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('web/boundary-generator.js','utf8'),context);
const b=context.window.qaBoundary;
const points=o=>Array.from(b.generate(o).rows,r=>r.value);
test('six standard points, range classes and copy values',()=>{
 const r=b.generate({min:'3',max:'50'});
 assert.deepEqual(points({min:'3',max:'50'}),['2','3','4','49','50','51']);
 assert.deepEqual(Array.from(r.rows,p=>p.inside),[false,true,true,true,true,false]);
 assert.equal(b.values(r),'2\n3\n4\n49\n50\n51');
 assert.equal((b.checklist(r).match(/^- \[ \]/gm)||[]).length,6);
 assert.ok(r.rows.every(p=>p.title && p.explanation));
});
test('negative bounds and decimals are exact, with explicit default and custom step',()=>{
 assert.deepEqual(points({min:'-5',max:'-2'}),['-6','-5','-4','-3','-2','-1']);
 assert.deepEqual(points({min:'0.1',max:'0.3',step:'0.1'}),['0','0.1','0.2','0.2','0.3','0.4']);
 assert.deepEqual(points({min:'0.1',max:'0.3'}),['-0.9','0.1','1.1','-0.7','0.3','1.3']);
 assert.deepEqual(points({min:'-0,10',max:'0,10',step:'0,01'}),['-0.11','-0.1','-0.09','0.09','0.1','0.11']);
 assert.equal(points({min:'999999999999999999999999999999',max:'999999999999999999999999999999'})[5],'1000000000000000000000000000000');
 assert.equal(points({min:'0.000000000001',max:'0.000000000002',step:'0.000000000001'})[5],'0.000000000003');
});
test('equal and narrow ranges retain duplicate roles and classify actual values',()=>{
 const r=b.generate({min:'5',max:'5'});assert.equal(r.equal,true);
 assert.deepEqual(Array.from(r.rows,p=>p.value),['4','5','6','4','5','6']);assert.ok(r.rows.every(p=>p.duplicate));
 assert.deepEqual(Array.from(r.rows,p=>p.inside),[false,true,false,false,true,false]);
 const narrow=b.generate({min:'1',max:'1.1'});assert.equal(narrow.rows[2].inside,false);assert.equal(narrow.rows[3].inside,false);
});
test('length mode generates exact ASCII strings, handles zero and equal bounds',()=>{
 const r=b.generate({mode:'length',min:3,max:50});
 assert.deepEqual(JSON.parse(b.values(r)).map(s=>s.length),[2,3,4,49,50,51]);
 assert.ok(r.rows.every(p=>p.text==='A'.repeat(+p.value)));
 const zero=b.generate({mode:'length',min:0,max:0});assert.equal(zero.rows[0].possible,false);assert.equal(zero.rows[0].text,null);
 assert.deepEqual(JSON.parse(b.values(zero)),['','A','','A']);
 assert.equal((b.checklist(zero).match(/^- \[ \]/gm)||[]).length,4);assert.match(b.checklist(zero),/отрицательная длина невозможна/);
 const max=b.generate({mode:'length',min:10000,max:10000});assert.equal(max.rows[5].text.length,10001);
});
test('missing, malformed, reversed bounds and invalid step produce useful errors',()=>{
 assert.throws(()=>b.generate({max:5}),/Укажите min/);assert.throws(()=>b.generate({min:5}),/Укажите max/);
 for(const value of ['', ' ', '1e3','NaN','Infinity','abc','1.2.3','0.1234567890123'])assert.throws(()=>b.generate({min:value,max:5}));
 for(const step of ['',0,-1,'no'])assert.throws(()=>b.generate({min:1,max:5,step}));
 for(const mode of ['number','length'])assert.throws(()=>b.generate({mode,min:6,max:5}),/min не должен/);
 for(const min of [-1,1.5,10001,'','NaN'])assert.throws(()=>b.generate({mode:'length',min,max:10000}));
 assert.throws(()=>b.generate({mode:'unknown',min:0,max:1}));
});
test('links resolve in both directions and generator is globally searchable',()=>{
 const ctx=vm.createContext({window:{},URL,Map});
 for(const file of ['web/data.js','web/knowledge.js','web/modules/toolbox.js','web/modules/test-design.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 const {qaModules,qaKnowledge,qaData}=ctx.window;
 const tool=qaModules.toolbox.topics.find(t=>t.id==='boundary-value-generator');
 const theory=qaModules['test-design'].topics.find(t=>t.id==='boundaries');
 assert.ok(tool.blocks.some(b=>b.type==='links' && b.items.some(i=>i[1]==='/test-design#boundaries')));
 assert.ok(theory.blocks.some(b=>b.type==='links' && b.items.some(i=>i[1]==='/toolbox#boundary-value-generator')));
 const catalog=qaData.sections.filter(s=>['toolbox','test-design'].includes(s.id));
 const index=qaKnowledge.index(catalog,catalog.map(s=>qaModules[s.id]));
 assert.ok(qaKnowledge.search(index,'Boundary Value').some(r=>r.href==='/toolbox#boundary-value-generator'));
});

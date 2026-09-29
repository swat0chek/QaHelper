const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({window:{qaModules:{}},TextEncoder,TextDecoder,atob,btoa,crypto,Intl});
for(const file of ['web/toolbox-core.js','web/modules/toolbox.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const run=context.window.qaToolbox.run;
test('all 11 configured examples run locally',()=>{
 const tools=context.window.qaModules.toolbox.tools.filter(t=>!t.renderer);assert.equal(tools.length,11);
 for(const t of tools)assert.equal(typeof run(t.id,t.example[0],t.example[1]||'',t.modes[0]?.[0]||''),'string',t.id);
});
test('JSON formatting, minify, invalid syntax and precision guard',()=>{
 assert.equal(run('json-format','{"x":1}'),'{\n  "x": 1\n}');
 assert.equal(run('json-minify','{ "x": 1 }'),'{"x":1}');
 for(const a of ['','{x:1}','{"a":NaN}','9007199254740993','1e400'])assert.throws(()=>run('json-format',a));
});
test('structural JSON diff handles order, arrays, null, prototypes and escaped paths',()=>{
 assert.equal(run('json-diff','{"a":1,"b":2}','{"b":2,"a":1}'),'Различий нет');
 const d=JSON.parse(run('json-diff','{"a/b":null,"__proto__":1}','{"a/b":false,"x~":2}'));
 assert.deepEqual(d.map(x=>x.path),['/a~1b','/__proto__','/x~0']);
 assert.match(run('json-diff','[1,2]','[2,1]'),/changed/);
 assert.match(run('json-diff','null','{}'),/changed/);
});
test('line diff preserves whitespace and bounds work',()=>{
 assert.equal(run('text-diff','a\r\nb','a\nb'),'Различий нет');
 assert.equal(run('text-diff','a\nb','a\nc'),'  a\n- b\n+ c');
 assert.notEqual(run('text-diff','a','a\n'),'Различий нет');
 assert.throws(()=>run('text-diff','\n'.repeat(400),''));
});
test('UTF-8 Base64 and URL round trips; malformed encodings',()=>{
 const value='Привет 👩‍💻 + / &';
 for(const id of ['base64','url'])assert.equal(run(id,run(id,value,'','encode'),'','decode'),value);
 for(const a of ['%%%','a','AB==','/w=='])assert.throws(()=>run('base64',a,'','decode'));
 assert.throws(()=>run('url','%E0%A4','','decode'));
 assert.equal(run('url','a+b','','decode'),'a+b');
});
test('UUID v4 count and uniqueness',()=>{
 const values=run('uuid','100').split('\n');assert.equal(new Set(values).size,100);
 values.forEach(x=>assert.match(x,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/));
 for(const n of ['','0','101','1.2'])assert.throws(()=>run('uuid',n));
});
test('timestamp units, timezone, negative fractions and invalid dates',()=>{
 assert.match(run('timestamp','0','','seconds'),/1970-01-01T00:00:00.000Z/);
 assert.match(run('timestamp','-0.001','','seconds'),/1969-12-31T23:59:59.999Z/);
 assert.match(run('timestamp','2026-01-01T03:00:00+03:00','','date'),/2026-01-01T00:00:00.000Z/);
 for(const a of ['2026-02-29T00:00:00Z','2026-02-30T00:00:00Z','2026-01-01','2026-01-01T24:00:00Z'])assert.throws(()=>run('timestamp',a,'','date'));
 assert.throws(()=>run('timestamp','8640000000000001','','milliseconds'));
});
test('Unicode counters distinguish UTF16, code points, graphemes and bytes',()=>{
 assert.equal(run('characters','👩‍💻'),'UTF-16 code units: 5\nUnicode code points: 3\nГрафемы: 1');
 assert.equal(run('bytes','👩‍💻'),'UTF-8 bytes: 11');
 assert.equal(run('bytes',''),'UTF-8 bytes: 0');
});
test('JWT decoder requires object segments, does not claim signature verification',()=>{
 const sample=context.window.qaModules.toolbox.tools.find(x=>x.id==='jwt').example[0];
 const decoded=JSON.parse(run('jwt',sample));assert.equal(decoded.payload.sub,'qa-demo');assert.match(decoded.notice,/НЕ проверена/);
 for(const value of ['','a.b.c.d.e','e30.W10.','e30.%%%%.','e30.e30.*'])assert.throws(()=>run('jwt',value));
 assert.throws(()=>run('bytes','x'.repeat(100001)));
});
test('large diffs and deep JSON fail predictably',()=>{
 const many=JSON.stringify(Object.fromEntries(Array.from({length:2001},(_,i)=>['k'+i,i])));
 assert.throws(()=>run('json-diff','{}',many),/2000/);
 assert.throws(()=>run('json-format','['.repeat(102)+'0'+']'.repeat(102)),/100/);
});

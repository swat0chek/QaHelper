const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({window:{},crypto});
vm.runInContext(fs.readFileSync('web/data-generator.js','utf8'),context);
const g=context.window.qaGenerator;
const values=o=>g.generate(o).map(row=>row.value);
test('all eleven data types have count, descriptions and serializable results',()=>{
 assert.equal(g.types.length,11);
 for(const type of g.types){
  const rows=g.generate({type:type.id,count:7});assert.equal(rows.length,7);
  assert.ok(rows.every(row=>row.title && row.help));
  assert.equal(JSON.parse(g.copyAll(rows)).length,7);
 }
});
test('generated contact/network fixtures stay in documented test ranges',()=>{
 const cases={email:/^qa\.[a-f0-9-]+@example\.test$/,phone:/^\+120255501\d{2}$/,uuid:/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,ipv4:/^192\.0\.2\.\d+$/,url:/^https:\/\/example\.test\/qa\/[a-f0-9-]+\?source=test$/};
 for(const [type,pattern] of Object.entries(cases))values({type,count:100}).forEach(value=>assert.match(value,pattern));
 values({type:'ipv4',count:100}).forEach(value=>assert.ok(+value.split('.')[3]>=1 && +value.split('.')[3]<=254));
});
test('numbers respect inclusive negative bounds and reject invalid ranges',()=>{
 assert.deepEqual(Array.from(values({type:'number',min:-5,max:-5,count:3})),[-5,-5,-5]);
 values({type:'number',min:-20,max:20,count:100}).forEach(value=>assert.ok(Number.isInteger(value) && value>=-20 && value<=20));
 for(const options of [{min:5,max:4},{min:1.5},{max:1000000001},{min:''}])assert.throws(()=>g.generate({type:'number',...options}));
});
test('string and JSON label lengths, list types and export preserve actual data',()=>{
 for(const length of [0,1,50,10000])assert.ok(values({type:'string',length,count:2}).every(value=>value.length===length));
 const rows=g.generate({type:'json',length:30,count:2});assert.equal(rows[0].value.label.length,30);
 assert.equal(typeof rows[0].value.active,'boolean');assert.equal(typeof rows[0].value.score,'number');
 assert.deepEqual(JSON.parse(g.copyAll(rows)),JSON.parse(JSON.stringify(rows.map(r=>r.value))));
 assert.ok(values({type:'list',itemType:'number',min:7,max:7,count:3}).every(value=>value===7));
 assert.throws(()=>g.generate({type:'list',itemType:'list'}));
});
test('dates validate leap days, inclusivity, order and bounds without local timezone',()=>{
 assert.equal(values({type:'date',start:'2024-02-29',end:'2024-02-29',count:1})[0],'2024-02-29');
 values({type:'date',start:'1900-01-01',end:'1900-01-10',count:100}).forEach(value=>assert.ok(value>='1900-01-01' && value<='1900-01-10'));
 for(const options of [{start:'2025-02-29'},{start:'2025-04-31'},{start:'2026-02-02',end:'2026-02-01'},{end:'2101-01-01'},{start:''}])assert.throws(()=>g.generate({type:'date',...options}));
});
test('all twelve edge cases are explained, literal and losslessly copied',()=>{
 const rows=g.generate({mode:'edge',count:12,longLength:50});assert.equal(g.edges.length,12);
 assert.ok(rows.every(row=>row.help));assert.equal(rows[0].value,'');assert.equal(rows[1].value,' ');assert.equal(rows[2].value,'   ');
 assert.equal(rows[8].value.length,50);assert.equal(rows[9].value,'Первая строка\nВторая строка');
 assert.equal(rows[10].value,'<b>QA example</b>');assert.equal(g.text(rows[0].value),'');
 const restored=JSON.parse(g.copyAll(rows));assert.deepEqual(restored,Array.from(rows,r=>r.value));
 const cycle=g.generate({mode:'edge',count:13});assert.equal(cycle[0].value,cycle[12].value);
 assert.ok(values({mode:'edge',edge:'space',count:3}).every(value=>value===' '));
});
test('invalid selections, quantities and oversized output are rejected',()=>{
 for(const count of [0,101,-1,1.2,'',Infinity])assert.throws(()=>g.generate({count}));
 for(const length of [-1,10001,'',1.2])assert.throws(()=>g.generate({type:'string',length}));
 for(const options of [{mode:'other'},{type:'bad'},{mode:'edge',edge:'bad'},{mode:'edge',edge:'long',longLength:0},{type:'string',count:100,length:10000},{mode:'edge',edge:'long',count:100,longLength:10000}])assert.throws(()=>g.generate(options));
});

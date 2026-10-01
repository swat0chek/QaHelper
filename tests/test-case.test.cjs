const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('web/test-case.js','utf8'),ctx);const api=ctx.window.qaTestCase;
test('both documents and format survive draft roundtrip; invalid drafts rejected',()=>{
 const d=api.empty();d.testcase.steps=['first','','last'];d.checklist.items=['check'];d.mode='checklist';d.format='csv';
 assert.equal(JSON.stringify(api.decode(JSON.stringify(d))),JSON.stringify(d));
 for(const raw of ['null','{','{}',JSON.stringify({...d,version:2}),JSON.stringify({...d,checklist:{title:'',items:[1]}})])assert.throws(()=>api.decode(raw));
});
test('exports preserve field values, step order and multiline indentation, omitting blank items',()=>{
 const d=api.empty();Object.assign(d.testcase,{id:'TC-1',title:'Вход',preconditions:'Гость',data:'qa@test',steps:['first\nsecond line',' ','last'],expected:'Кабинет',priority:'P1'});
 const plain=api.exportDocument(d,'plain');for(const [,label] of api.fields)assert.ok(plain.includes(label));
 assert.ok(plain.includes('1. first\n   second line\n2. last'));
 d.testcase.title='*bold* <script>';assert.ok(api.exportDocument(d).includes('\\*bold\\* \\<script\\>'));
 d.mode='checklist';d.checklist.title='Checklist';d.checklist.items=['a','', 'b\nc'];
 assert.equal(api.exportDocument(d),'## Title\nChecklist\n\n## Checks\n- [ ] a\n- [ ] b\n      c');
 assert.ok(!api.exportDocument(d).includes('Preconditions'));
});
test('CSV quotes commas, newlines, quotes and neutralizes formulas in both modes',()=>{
 const d=api.empty();d.testcase.title='a,"b"\nc';d.testcase.steps=['=1+1',' @SUM(1)','safe'];
 const csv=api.exportDocument(d,'csv');assert.ok(csv.includes('"a,""b""\nc"'));assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"\' @SUM(1)"'));
 d.mode='checklist';d.checklist.title='Title';d.checklist.items=[];assert.equal(api.exportDocument(d,'csv'),'"Title","Item #","Check"\r\n"Title","",""');
 assert.throws(()=>api.exportDocument(d,'unknown'));
});

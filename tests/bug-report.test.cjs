const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('web/bug-report.js','utf8'),ctx);const api=ctx.window.qaBugReport;
const full=()=>({...api.empty(),title:'Корзина: итоговая сумма не обновляется после удаления товара',environment:'stage, build 52, Chrome / Windows',preconditions:'В корзине два товара',steps:['Открыть корзину','Удалить первый товар\nДождаться ответа'],actual:'Сумма осталась прежней',expected:'Сумма уменьшилась на цену товара',severity:'Major',priority:'P1',additional:'request ID: qa-123'});
test('empty report gives all five advisory warnings and can still be exported',()=>{
 assert.equal(api.review(api.empty()).length,5);
 for(const f of api.formats)assert.ok(api.exportReport(api.empty(),f).includes('Expected result'));
 assert.equal(api.review(full()).length,0);
});
test('rule checks distinguish blank steps and vague titles from precise titles',()=>{
 for(const title of ['','Баг','Не работает','Something is wrong'])assert.ok(api.review({...full(),title}).some(w=>w.startsWith('Title')));
 assert.ok(api.review({...full(),steps:[' ','\n']}).some(w=>w.startsWith('Нет Steps')));
 for(const field of ['expected','actual','environment'])assert.equal(api.review({...full(),[field]:' \n'}).length,1);
});
test('three formats export fields and step order with multiline text and markup escaping',()=>{
 const report=full();
 for(const f of api.formats){const text=api.exportReport(report,f);for(const field of api.fields)assert.ok(text.includes(field.label));assert.ok(text.indexOf('Открыть корзину')<text.indexOf('Удалить первый товар'));}
 assert.match(api.exportReport(report,'plain'),/1\. Открыть корзину/);
 assert.match(api.exportReport(report,'markdown'),/## Expected result/);
 assert.match(api.exportReport(report,'jira'),/h2\. Steps to reproduce\n# Открыть корзину/);
 assert.ok(api.exportReport({...report,title:'[link] *bold* <tag>'},'markdown').includes('\\[link\\] \\*bold\\* \\<tag\\>'));
 assert.ok(api.exportReport({...report,title:'{panel} [link]'},'jira').includes('\\{panel\\} \\[link\\]'));
 assert.throws(()=>api.exportReport(report,'unknown'));
});
test('versioned draft roundtrip preserves all text, order and format; malformed drafts rejected',()=>{
 const report={...full(),format:'jira',steps:['  first\n','', 'last 👩‍💻']};
 assert.deepEqual(JSON.parse(JSON.stringify(api.decode(JSON.stringify(report)))),report);
 for(const value of ['{','null','{}',JSON.stringify({...report,version:2}),JSON.stringify({...report,steps:[1]}),JSON.stringify({...report,severity:'wrong'})])assert.throws(()=>api.decode(value));
});

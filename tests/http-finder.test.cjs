const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({window:{},URL,Map});
for(const file of ['web/data.js','web/knowledge.js','web/modules/http-codes.js','web/modules/http.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const data=ctx.window.qaModules['http-codes'];
const codes=(query,group)=>Array.from(data.find(query,group),i=>i.code);
test('all 26 main statuses have practical details, valid similar codes and HTTP links',()=>{
 assert.equal(data.items.length,26);assert.equal(new Set(data.items.map(i=>i.code)).size,26);
 for(const item of data.items){assert.ok(item.name && item.description && item.example && item.difference && item.aliases);assert.ok(item.checks.length>=2);assert.ok(item.similar.length);
  for(const code of item.similar)assert.ok(data.items.some(i=>i.code===code));
  assert.ok(ctx.window.qaModules.http.topics.some(t=>item.href==='/http#'+t.id));
 }
});
test('search matches code, Russian symptoms, title, ё and handles absent values',()=>{
 assert.deepEqual(codes('409'),[409]);assert.deepEqual(codes('410'),[410]);assert.deepEqual(codes('999'),[]);
 assert.equal(codes('  НЕТ   АВТОРИЗАЦИИ ')[0],401);assert.equal(codes('ресурс не найден')[0],404);
 assert.equal(codes('нет прав')[0],403);assert.ok(codes('удалён навсегда').includes(410));
 assert.ok(codes('Gateway Timeout').includes(504));assert.ok(codes('ошибка валидации').includes(422));
 assert.deepEqual(codes('несуществующийпоиск'),[]);assert.deepEqual(codes('<script>'),[]);
});
test('five category filters intersect search; six comparisons are complete and searchable',()=>{
 for(const group of ctx.window.qaData.httpGroups){assert.equal(codes('',group.prefix).length,group.codes.length);assert.ok(data.find('',group.prefix).every(i=>i.group===group.prefix));}
 assert.deepEqual(codes('409','5xx'),[]);assert.deepEqual(codes('409','4xx'),[409]);
 assert.deepEqual(Array.from(data.comparisons,c=>c.id),['200-201-204','400-422','401-403','404-410','409-422','500-502-503-504']);
 for(const c of data.comparisons){assert.ok(c.points.length>=4);assert.ok(data.topics.some(t=>t.id==='compare-'+c.id));c.codes.forEach(code=>assert.ok(data.items.some(i=>i.code===code)));}
 const meta=ctx.window.qaData.sections.find(s=>s.id==='http-codes'),index=ctx.window.qaKnowledge.index([meta],[data]);
 assert.ok(ctx.window.qaKnowledge.search(index,'нет авторизации').some(r=>r.href==='/http-codes#status-401'));
 assert.ok(ctx.window.qaKnowledge.search(index,'404').some(r=>r.href==='/http-codes#codes-4xx'));
});

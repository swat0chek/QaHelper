window.qaTestCase = (() => {
  const key = 'qaHelpers.testCase.v1';
  const fields = [['id','ID'],['title','Title'],['preconditions','Preconditions'],['data','Test Data'],['expected','Expected Result'],['priority','Priority']];
  const priorities = ['', 'P0', 'P1', 'P2', 'P3'];
  const formats = ['markdown','plain','csv'];
  function empty() {
    return {version:1, mode:'testcase', format:'markdown', testcase:{...Object.fromEntries(fields.map(([id])=>[id,''])),steps:['']}, checklist:{title:'',items:['']}};
  }
  function decode(raw) {
    const d = JSON.parse(raw), strings = a => Array.isArray(a) && a.every(v=>typeof v==='string');
    if (!d || d.version!==1 || !['testcase','checklist'].includes(d.mode) || !formats.includes(d.format)
      || !d.testcase || !fields.every(([id])=>typeof d.testcase[id]==='string') || !priorities.includes(d.testcase.priority)
      || !strings(d.testcase.steps) || !d.checklist || typeof d.checklist.title!=='string' || !strings(d.checklist.items)) throw new Error('Некорректный черновик');
    return d;
  }
  const markdown = text => text.replace(/\\/g,'\\\\').replace(/([`*_{}\[\]<>#+.!|~\-])/g,'\\$1');
  // Quote every cell; neutralize spreadsheet formulas in user-entered values.
  const cell = text => '"' + (/^[\s\uFEFF]*[=+@-]/.test(text) ? "'"+text : text).replace(/"/g,'""') + '"';
  function exportDocument(d, format=d.format) {
    if (!formats.includes(format)) throw new Error('Неизвестный формат');
    const checklist=d.mode==='checklist', doc=d[d.mode], items=(checklist?doc.items:doc.steps).filter(s=>s.trim());
    if (format==='csv') {
      const header=checklist?['Title','Item #','Check']:['ID','Title','Preconditions','Test Data','Step #','Step','Expected Result','Priority'];
      const rows=(items.length?items:['']).map((item,i)=>checklist?[doc.title,item?String(i+1):'',item]:[doc.id,doc.title,doc.preconditions,doc.data,item?String(i+1):'',item,doc.expected,doc.priority]);
      return [header,...rows].map(row=>row.map(cell).join(',')).join('\r\n');
    }
    const escape=format==='markdown'?markdown:s=>s;
    const section=(label,text)=>(format==='markdown'?'## ':'')+label+'\n'+(text||'—');
    const list=items.map((s,i)=>{
      const prefix=checklist?(format==='markdown'?'- [ ] ':'[ ] '):`${i+1}. `;
      return prefix+escape(s).split(/\r\n|\r|\n/).join('\n'+' '.repeat(prefix.length));
    }).join('\n');
    if(checklist)return [section('Title',escape(doc.title)),section('Checks',list)].join('\n\n');
    return ['id','title','preconditions','data','steps','expected','priority'].map(id=>id==='steps'?section('Steps',list):section(fields.find(f=>f[0]===id)[1],escape(doc[id]))).join('\n\n');
  }
  return {key,fields,priorities,formats,empty,decode,exportDocument};
})();

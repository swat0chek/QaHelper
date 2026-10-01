window.qaBugReport = (() => {
  const key='qaHelpers.bugReport.v1';
  const fields=[
    ['title','Title','Что, где и при каких условиях происходит? Плохо: «Не работает». Хорошо: «Корзина: итоговая сумма не обновляется после удаления товара».'],
    ['environment','Environment','Укажите test/stage, URL, версию сборки, ОС и браузер/устройство.'],
    ['preconditions','Preconditions','Что подготовить до шагов: роль, состояние, тестовые данные. Не вставляйте пароли и токены.'],
    ['actual','Actual result','Что наблюдаете фактически? Сообщение, значение, частота воспроизведения.'],
    ['expected','Expected result','Что должно произойти по требованиям? Добавьте ссылку на правило, если есть.'],
    ['severity','Severity','Влияние дефекта на продукт: от блокировки до косметической проблемы. Шкала зависит от команды.'],
    ['priority','Priority','Срочность исправления: P0 — немедленно, P1 — высокая, P2 — обычная, P3 — низкая. Согласуйте с командой.'],
    ['additional','Additional information','Ссылки на скриншоты/видео, обезличенные логи, request ID и обходной путь. Файлы здесь не загружаются.']
  ].map(([id,label,hint])=>({id,label,hint}));
  const severity=['','Blocker','Critical','Major','Minor','Trivial'],priority=['','P0','P1','P2','P3'];
  const formats=['plain','markdown','jira'];
  function empty(){return {version:1,...Object.fromEntries(fields.map(f=>[f.id,''])),steps:[''],format:'markdown'};}
  function decode(raw){
    const value=JSON.parse(raw);
    if(!value || value.version!==1 || !fields.every(f=>typeof value[f.id]==='string') || !Array.isArray(value.steps) || !value.steps.every(s=>typeof s==='string') || !formats.includes(value.format) || !severity.includes(value.severity) || !priority.includes(value.priority)) throw new Error('Не удалось прочитать локальный черновик. Исходная запись сохранена; новый ввод заменит её.');
    return {version:1,...Object.fromEntries(fields.map(f=>[f.id,value[f.id]])),steps:[...value.steps],format:value.format};
  }
  function review(report){
    const warnings=[];
    if(!report.expected.trim())warnings.push('Не заполнен Expected result: опишите ожидаемое поведение.');
    if(!report.actual.trim())warnings.push('Не заполнен Actual result: опишите фактическое поведение.');
    if(!report.steps.some(s=>s.trim()))warnings.push('Нет Steps to reproduce: добавьте хотя бы один содержательный шаг.');
    const title=report.title.trim().toLocaleLowerCase('ru').replace(/[.!?]+$/,'');
    if(title.length<12 || /^(баг|ошибка|проблема|не работает|все сломалось|всё сломалось|bug|error|issue|does not work|something is wrong|test)(\s.*)?$/.test(title) && title.split(/\s+/).length<6)
      warnings.push('Title может быть слишком абстрактным: уточните место, действие и наблюдаемый дефект.');
    if(!report.environment.trim())warnings.push('Не заполнен Environment: укажите окружение, сборку и устройство.');
    return warnings;
  }
  const escapeMarkdown=text=>text.replace(/\\/g,'\\\\').replace(/([`*_{}\[\]<>#+.!|~])/g,'\\$1');
  const escapeJira=text=>text.replace(/\\/g,'\\\\').replace(/([{}\[\]*_!|#~^+])/g,'\\$1').replace(/^(-)/gm,'\\$1');
  function exportReport(report,format=report.format){
    if(!formats.includes(format))throw new Error('Неизвестный формат экспорта.');
    const escape=format==='markdown'?escapeMarkdown:format==='jira'?escapeJira:text=>text;
    const heading=text=>format==='markdown'?'## '+text:format==='jira'?'h2. '+text:text;
    const sections=[];
    for(const id of ['title','environment','preconditions','steps','actual','expected','severity','priority','additional']){
      const label=id==='steps'?'Steps to reproduce':fields.find(f=>f.id===id).label;
      const body=id==='steps'?report.steps.filter(s=>s.trim()).map((s,i)=>{
        const lines=escape(s).split(/\r?\n/);return (format==='jira'?'# ':`${i+1}. `)+lines.join(format==='jira'?'\n  ':'\n   ');
      }).join('\n'):escape(report[id]);
      sections.push(heading(label)+'\n'+(body||'—'));
    }
    return sections.join('\n\n');
  }
  return {key,fields,severity,priority,formats,empty,decode,review,exportReport};
})();

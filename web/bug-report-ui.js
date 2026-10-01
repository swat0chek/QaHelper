// Session fallback also survives switching tools when browser storage is unavailable.
window.qaBugDraftSession = window.qaBugDraftSession || null;
window.qaBugReportUI = section => {
  const api=window.qaBugReport;let report=window.qaBugDraftSession||api.empty(),loadMessage=window.qaBugDraftNotice||'Черновик сохраняется локально в этом браузере.',deleted=null;
  if(!window.qaBugDraftSession)try{const raw=localStorage.getItem(api.key);if(raw){report=api.decode(raw);loadMessage='Локальный черновик восстановлен.';}}
  catch{loadMessage='Не удалось прочитать черновик или хранилище недоступно. Исходная запись не изменена; новый ввод заменит её. Скопируйте важный отчёт перед закрытием страницы.';}
  const form=element('form','tool-form bug-form');form.noValidate=true;form.addEventListener('submit',e=>e.preventDefault());
  const draftStatus=element('p','tool-hint',loadMessage);draftStatus.id='bug-draft-status';draftStatus.setAttribute('role','status');form.append(draftStatus);
  const inputs={};
  function save(){
    window.qaBugDraftSession=report;
    try{localStorage.setItem(api.key,JSON.stringify(report));draftStatus.textContent='Черновик сохранён локально. Он восстановится после обновления страницы.';}
    catch{draftStatus.textContent='Не удалось сохранить черновик в браузере. Сейчас он доступен только в этой вкладке: скопируйте отчёт перед обновлением или закрытием страницы.';}
    window.qaBugDraftNotice=draftStatus.textContent;
  }
  const stepsBox=element('fieldset','bug-steps');stepsBox.append(element('legend','','Steps to reproduce'),element('p','tool-hint','Один шаг — одно действие. Укажите точные данные и путь в интерфейсе. Кнопки ↑/↓ меняют порядок; пустые шаги не попадают в экспорт.'));
  const stepsList=element('div','generator-results');stepsBox.append(stepsList);
  const stepActions=element('div','tool-actions'),add=element('button','clear-results','Добавить шаг'),undo=element('button','clear-results','Вернуть удалённый шаг');add.id='bug-add-step';undo.id='bug-undo-step';add.type=undo.type='button';undo.disabled=true;stepActions.append(add,undo);stepsBox.append(stepActions);
  function renderSteps(focus=-1){
    stepsList.replaceChildren();
    report.steps.forEach((value,index)=>{
      const row=element('div','generator-result bug-step'),label=element('label','',`Шаг ${index+1}`),input=element('textarea');input.id='bug-step-'+index;input.rows=2;input.value=value;label.htmlFor=input.id;
      input.addEventListener('input',()=>{report.steps[index]=input.value;changed();});
      const actions=element('div','tool-actions');
      for(const [action,text,disabled] of [['up','↑ Выше',index===0],['down','↓ Ниже',index===report.steps.length-1],['remove','Удалить',false]]){
        const b=element('button','clear-results',text);b.type='button';b.dataset.stepAction=action;b.disabled=disabled;b.setAttribute('aria-label',`${text}: шаг ${index+1}`);
        b.addEventListener('click',()=>{
          if(action==='remove'){deleted={index,value:report.steps[index]};report.steps.splice(index,1);undo.disabled=false;renderSteps(Math.min(index,report.steps.length-1));if(!report.steps.length)add.focus();}
          else{const target=index+(action==='up'?-1:1);[report.steps[index],report.steps[target]]=[report.steps[target],report.steps[index]];renderSteps(target);}
          changed();
        });actions.append(b);
      }
      row.append(label,input,actions);stepsList.append(row);
    });
    if(focus>=0)stepsList.querySelectorAll('textarea')[focus]?.focus();
  }
  for(const field of api.fields){
    if(field.id==='actual')form.append(stepsBox);
    const wrapper=element('div'),label=element('label','',field.label),hint=element('p','tool-hint',field.hint);
    const options=field.id==='severity'?api.severity:field.id==='priority'?api.priority:null;
    const input=element(options?'select':field.id==='title'?'input':'textarea');input.id='bug-'+field.id;label.htmlFor=input.id;hint.id=input.id+'-hint';input.setAttribute('aria-describedby',hint.id);
    if(options)for(const value of options){const option=element('option','',value||'Не выбрано');option.value=value;input.append(option);}
    else if(field.id==='title')input.type='text';else input.rows=3;
    input.value=report[field.id];inputs[field.id]=input;
    input.addEventListener('input',()=>{report[field.id]=input.value;changed();});wrapper.append(label,hint,input);form.append(wrapper);
  }
  const reviewBox=element('section','content-note');reviewBox.setAttribute('aria-labelledby','bug-review-title');const reviewTitle=element('h3','','Локальная проверка');reviewTitle.id='bug-review-title';const warnings=element('ul');reviewBox.append(reviewTitle,element('p','','Это простые правила, а не оценка качества отчёта. Подсказки не блокируют экспорт.'),warnings);
  const formatLabel=element('label','','Формат экспорта');formatLabel.htmlFor='bug-format';const format=element('select');format.id='bug-format';
  for(const [value,text] of [['plain','Plain text'],['markdown','Markdown'],['jira','Jira-friendly (wiki markup)']]){const o=element('option','',text);o.value=value;format.append(o);}format.value=report.format;
  const outputLabel=element('label','','Предпросмотр экспорта');outputLabel.htmlFor='bug-output';const output=element('textarea');output.id='bug-output';output.rows=15;output.readOnly=true;output.spellcheck=false;
  const copy=element('button','clear-results','Copy');copy.id='bug-copy';copy.type='button';const status=element('p','tool-hint');status.setAttribute('role','status');
  function refresh(){warnings.replaceChildren(...api.review(report).map(w=>element('li','',w)));if(!warnings.children.length)warnings.append(element('li','','По этим правилам замечаний нет. Проверьте воспроизводимость и требования.'));output.value=api.exportReport(report);status.textContent='';}
  function changed(){save();refresh();}
  add.addEventListener('click',()=>{report.steps.push('');renderSteps(report.steps.length-1);changed();});
  undo.addEventListener('click',()=>{if(!deleted)return;const index=Math.min(deleted.index,report.steps.length);report.steps.splice(index,0,deleted.value);deleted=null;undo.disabled=true;renderSteps(index);changed();});
  format.addEventListener('input',()=>{report.format=format.value;changed();});
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.value);status.textContent='Отчёт скопирован.';}catch{status.textContent='Не удалось скопировать. Выделено для ручного копирования: Ctrl+C или ⌘C.';output.focus();output.select();}});
  form.append(reviewBox,formatLabel,format,element('p','tool-hint','Jira-friendly использует wiki markup (h2. и #). Подходит для редакторов Jira с поддержкой этого синтаксиса; в других редакторах используйте Plain text или Markdown.'),outputLabel,output,copy,status);
  section.append(form);renderSteps();refresh();
};

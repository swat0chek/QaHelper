window.qaTestCaseUI = section => {
  const api=window.qaTestCase;
  let draft=window.qaTestCaseSession || api.empty();
  let notice=window.qaTestCaseNotice || 'Черновик сохраняется локально в этом браузере.';
  if(!window.qaTestCaseSession)try {
    const raw=localStorage.getItem(api.key);
    if(raw){draft=api.decode(raw);notice='Локальный черновик восстановлен.';}
  } catch {notice='Не удалось прочитать черновик. Исходная запись не изменена; новый ввод заменит её. Скопируйте данные перед закрытием страницы.';}
  const form=element('form','tool-form bug-form');
  form.addEventListener('submit',e=>e.preventDefault());
  const status=element('p','tool-hint',notice);status.id='case-draft-status';status.setAttribute('role','status');
  const modeLabel=element('label','','Тип документа');modeLabel.htmlFor='case-mode';
  const mode=element('select');mode.id='case-mode';
  for(const [value,text] of [['testcase','Test Case'],['checklist','Checklist']]){const o=element('option','',text);o.value=value;mode.append(o);}mode.value=draft.mode;
  const editor=element('div','tool-form');
  const formatLabel=element('label','','Формат экспорта');formatLabel.htmlFor='case-format';
  const format=element('select');format.id='case-format';
  for(const [value,text] of [['markdown','Markdown'],['plain','Plain text'],['csv','CSV']]){const o=element('option','',text);o.value=value;format.append(o);}format.value=draft.format;
  const outputLabel=element('label','','Предпросмотр экспорта');outputLabel.htmlFor='case-output';
  const output=element('textarea');output.id='case-output';output.readOnly=true;output.rows=14;output.spellcheck=false;
  const actions=element('div','tool-actions');
  function button(text,id,parent=actions){const b=element('button','clear-results',text);b.type='button';b.id=id;parent.append(b);return b;}
  const copy=button('Copy','case-copy'),download=button('Скачать','case-download');
  const feedback=element('p','tool-hint');feedback.setAttribute('role','status');
  function refresh(){output.value=api.exportDocument(draft);feedback.textContent='';}
  function changed(){
    window.qaTestCaseSession=draft;
    try{localStorage.setItem(api.key,JSON.stringify(draft));status.textContent='Черновик сохранён локально: Test Case и Checklist.';}
    catch{status.textContent='Хранилище недоступно или заполнено. Черновик только в памяти вкладки: скопируйте его перед обновлением или закрытием страницы.';}
    window.qaTestCaseNotice=status.textContent;refresh();
  }
  function renderEditor(){
    editor.replaceChildren();
    const checklist=draft.mode==='checklist',doc=draft[draft.mode],items=checklist?doc.items:doc.steps;
    const listBox=element('fieldset','bug-steps'),list=element('div','generator-results');
    listBox.append(element('legend','',checklist?'Проверки':'Steps'),list);
    const listActions=element('div','tool-actions');listBox.append(listActions);
    const add=button(checklist?'Добавить проверку':'Добавить шаг','case-add-item',listActions);
    function renderItems(focus=-1){
      list.replaceChildren();
      items.forEach((value,index)=>{
        const row=element('div','generator-result bug-step'),label=element('label','',`${checklist?'Проверка':'Шаг'} ${index+1}`),input=element('textarea');
        input.id='case-item-'+index;input.rows=2;input.value=value;label.htmlFor=input.id;
        input.addEventListener('input',()=>{items[index]=input.value;changed();});
        const controls=element('div','tool-actions');
        for(const [action,text,disabled] of [['up','↑ Выше',index===0],['down','↓ Ниже',index===items.length-1],['duplicate','Дублировать',false],['delete','Удалить',false]]){
          const b=button(text,`case-${action}-${index}`,controls);b.disabled=disabled;b.dataset.itemAction=action;b.setAttribute('aria-label',`${text}: ${checklist?'проверка':'шаг'} ${index+1}`);
          b.addEventListener('click',()=>{
            let target=index;
            if(action==='duplicate'){items.splice(index+1,0,items[index]);target=index+1;}
            else if(action==='delete'){items.splice(index,1);target=Math.min(index,items.length-1);}
            else{target=index+(action==='up'?-1:1);[items[index],items[target]]=[items[target],items[index]];}
            renderItems(target);if(!items.length)add.focus();changed();
          });
        }
        row.append(label,input,controls);list.append(row);
      });
      if(focus>=0)list.querySelectorAll('textarea')[focus]?.focus();
    }
    for(const [id,text] of checklist?[['title','Title']]:api.fields){
      if(id==='expected')editor.append(listBox);
      const wrapper=element('div'),label=element('label','',text),input=element(id==='priority'?'select':['id','title'].includes(id)?'input':'textarea');
      input.id='case-'+id;label.htmlFor=input.id;
      if(id==='priority')for(const value of api.priorities){const o=element('option','',value||'Не выбрано');o.value=value;input.append(o);}
      else if(input.tagName==='TEXTAREA')input.rows=3;
      input.value=doc[id];input.addEventListener('input',()=>{doc[id]=input.value;changed();});wrapper.append(label,input);editor.append(wrapper);
    }
    if(checklist)editor.append(listBox);
    add.addEventListener('click',()=>{items.push('');renderItems(items.length-1);changed();});renderItems();
  }
  mode.addEventListener('change',()=>{draft.mode=mode.value;renderEditor();changed();});
  format.addEventListener('change',()=>{draft.format=format.value;changed();});
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.value);feedback.textContent='Скопировано.';}catch{output.focus();output.select();feedback.textContent='Не удалось скопировать. Текст выделен: нажмите Ctrl+C или ⌘C.';}});
  download.addEventListener('click',()=>{
    const csv=draft.format==='csv',extension=csv?'csv':draft.format==='markdown'?'md':'txt';
    const blob=new Blob([csv?'\uFEFF':'',output.value],{type:(csv?'text/csv':draft.format==='markdown'?'text/markdown':'text/plain')+';charset=utf-8'});
    const url=URL.createObjectURL(blob),link=element('a');link.href=url;link.download=draft.mode+'.'+extension;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    feedback.textContent='Файл подготовлен для скачивания.';
  });
  form.append(status,modeLabel,mode,element('p','tool-hint','У каждого режима свой черновик. Переключение сохраняет оба документа. Пустые шаги и проверки не включаются в экспорт.'),editor,formatLabel,format,element('p','tool-hint','CSV: одна строка на шаг или проверку. Значения, похожие на формулы, получают защитный апостроф.'),outputLabel,output,actions,feedback);
  section.append(form);renderEditor();refresh();
};

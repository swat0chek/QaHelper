async function initializeToolbox() {
  const content=await window.qaKnowledge.load(sections.find(x=>x.id==='toolbox'));
  const nav=document.getElementById('topic-nav'),article=document.getElementById('module-content');
  document.getElementById('module-title').textContent='QA Toolbox';
  document.getElementById('module-description').textContent='Ежедневные QA-задачи — в одном месте. Все вычисления локальны: ввод не отправляется на сервер и не сохраняется.';
  nav.append(element('h2','','Выберите инструмент'));
  for(const tool of content.tools) {
    const link=element('a','',tool.title);link.href='#'+tool.id;link.dataset.tool=tool.id;nav.append(link);
    link.addEventListener('click',event=>{
      if(event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
      event.preventDefault();history.pushState(null,'',location.pathname+location.search+'#'+tool.id);render(true);
    });
  }
  function render(focus=false) {
    const tool=content.tools.find(t=>'#'+t.id===location.hash)||content.tools[0];
    if(location.hash!=='#'+tool.id)history.replaceState(null,'',location.pathname+location.search+'#'+tool.id);
    nav.querySelectorAll('a').forEach(a=>{if(a.dataset.tool===tool.id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
    document.title=tool.title+' — qaHelp';
    const section=element('section','article-topic utility');section.id=tool.id;
    const title=element('h2','',tool.title);title.id='tool-title';title.tabIndex=-1;
    section.append(title,element('p','',tool.purpose),element('aside','content-note',tool.help));
    const form=element('form','tool-form');form.noValidate=true;
    let mode;
    if(tool.modes.length) {
      const label=element('label','','Режим');label.htmlFor='tool-mode';mode=element('select');mode.id='tool-mode';
      for(const [value,text] of tool.modes){const option=element('option','',text);option.value=value;mode.append(option);}
      form.append(label,mode);
    }
    const inputs=[],fields=element('div','tool-inputs'+(tool.example.length===2?' tool-pair':''));
    tool.example.forEach((example,index)=>{
      const wrapper=element('div'),label=element('label','',tool.id==='uuid'?'Количество UUID':tool.example.length===2?(index?'После / фактическое':'До / ожидаемое'):'Ввод');
      const input=element(tool.id==='uuid'?'input':'textarea');input.id='tool-input-'+index;label.htmlFor=input.id;
      input.spellcheck=false;input.autocomplete='off';input.setAttribute('autocapitalize','off');input.maxLength=100001;
      input.setAttribute('aria-describedby','tool-limit tool-error');
      if(tool.id==='uuid'){input.type='number';input.min='1';input.max='100';input.value='1';}else input.rows=7;
      inputs.push(input);wrapper.append(label,input);fields.append(wrapper);
    });
    const limit=element('p','tool-hint','До 100 000 символов в каждом поле. Ввод очищается при переключении инструмента и обновлении страницы.');limit.id='tool-limit';
    const actions=element('div','tool-actions');
    const button=(text,id)=>{const b=element('button','clear-results',text);b.type='button';b.id=id;actions.append(b);return b;};
    const run=button('Выполнить','tool-run');run.type='submit';
    const example=button('Пример','tool-example'),clear=button('Очистить','tool-clear'),copy=button('Копировать результат','tool-copy');copy.disabled=true;
    const error=element('p','tool-error');error.id='tool-error';error.setAttribute('role','alert');
    const status=element('p','tool-hint');status.setAttribute('role','status');
    const label=element('label','','Результат');label.htmlFor='tool-output';
    const output=element('textarea');output.id='tool-output';output.readOnly=true;output.rows=9;output.spellcheck=false;
    function invalidate(){output.value='';copy.disabled=true;error.textContent='';status.textContent='';inputs.forEach(i=>i.removeAttribute('aria-invalid'));}
    inputs.forEach(input=>input.addEventListener('input',invalidate));mode?.addEventListener('change',invalidate);
    form.addEventListener('submit',event=>{
      event.preventDefault();invalidate();
      try{output.value=window.qaToolbox.run(tool.id,inputs[0].value,inputs[1]?.value||'',mode?.value||'');copy.disabled=false;status.textContent='Готово. Результат доступен ниже.';}
      catch(e){error.textContent=e.message;inputs.forEach(i=>i.setAttribute('aria-invalid','true'));}
    });
    example.addEventListener('click',()=>{
      invalidate();inputs.forEach((input,i)=>input.value=tool.example[i]);
      if(mode?.value==='decode') inputs[0].value=window.qaToolbox.run(tool.id,tool.example[0],'','encode');
      if(tool.id==='timestamp' && mode.value==='milliseconds')inputs[0].value='1767225600000';
      if(tool.id==='timestamp' && mode.value==='date')inputs[0].value='2026-01-01T03:00:00+03:00';
      form.requestSubmit();
    });
    clear.addEventListener('click',()=>{inputs.forEach(i=>i.value='');invalidate();inputs[0].focus();});
    copy.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(output.value);status.textContent='Результат скопирован.';}
      catch{status.textContent='Не удалось скопировать. Выделите результат и нажмите Ctrl+C или ⌘C.';output.focus();output.select();}
    });
    form.append(fields,limit,actions,error,status,label,output);section.append(form);article.replaceChildren(section);
    if(focus){title.focus({preventScroll:true});section.scrollIntoView({block:'start'});}
    document.body.dataset.ready='true';
  }
  window.addEventListener('hashchange',()=>render(true));window.addEventListener('popstate',()=>render(true));render();
}
initializeToolbox().catch(error=>{document.getElementById('module-status').textContent=error.message;document.body.dataset.ready='error';});

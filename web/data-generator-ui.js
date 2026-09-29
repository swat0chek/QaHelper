window.qaGeneratorUI = section => {
  const engine=window.qaGenerator,form=element('form','tool-form generator-form');form.noValidate=true;
  const fields=element('div','tool-inputs tool-pair'),controls={},wrappers={};
  const definitions=[
    ['mode','Режим','select',[['standard','Обычные данные'],['edge','Edge Cases / Problematic Data']],'standard'],
    ['type','Тип данных','select',engine.types.map(t=>[t.id,t.title]),'name'],
    ['itemType','Тип элементов списка','select',engine.types.filter(t=>t.id!=='list').map(t=>[t.id,t.title]),'string'],
    ['edge','Edge case','select',[['all','Все по порядку (12 случаев)'],...engine.edges.map(e=>[e.id,e.title])],'all'],
    ['count','Количество значений (1–100)','number',[1,100],5],
    ['length','Длина строки / поля label (0–10 000)','number',[0,10000],16],
    ['longLength','Длина очень длинной строки (1–10 000)','number',[1,10000],1000],
    ['min','Минимальное число','number',[-1000000000,1000000000],0],
    ['max','Максимальное число','number',[-1000000000,1000000000],100],
    ['start','Начальная дата (включительно)','date',['1900-01-01','2100-12-31'],'2020-01-01'],
    ['end','Конечная дата (включительно)','date',['1900-01-01','2100-12-31'],'2030-12-31']
  ];
  for(const [key,title,type,options,value] of definitions) {
    const wrapper=element('div'),label=element('label','',title),control=element(type==='select'?'select':'input');
    label.htmlFor=control.id='generator-'+key;
    if(type==='select')for(const [id,text] of options){const option=element('option','',text);option.value=id;control.append(option);}
    else{control.type=type;control.min=options[0];control.max=options[1];if(type==='number')control.step='1';}
    control.value=value;control.setAttribute('aria-describedby','generator-help generator-error');
    wrappers[key]=wrapper;controls[key]=control;wrapper.append(label,control);fields.append(wrapper);
  }
  const help=element('p','tool-hint');help.id='generator-help';
  const actions=element('div','tool-actions');
  const button=(label,id)=>{const b=element('button','clear-results',label);b.type='button';b.id='generator-'+id;actions.append(b);return b;};
  const generate=button('Generate — создать','generate');generate.type='submit';
  const regenerate=button('Regenerate — заново','regenerate'),copyAll=button('Copy all — JSON-массив','copy-all'),clear=button('Очистить результаты','clear');
  const error=element('p','tool-error');error.id='generator-error';error.setAttribute('role','alert');
  const status=element('p','tool-hint');status.setAttribute('role','status');
  const results=element('div','generator-results');results.setAttribute('aria-label','Сгенерированные значения');
  const exportLabel=element('label','','Все значения — JSON-массив (сохраняет пустые строки и переносы)');exportLabel.htmlFor='generator-export';
  const exportText=element('textarea');exportText.id='generator-export';exportText.readOnly=true;exportText.rows=6;exportText.spellcheck=false;
  const exported=element('div');exported.append(exportLabel,exportText);exported.hidden=true;
  function invalidate(){results.replaceChildren();exportText.value='';exported.hidden=true;error.textContent='';status.textContent='';regenerate.disabled=true;copyAll.disabled=true;clear.disabled=true;}
  function configure(){
    const edge=controls.mode.value==='edge',type=controls.type.value==='list'?controls.itemType.value:controls.type.value;
    const visible={mode:true,type:!edge,itemType:!edge && controls.type.value==='list',edge,count:true,
      length:!edge && ['string','json'].includes(type),longLength:edge && ['all','long'].includes(controls.edge.value),
      min:!edge && type==='number',max:!edge && type==='number',start:!edge && type==='date',end:!edge && type==='date'};
    for(const [key,control] of Object.entries(controls)){wrappers[key].hidden=!visible[key];control.disabled=!visible[key];}
    help.textContent=edge?'Набор безопасных значений для проверки валидации. «Все» выдаёт случаи по порядку; при количестве больше 12 цикл повторяется. Regenerate повторяет выбранные случаи с текущей длиной.':engine.types.find(t=>t.id===type).help+' Случайные значения могут повторяться. Regenerate создаёт новую выборку.';
  }
  for(const [key,control] of Object.entries(controls))control.addEventListener('input',()=>{
    if(key==='mode')controls.count.value=control.value==='edge'?'12':'5';
    invalidate();configure();
  });
  async function copy(text,fallback){
    try{await navigator.clipboard.writeText(text);status.textContent='Скопировано. Пробелы и переносы сохранены.';}
    catch{status.textContent='Не удалось скопировать. Выделено для ручного копирования: Ctrl+C или ⌘C.';fallback.focus();fallback.select();}
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();invalidate();
    try {
      const rows=engine.generate(Object.fromEntries(Object.entries(controls).map(([key,control])=>[key,control.value])));
      rows.forEach((row,index)=>{
        const card=element('section','generator-result'),title=element('h3','',`${index+1}. ${row.title}`);
        const label=element('label','','Исходное значение');label.htmlFor='generated-value-'+index;
        const value=element('textarea');value.id=label.htmlFor;value.readOnly=true;value.rows=typeof row.value==='object'?5:2;value.spellcheck=false;value.value=engine.text(row.value);
        const display=element('p','tool-hint',typeof row.value==='string'?`Длина UTF-16: ${row.value.length}. Видимое представление: ${JSON.stringify(row.value.length>100?row.value.slice(0,100):row.value)}${row.value.length>100?'… (превью)':''}`:'JSON-объект; Copy копирует его целиком.');
        const copyButton=element('button','clear-results','Copy');copyButton.type='button';copyButton.setAttribute('aria-label',`Copy: ${row.title}, значение ${index+1}`);
        copyButton.addEventListener('click',()=>copy(engine.text(row.value),value));
        card.append(title,element('p','',row.help),label,value,display,copyButton);results.append(card);
      });
      exportText.value=engine.copyAll(rows);exported.hidden=false;regenerate.disabled=false;copyAll.disabled=false;clear.disabled=false;
      status.textContent=`Создано значений: ${rows.length}. Результаты ниже.`;
    } catch(e){error.textContent=e.message;}
  });
  regenerate.addEventListener('click',()=>form.requestSubmit());
  copyAll.addEventListener('click',()=>copy(exportText.value,exportText));
  clear.addEventListener('click',()=>{invalidate();controls.count.focus();});
  form.append(fields,help,actions,error,status,exported,results);section.append(form);invalidate();configure();
};

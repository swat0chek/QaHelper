window.qaBoundaryUI = section => {
  const engine=window.qaBoundary,form=element('form','tool-form'),fields=element('div','tool-inputs tool-pair');form.noValidate=true;
  const controls={},labels={},wrappers={};
  for(const [key,title,value] of [['mode','Режим','number'],['min','min','3'],['max','max','50'],['step','Шаг (по умолчанию 1)','1']]) {
    const wrapper=element('div'),label=element('label','',title),input=element(key==='mode'?'select':'input');
    input.id='boundary-'+key;label.htmlFor=input.id;
    if(key==='mode')for(const [v,t] of [['number','Числовой диапазон'],['length','Длина строки']]){const option=element('option','',t);option.value=v;input.append(option);}
    else{input.type='text';input.inputMode='decimal';input.maxLength=80;input.autocomplete='off';}
    input.value=value;input.setAttribute('aria-describedby','boundary-help boundary-error');
    controls[key]=input;labels[key]=label;wrappers[key]=wrapper;wrapper.append(label,input);fields.append(wrapper);
  }
  const help=element('p','tool-hint');help.id='boundary-help';
  const actions=element('div','tool-actions');
  const button=(title,id)=>{const b=element('button','clear-results',title);b.id='boundary-'+id;b.type='button';actions.append(b);return b;};
  const generate=button('Generate — построить границы','generate');generate.type='submit';
  const copyValues=button('Copy values','copy-values'),copyChecklist=button('Copy as checklist','copy-checklist'),clear=button('Очистить','clear');
  const error=element('p','tool-error');error.id='boundary-error';error.setAttribute('role','alert');
  const status=element('p','tool-hint');status.setAttribute('role','status');
  const notice=element('p','content-note');notice.hidden=true;
  const results=element('div','generator-results');results.setAttribute('aria-label','Граничные точки');
  const exportBox=element('div'),exportLabel=element('label','','Данные для копирования');exportLabel.htmlFor='boundary-export';
  const output=element('textarea');output.id='boundary-export';output.readOnly=true;output.rows=6;output.spellcheck=false;exportBox.append(exportLabel,output);
  let result;
  function invalidate(){exportLabel.textContent='Данные для копирования';result=null;results.replaceChildren();error.textContent='';status.textContent='';notice.hidden=true;exportBox.hidden=true;output.value='';copyValues.disabled=copyChecklist.disabled=true;}
  function configure(){
    const length=controls.mode.value==='length';wrappers.step.hidden=length;controls.step.disabled=length;
    labels.min.textContent=length?'minLength (0–10 000)':'min';labels.max.textContent=length?'maxLength (0–10 000)':'max';
    help.textContent=length?'Шаг длины равен 1. Генерируются строки из A: каждый символ занимает одну UTF-16 единицу и один байт UTF-8. Copy values — JSON-массив строк, включая пустые; отрицательная длина пропускается.':'Шесть точек: min − шаг, min, min + шаг, max − шаг, max, max + шаг. По умолчанию шаг 1; для decimal задайте шаг по требованиям, например 0.01. Copy values — точные десятичные значения по одному на строку.';
  }
  Object.values(controls).forEach(input=>input.addEventListener('input',()=>{invalidate();configure();}));
  form.addEventListener('submit',event=>{
    event.preventDefault();invalidate();
    try {
      result=engine.generate(Object.fromEntries(Object.entries(controls).map(([key,input])=>[key,input.value])));
      notice.hidden=false;notice.textContent='Границы включены. Класс «внутри / вне» определяется сравнением со всем диапазоном, а ожидаемое поведение — требованиями продукта.'+(result.equal?' min = max: допустима одна точка.':'')+(result.rows.some(r=>r.duplicate)?' Совпадающие значения сохранены, чтобы показать роль каждой точки.':'');
      for(const [index,row] of result.rows.entries()) {
        const card=element('section','generator-result');card.append(element('h3','',`${row.formula} = ${row.value}${result.mode==='length'?' символов':''}`),element('p','',row.title),element('p','tool-hint',row.explanation+(row.duplicate?' Совпадает с другой точкой.':'')));
        if(row.possible){const label=element('label','',result.mode==='length'?'Строка для проверки':'Значение');label.htmlFor='boundary-value-'+index;const input=element('textarea');input.id=label.htmlFor;input.readOnly=true;input.rows=2;input.spellcheck=false;input.value=row.text;card.append(label,input);if(row.text==='')card.append(element('p','tool-hint','Пустая строка: длина 0.'));}
        results.append(card);
      }
      output.value=engine.values(result);exportBox.hidden=false;copyValues.disabled=copyChecklist.disabled=false;status.textContent='Построено 6 граничных точек. Результаты ниже.';
    } catch(e){error.textContent=e.message;}
  });
  async function copy(kind){
    if(!result)return;
    output.value=kind==='values'?engine.values(result):engine.checklist(result);exportLabel.textContent=kind==='values'?'Значения для копирования':'Checklist в Markdown';
    try{await navigator.clipboard.writeText(output.value);status.textContent='Скопировано.';}
    catch{status.textContent='Не удалось скопировать. Выделено для ручного копирования: Ctrl+C или ⌘C.';output.focus();output.select();}
  }
  copyValues.addEventListener('click',()=>copy('values'));copyChecklist.addEventListener('click',()=>copy('checklist'));
  clear.addEventListener('click',()=>{controls.min.value='';controls.max.value='';invalidate();controls.min.focus();});
  form.append(fields,help,actions,error,status,notice,exportBox,results);section.append(form);invalidate();configure();
};

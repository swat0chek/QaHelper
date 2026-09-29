/* Decimal arithmetic stays exact: scaled integers, no floating-point rounding. */
window.qaBoundary = (() => {
  const fail=message=>{throw new Error(message);};
  function decimal(value,label) {
    const text=String(value??'').trim().replace(',','.');
    if(!text)fail(`Укажите ${label}.`);
    if(!/^[+-]?\d{1,30}(\.\d{1,12})?$/.test(text))fail(`${label}: нужно число без экспоненты, до 30 цифр целой части и 12 дробных. Разделитель — точка или запятая.`);
    const [whole,fraction='']=text.replace(/^[+-]/,'').split('.');
    return {amount:BigInt(whole+fraction)*(text.startsWith('-')?-1n:1n),scale:fraction.length};
  }
  function format(amount,scale) {
    const negative=amount<0n,digits=(negative?-amount:amount).toString().padStart(scale+1,'0');
    const text=scale?(digits.slice(0,-scale)+'.'+digits.slice(-scale)).replace(/\.?0+$/,''):digits;
    return (negative?'-':'')+text;
  }
  function generate({mode='number',min,max,step='1'}={}) {
    if(!['number','length'].includes(mode))fail('Неизвестный режим.');
    let low,high,delta,scale=0;
    if(mode==='length') {
      const length=(value,label)=>{
        const text=String(value??'').trim();
        if(!text)fail(`Укажите ${label}.`);
        if(!/^\d+$/.test(text) || !Number.isSafeInteger(+text) || +text>10000)fail(`${label}: длина должна быть целым числом от 0 до 10 000.`);
        return BigInt(text);
      };
      low=length(min,'minLength');high=length(max,'maxLength');delta=1n;
    } else {
      const numbers=[decimal(min,'min'),decimal(max,'max'),decimal(step,'шаг')];
      scale=Math.max(...numbers.map(n=>n.scale));
      [low,high,delta]=numbers.map(n=>n.amount*10n**BigInt(scale-n.scale));
      if(delta<=0n)fail('Шаг должен быть больше нуля.');
    }
    if(low>high)fail('min не должен быть больше max.');
    const points=[
      ['min − шаг','Ниже нижней границы',low-delta],
      ['min','Сама нижняя граница',low],
      ['min + шаг','Сразу после нижней границы',low+delta],
      ['max − шаг','Ниже верхней границы',high-delta],
      ['max','Сама верхняя граница',high],
      ['max + шаг','Сразу после верхней границы',high+delta]
    ];
    const rows=points.map(([formula,title,amount])=>{
      const value=format(amount,scale),possible=mode==='number'||amount>=0n;
      const inside=amount>=low && amount<=high;
      return {formula:mode==='length'?formula.replace('шаг','1'):formula,title,value,possible,inside,
        text:possible?(mode==='length'?'A'.repeat(Number(amount)):value):null,
        explanation:!possible?'Отрицательная длина невозможна: строка не создаётся.':inside?'Внутри заданного диапазона, включая границы.':'Вне заданного диапазона.',
        duplicate:points.filter(p=>p[2]===amount).length>1};
    });
    return {mode,min:format(low,scale),max:format(high,scale),step:format(delta,scale),equal:low===high,rows};
  }
  function values(result) {
    const rows=result.rows.filter(r=>r.possible);
    return result.mode==='length'?JSON.stringify(rows.map(r=>r.text),null,2):rows.map(r=>r.value).join('\n');
  }
  function checklist(result) {
    const header=`# Boundary Value Analysis\n\n${result.mode==='length'?'Длина строки':'Числовой диапазон'}: [${result.min}, ${result.max}], границы включены; шаг ${result.step}.\nОжидания сверить с требованиями.\n`;
    return header+'\n'+result.rows.map(r=>!r.possible?`- Пропущено: ${r.formula} = ${r.value} — отрицательная длина невозможна.`:`- [ ] ${r.formula} = ${r.value}${result.mode==='length'?' символов (строка из A)':''} — ${r.title.toLowerCase()}. ${r.explanation}${r.duplicate?' Значение повторяется для другой граничной точки.':''}`).join('\n');
  }
  return {generate,values,checklist};
})();

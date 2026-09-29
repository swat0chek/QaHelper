/* Local test fixtures, never requests or executable payloads. */
window.qaGenerator = (() => {
  const types = [
    ['name','Имя','Синтетические сочетания имён и фамилий для проверки отображения.'],
    ['email','Email','Адреса @example.test для проверки формата, не доставки писем.'],
    ['phone','Телефон','Формат +1 202 555 01xx из вымышленного диапазона NANPA. Не для проверки доставки SMS.'],
    ['uuid','UUID','Случайный UUID v4 для идентификаторов тестовых сущностей.'],
    ['number','Число','Целые числа в заданном диапазоне включительно.'],
    ['string','Строка заданной длины','Латинские буквы и цифры. Длина в символах равна длине UTF-16.'],
    ['date','Дата','Календарные даты YYYY-MM-DD в заданном диапазоне включительно, в UTC.'],
    ['ipv4','IPv4','Адреса 192.0.2.x из диапазона документации TEST-NET-1.'],
    ['url','URL','HTTPS URL на example.test для проверки формата и отображения.'],
    ['json','JSON','Учебный объект: id, name, email, active, score и label заданной длины.'],
    ['list','Список значений','Выберите тип элементов. Количество задаёт размер списка; Copy all копирует JSON-массив.']
  ].map(([id,title,help])=>({id,title,help}));
  const edges = [
    ['empty','Пустая строка','', 'Обязательность поля и отличие пустой строки от отсутствующего значения.'],
    ['space','Пробел',' ', 'Trim и поведение обязательного поля при вводе одного пробела.'],
    ['spaces','Несколько пробелов','   ', 'Схлопывание пробелов и валидация визуально пустого значения.'],
    ['unicode','Unicode','Cafe\u0301 · café · 日本語', 'Нормализация Unicode, поиск и сохранение символов разных письменностей.'],
    ['emoji','Emoji','👩‍💻 🧪 🙂', 'Поддержка emoji, подсчёт графем и ограничения длины.'],
    ['cyrillic','Кириллица','Тестовые данные: Ёжик', 'Кодировка, поиск, регистр и поддержка е/ё.'],
    ['hyphen','Дефис','Анна-Мария', 'Составные имена, разрешённые символы и перенос текста.'],
    ['apostrophe','Апостроф',"O'Connor", 'Имена с апострофом, сохранение и корректное отображение текста.'],
    ['long','Очень длинная строка',null, 'Границы длины, обрезка текста и адаптивность. Длина настраивается; нагрузка не создаётся.'],
    ['newline','Перенос строки','Первая строка\nВторая строка', 'Многострочные поля, сохранение перевода строки и экспорт.'],
    ['html','HTML-like input','<b>QA example</b>', 'Отображение угловых скобок и экранирование текста. Без скриптов, событий и внешних ресурсов.'],
    ['special','Специальные символы','!@#$%^&*()_+=[]{}:;,.? /\\|"', 'Допустимый алфавит, экранирование и перенос данных через JSON.']
  ].map(([id,title,value,help])=>({id,title,value,help}));
  const fail = text => { throw new Error(text); };
  function integer(value,min,max,label) {
    if(!/^-?\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || +value<min || +value>max) fail(`${label}: введите целое число от ${min} до ${max}.`);
    return Number(value);
  }
  function random(min,max) {
    // Rejection sampling avoids modulo bias; ranges stay below 2^32.
    const span=max-min+1,limit=Math.floor(4294967296/span)*span,buffer=new Uint32Array(1);
    do { crypto.getRandomValues(buffer); } while(buffer[0]>=limit);
    return min+buffer[0]%span;
  }
  function string(length) {
    const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length},()=>alphabet[random(0,alphabet.length-1)]).join('');
  }
  function date(value) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('Введите даты в формате YYYY-MM-DD.');
    const time=Date.parse(value+'T00:00:00Z');
    if(!Number.isFinite(time) || new Date(time).toISOString().slice(0,10)!==value || value<'1900-01-01' || value>'2100-12-31') fail('Нужна существующая дата между 1900-01-01 и 2100-12-31.');
    return time/86400000;
  }
  function generate(options={}) {
    const o={mode:'standard',type:'name',itemType:'string',count:5,length:16,longLength:1000,min:0,max:100,start:'2020-01-01',end:'2030-12-31',edge:'all',...options};
    const count=integer(o.count,1,100,'Количество');
    if(!['standard','edge'].includes(o.mode)) fail('Неизвестный режим.');
    let result;
    if(o.mode==='edge') {
      const selected=o.edge==='all'?edges:edges.filter(e=>e.id===o.edge);
      if(!selected.length) fail('Неизвестный edge case.');
      const length=selected.some(e=>e.id==='long')?integer(o.longLength,1,10000,'Длина длинной строки'):0;
      if(Math.ceil(count/selected.length)*length>100000) fail('Суммарная длина строк превышает 100 000 символов. Уменьшите длину или количество.');
      result=Array.from({length:count},(_,i)=>{
        const edge=selected[i%selected.length];
        return {title:edge.title,help:edge.help,value:edge.id==='long'?'A'.repeat(length):edge.value};
      });
    } else {
      if(!types.some(t=>t.id===o.type)) fail('Неизвестный тип данных.');
      const type=o.type==='list'?o.itemType:o.type;
      if(type==='list' || !types.some(t=>t.id===type)) fail('Неизвестный тип элемента списка.');
      const length=['string','json'].includes(type)?integer(o.length,0,10000,'Длина'):0;
      if(count*length>100000) fail('Суммарная длина строк превышает 100 000 символов. Уменьшите длину или количество.');
      const min=type==='number'?integer(o.min,-1000000000,1000000000,'Минимум'):0;
      const max=type==='number'?integer(o.max,-1000000000,1000000000,'Максимум'):100;
      if(min>max) fail('Минимум не должен превышать максимум.');
      const start=type==='date'?date(o.start):0,end=type==='date'?date(o.end):0;
      if(start>end) fail('Начальная дата не должна быть позже конечной.');
      const names=['Анна','Мария','Алексей','Иван','София','Даниил'],last=['Тестова','Примерова','Демина'];
      const name=()=>{const i=random(0,names.length-1);const surname=last[random(0,last.length-1)];return names[i]+' '+([2,3,5].includes(i)?surname.slice(0,-1):surname);};
      const uuid=()=>crypto.randomUUID();
      const email=()=>`qa.${uuid()}@example.test`;
      const make={
        name, email, phone:()=>'+120255501'+String(random(0,99)).padStart(2,'0'), uuid,
        number:()=>random(min,max), string:()=>string(length),
        date:()=>new Date(random(start,end)*86400000).toISOString().slice(0,10),
        ipv4:()=>`192.0.2.${random(1,254)}`, url:()=>`https://example.test/qa/${uuid()}?source=test`,
        json:()=>({id:uuid(),name:name(),email:email(),active:random(0,1)===1,score:random(0,100),label:string(length)})
      };
      const definition=types.find(t=>t.id===type);
      result=Array.from({length:count},()=>({title:definition.title,help:definition.help,value:make[type]()}));
    }
    if(result.reduce((n,r)=>n+JSON.stringify(r.value).length,0)>120000) fail('Результат слишком большой. Уменьшите количество или длину (лимит 120 000 символов JSON).');
    return result;
  }
  const text=value=>typeof value==='string'?value:JSON.stringify(value,null,2);
  const copyAll=rows=>JSON.stringify(rows.map(row=>row.value),null,2);
  return {types,edges,generate,text,copyAll};
})();

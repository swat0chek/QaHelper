/* Pure local transformations: no network, storage or DOM access. */
window.qaToolbox = (() => {
  const fail = message => { throw new Error(message); };
  function json(text) {
    let value;
    try { value = JSON.parse(text); } catch { fail('Некорректный JSON: проверьте кавычки, запятые и закрывающие скобки.'); }
    function check(v, depth = 0) {
      if (depth > 100) fail('JSON слишком глубоко вложен (максимум 100 уровней).');
      if (typeof v === 'number' && (!Number.isFinite(v) || (Number.isInteger(v) && !Number.isSafeInteger(v)))) fail('Число выходит за безопасную точность JavaScript. Передайте большой идентификатор строкой.');
      if (v && typeof v === 'object') Object.values(v).forEach(x => check(x, depth + 1));
    }
    check(value); return value;
  }
  const pretty = value => JSON.stringify(value, null, 2);
  function base64(text, decode = false, url = false) {
    if (!decode) return btoa(Array.from(new TextEncoder().encode(text), b => String.fromCharCode(b)).join(''));
    if (url) {
      if (!/^[A-Za-z0-9_-]+$/.test(text)) fail('Некорректный Base64URL в JWT.');
      text = text.replace(/-/g, '+').replace(/_/g, '/');
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text) || text.length % 4 === 1 || (text.includes('=') && text.length % 4 !== 0)) fail('Некорректный Base64: проверьте алфавит и padding.');
    const raw = atob(text);
    if (btoa(raw).replace(/=+$/, '') !== text.replace(/=+$/, '')) fail('Неканоническая кодировка Base64.');
    try { return new TextDecoder('utf-8', {fatal:true}).decode(Uint8Array.from(raw, c => c.charCodeAt(0))); }
    catch { fail('Декодированные байты не являются UTF-8 текстом.'); }
  }
  function diffJSON(a, b) {
    const changes = [];
    function walk(x, y, path) {
      if (changes.length >= 2000) fail('Слишком много различий (максимум 2000). Сравните меньшие фрагменты.');
      if (Object.is(x, y)) return;
      if (x && y && typeof x === 'object' && typeof y === 'object' && Array.isArray(x) === Array.isArray(y)) {
        for (const key of new Set([...Object.keys(x), ...Object.keys(y)])) {
          if (changes.length >= 2000) fail('Слишком много различий (максимум 2000). Сравните меньшие фрагменты.');
          const p = path + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1');
          if (!Object.hasOwn(x, key)) changes.push({path:p, type:'added', after:y[key]});
          else if (!Object.hasOwn(y, key)) changes.push({path:p, type:'removed', before:x[key]});
          else walk(x[key], y[key], p);
        }
      } else changes.push({path, type:'changed', before:x, after:y});
    }
    walk(json(a), json(b), ''); return changes.length ? pretty(changes) : 'Различий нет';
  }
  function diffText(a, b) {
    const x = a.replace(/\r\n?/g, '\n').split('\n'), y = b.replace(/\r\n?/g, '\n').split('\n');
    if (x.length > 400 || y.length > 400) fail('Text Diff поддерживает до 400 строк в каждом поле.');
    if (x.join('\n') === y.join('\n')) return 'Различий нет';
    const dp = Array.from({length:x.length+1}, () => new Uint16Array(y.length+1));
    for (let i=x.length-1;i>=0;i--) for (let j=y.length-1;j>=0;j--) dp[i][j]=x[i]===y[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
    const result=[];let i=0,j=0;
    while(i<x.length || j<y.length) {
      if(i<x.length && j<y.length && x[i]===y[j]) {result.push('  '+x[i++]);j++;}
      else if(j<y.length && (i===x.length || dp[i][j+1]>dp[i+1][j])) result.push('+ '+y[j++]);
      else result.push('- '+x[i++]);
    }
    return result.join('\n');
  }
  function timestamp(input, mode) {
    let ms;
    if (mode === 'date') {
      const m=input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/);
      if (!m) fail('Введите ISO дату с часовым поясом, например 2026-01-01T12:00:00+03:00.');
      const year=+m[1],month=+m[2],day=+m[3],leap=year%4===0 && (year%100!==0 || year%400===0);
      const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
      if(month<1 || month>12 || day<1 || day>days[month-1] || +m[4]>23 || +m[5]>59 || +m[6]>59) fail('Несуществующая дата или время.');
      ms=Date.parse(input);
    } else {
      if (!(mode==='seconds'?/^-?\d+(\.\d{1,3})?$/:/^-?\d+$/).test(input)) fail('Введите Unix timestamp: секунды (до 3 знаков дроби) или целые миллисекунды.');
      const negative=input.startsWith('-'),[whole,fraction='']=input.replace(/^-/, '').split('.');
      const amount=mode==='seconds'?BigInt(whole)*1000n+BigInt(fraction.padEnd(3,'0')):BigInt(whole);
      ms=Number(negative?-amount:amount);
    }
    if (!Number.isFinite(ms) || Math.abs(ms)>8640000000000000) fail('Дата выходит за допустимый диапазон.');
    return `UTC: ${new Date(ms).toISOString()}\nUnix seconds: ${ms/1000}\nUnix milliseconds: ${ms}`;
  }
  function run(id, a='', b='', mode='') {
    if (a.length>100000 || b.length>100000) fail('Максимум 100 000 символов в каждом поле.');
    switch(id) {
      case 'json-format': return pretty(json(a));
      case 'json-minify': return JSON.stringify(json(a));
      case 'json-diff': return diffJSON(a,b);
      case 'text-diff': return diffText(a,b);
      case 'base64': return base64(a,mode==='decode');
      case 'url': try {return mode==='decode'?decodeURIComponent(a):encodeURIComponent(a);} catch {fail('Некорректная URL-кодировка или Unicode: проверьте %XX и UTF-8.');} break;
      case 'uuid': {
        if(!/^\d+$/.test(a) || +a<1 || +a>100) fail('Количество UUID должно быть целым числом от 1 до 100.');
        if (!globalThis.crypto?.randomUUID) fail('Генератор требует localhost или HTTPS и современный браузер.');
        return Array.from({length:+a},()=>crypto.randomUUID()).join('\n');
      }
      case 'timestamp': return timestamp(a.trim(),mode);
      case 'characters': return `UTF-16 code units: ${a.length}\nUnicode code points: ${Array.from(a).length}\nГрафемы: ${typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(a)).length:'не поддерживаются браузером'}`;
      case 'bytes': return `UTF-8 bytes: ${new TextEncoder().encode(a).length}`;
      case 'jwt': {
        const parts=a.trim().split('.');
        if(parts.length!==3) fail('Ожидается JWT из 3 сегментов header.payload.signature. JWE (5 сегментов) не поддерживается.');
        if(!/^[A-Za-z0-9_-]*$/.test(parts[2])) fail('Некорректный формат сегмента подписи.');
        const header=json(base64(parts[0],true,true)),payload=json(base64(parts[1],true,true));
        if(!header || !payload || typeof header!=='object' || typeof payload!=='object' || Array.isArray(header) || Array.isArray(payload)) fail('Header и payload JWT должны быть JSON-объектами.');
        return pretty({header,payload,notice:'Подпись НЕ проверена. Claims не подтверждены; декодирование не доказывает подлинность или действительность токена.'});
      }
      default: fail('Неизвестный инструмент.');
    }
  }
  return {run};
})();

// Dependency-free Chrome DevTools Protocol smoke test. Uses an isolated headless profile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const vm = require('node:vm');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:8081';
const chrome = [process.env.QA_CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean).find(p => fs.existsSync(p));
if (!chrome) throw new Error('Set QA_CHROME to the Chrome/Chromium executable.');
fs.mkdirSync('out',{recursive:true});
const profile = fs.mkdtempSync(path.resolve('out/chrome-qa-'));
const child = spawn(chrome,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
  '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
let ws;
(async () => {
  let port;
  for (let i=0;i<100;i++) {
    const portFile = path.join(profile,'DevToolsActivePort');
    if (fs.existsSync(portFile)) {port=fs.readFileSync(portFile,'utf8').split('\n')[0];break;}
    if (child.exitCode !== null) throw new Error('Chrome exited before initialization');
    await delay(100);
  }
  assert.ok(port,'Chrome debugging endpoint available');
  const pages = await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve,reject) => {ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  let id=0; const pending = new Map(); const exceptions=[]; const requests=[];
  ws.addEventListener('message',event => {
    const message=JSON.parse(event.data);
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    if (pending.has(message.id)) {
      const item=pending.get(message.id);pending.delete(message.id);clearTimeout(item.timer);
      message.error ? item.reject(message.error) : item.resolve(message.result);
    }
  });
  const send=(method,params={}) => new Promise((resolve,reject) => {
    const callId=++id;const timer=setTimeout(() => {pending.delete(callId);reject(new Error('CDP timeout: '+method));},15000);
    pending.set(callId,{resolve,reject,timer});ws.send(JSON.stringify({id:callId,method,params}));
  });
  const evaluate=async expression => {
    const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until=async expression => {
    for(let i=0;i<120;i++) {if(await evaluate(expression)) return;await delay(50);}
    throw new Error('Timed out waiting for: '+expression);
  };
  const ready=() => until("document.body?.dataset.ready === 'true'");
  const go=async route => {
    await send('Page.navigate',{url:base+route});
    await until('location.pathname === '+JSON.stringify(new URL(base+route).pathname));
    await ready();
  };
  const screenshot=async name => {
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync('out/'+name+'.png',Buffer.from(shot.data,'base64'));
  };
  const viewport=(width,height=950) => send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
  const noOverflow=async label => assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'),label);
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await viewport(1440);
  const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('web/data.js','utf8'),context);
  for(const meta of context.window.qaData.sections) {
    await go(meta.href);
    assert.ok(await evaluate('document.querySelector("h1").textContent.length > 0'),meta.id);
    const expected=meta.id==='http-codes'?26:['what-to-test','troubleshooting','toolbox'].includes(meta.id)?1:3;
    const count=await evaluate(meta.id==='http-codes'?'document.querySelectorAll(".code-row").length':'document.querySelectorAll(".article-topic").length');
    assert.ok(count>=expected,meta.id);
    if (!['what-to-test','troubleshooting','toolbox'].includes(meta.id)) assert.equal(await evaluate(`Array.from(document.querySelectorAll('.topic-nav a,.category-nav a')).every(a => document.getElementById(a.hash.slice(1)))`),true,meta.id);
    await noOverflow(meta.id);
  }
  console.log('All 24 pages rendered, headings and anchors verified.');
  await go('/');
  assert.equal(await evaluate('document.querySelectorAll("#section-grid a.section-card").length'),24);
  assert.equal(await evaluate('document.querySelectorAll(".card-pending").length'),0);
  await evaluate(`document.querySelector('a.section-card[href="/http-codes"]').click()`);
  await until("location.pathname === '/http-codes'");await ready();
  await go('/');
  const search=async value => {
    await evaluate(`(() => {const input=document.getElementById('knowledge-search');input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  };
  await search('SELECT COALESCE');
  assert.ok(await evaluate("document.querySelector('.search-result').href.includes('/sql?q=')"));
  assert.ok(await evaluate("document.querySelector('.search-result').hash === '#join'"));
  await evaluate("document.querySelector('.search-result').click()");
  await until("location.pathname === '/sql'");await ready();
  assert.equal(await evaluate('location.hash'),'#join');
  assert.ok(await evaluate("document.querySelector('.return-link').href.includes('q=SELECT')"));
  await evaluate('history.back()');await until("location.pathname === '/'");await ready();
  assert.equal(await evaluate("document.getElementById('knowledge-search').value"),'SELECT COALESCE');
  await send('Page.reload');await ready();
  assert.equal(await evaluate("document.getElementById('knowledge-search').value"),'SELECT COALESCE');
  await search('NO_SUCH_TOPIC_12345');
  assert.ok(await evaluate("document.querySelector('.empty-results').textContent.includes('Ничего')"));
  await evaluate("document.querySelector('.clear-results').click()");
  assert.equal(await evaluate("document.activeElement.id"),'knowledge-search');
  await search('404');
  assert.ok(await evaluate("Array.from(document.querySelectorAll('.search-result')).some(a => a.hash === '#codes-4xx')"));
  await search('<script>alert(1)</script>');
  assert.equal(await evaluate("document.querySelectorAll('#search-results script').length"),0);
  await evaluate("document.getElementById('search-reset').click()");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.ok(await evaluate("document.activeElement.matches('a.section-card')"),'Keyboard reaches catalog');
  console.log('Search, direct results, history, reload, empty state and keyboard verified.');
  await go('/sql#select');
  await send('Page.bringToFront');
  await send('Browser.grantPermissions',{origin:new URL(base).origin,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
  const expected=await evaluate("document.querySelector('#select pre').textContent");
  await evaluate("document.querySelector('#select .copy-button').click()");
  await until("document.querySelector('#select .copy-status').textContent === 'Скопировано'");
  assert.equal((await evaluate('navigator.clipboard.readText()')).replaceAll('\r\n','\n'),expected);
  await evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async()=>{throw new Error('Denied')}}})");
  await evaluate("document.querySelector('#select .copy-button').click()");
  await until("document.querySelector('#select .copy-status').textContent.includes('Не удалось')");
  console.log('Clipboard success and failure verified.');
  for (const width of [1440,1024,768,390,320]) {
    await viewport(width);
    for (const route of ['/','/practice','/sql','/architecture','/http-codes','/what-to-test','/troubleshooting','/toolbox']) {
      await go(route);await noOverflow(width+' '+route);
      if(route==='/') await screenshot('home-'+width);
      if(route==='/practice' && width===390) await screenshot('practice-mobile');
      if(route==='/what-to-test' && width===390) await screenshot('checklist-mobile');
      if(route==='/sql' && width===390) await screenshot('sql-mobile');
      if(route==='/architecture' && width===1440) await screenshot('architecture-desktop');
    }
  }

  await go('/what-to-test#login');
  for (const scenario of ['registration','search','filters','sorting','pagination','forms','upload','cart','promo-codes','checkout','payment','profile','email','tables','dates','api','login']) {
    await evaluate('document.querySelector(' + JSON.stringify('a[data-scenario="'+scenario+'"]') + ').click()');
    await until('document.querySelector(".interactive-checklist").id === ' + JSON.stringify(scenario));
    assert.ok(await evaluate('document.querySelectorAll(".check-item input").length >= 15'));
  }
  assert.equal(await evaluate('document.querySelectorAll(".check-item").length'),15);
  await evaluate('localStorage.clear()');
  await send('Page.reload'); await ready();
  await evaluate('document.querySelector(".check-item input").click()');
  assert.ok(await evaluate('document.querySelector(".check-counter").textContent.includes("1 из 15")'));
  await send('Page.reload');await ready();
  assert.equal(await evaluate('document.querySelector(".check-item input").checked'),true);
  await evaluate('document.querySelector("a[data-scenario=registration]").click()');
  await until('location.hash === "#registration" && document.querySelector(".interactive-checklist").id === "registration"');
  assert.equal(await evaluate('document.querySelectorAll("input:checked").length'),0);
  await evaluate('document.querySelector(".check-item input").click()');
  await evaluate('history.back()');
  await until('document.querySelector(".interactive-checklist").id === "login"');
  assert.equal(await evaluate('document.querySelectorAll("input:checked").length'),1);
  await evaluate('document.querySelectorAll(".check-toolbar button")[1].click()');
  assert.equal(await evaluate('document.querySelectorAll("input:checked").length'),0);
  await evaluate('document.querySelectorAll(".check-toolbar button")[2].click()');
  assert.equal(await evaluate('document.querySelectorAll("input:checked").length'),1);
  await evaluate('document.querySelector(".check-item input").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  assert.equal(await evaluate('document.querySelectorAll("input:checked").length'),0);
  await evaluate('document.querySelector(".check-item input").click()');
  await evaluate('document.querySelector(".check-toolbar button").click()');
  await until('document.querySelector(".check-message").textContent.includes("скопирован")');
  const copied=await evaluate('navigator.clipboard.readText()');
  assert.ok(copied.includes('[x] Пустые поля') && copied.includes('[ ] Неверный пароль'));
  assert.ok(copied.includes('сессия не создаётся'));
  await evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw new Error("Denied")}}})');
  await evaluate('document.querySelector(".check-toolbar button").click()');
  await until('document.querySelector(".check-message").textContent.includes("Не удалось")');
  await evaluate('localStorage.setItem("qaHelpers.checklists.v1.login", "bad-json")');
  await send('Page.reload');await ready();
  assert.equal(await evaluate('document.querySelectorAll("input:checked").length'),0);
  await evaluate('localStorage.setItem("qaHelpers.checklists.v1.login", JSON.stringify(["empty","removed-id",42]))');
  await send('Page.reload');await ready();
  assert.equal(await evaluate('document.querySelectorAll("input:checked").length'),1);
  await go('/what-to-test#missing');
  assert.equal(await evaluate('location.hash'),'#login');
  const denied=await send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(window,"localStorage",{get(){throw new Error("Denied")}})'});
  await send('Page.reload');await ready();
  assert.ok(await evaluate('document.getElementById("module-status").textContent.includes("Сохранение недоступно")'));
  await evaluate('document.querySelector(".check-item input").click()');
  assert.equal(await evaluate('document.querySelectorAll("input:checked").length'),1);
  await evaluate('document.querySelector("a[data-scenario=api]").click()');
  await until('document.querySelector(".interactive-checklist").id === "api"');
  await evaluate('document.querySelector("a[data-scenario=login]").click()');
  await until('document.querySelector(".interactive-checklist").id === "login"');
  assert.equal(await evaluate('document.querySelectorAll("input:checked").length'),1);
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:denied.identifier});
  await go('/?q=Remember%20me');
  await evaluate('Array.from(document.querySelectorAll(".search-result")).find(a=>a.hash==="#login").click()');
  await until('location.pathname === "/what-to-test"');await ready();
  assert.equal(await evaluate('location.hash'),'#login');
  assert.ok(await evaluate('document.querySelector(".return-link").href.includes("q=Remember")'));
  console.log('Checklists: persistence, isolation, reset/undo, copy, keyboard, corruption, denied storage, search verified.');


  await go('/');
  assert.equal(await evaluate('document.querySelectorAll(".intent-card").length'),3);
  assert.equal(await evaluate('document.querySelectorAll(".quick-card").length'),4);
  assert.equal(await evaluate("document.querySelector('a.quick-card[href=\"/toolbox\"]') !== null"),true);

  await evaluate('document.querySelector(".skip-link").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate('document.activeElement.id'),'main-content');
  await evaluate('document.querySelector(".intent-card").focus()');
  assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'),'solid');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate('document.activeElement.id'),'library-title');
  await go('/practice');
  const targets=await evaluate('Array.from(document.querySelectorAll(".practice-links a")).map(a=>a.pathname+a.hash)');
  assert.equal(targets.length,11);
  for(const target of targets) {
    await go(target);
    if(target.includes('#')) assert.equal(await evaluate('Boolean(document.getElementById(location.hash.slice(1)))'),true,target);
  }
  await go('/?q=SELECT');
  assert.ok(await evaluate('document.getElementById("library").getBoundingClientRect().top < innerHeight'));
  console.log('Task entries, quick access, practice links, focus and visible search verified.');


  await go('/what-to-test#login');
  await evaluate('localStorage.clear()'); await send('Page.reload');await ready();
  const filter=async (text,category='')=>{
   await evaluate('document.getElementById("checklist-search").value='+JSON.stringify(text));
   await evaluate('document.getElementById("checklist-category").value='+JSON.stringify(category));
   await evaluate('document.getElementById("checklist-search").dispatchEvent(new Event("input",{bubbles:true}))');
  };
  await filter('Remember','login');
  assert.equal(await evaluate('document.querySelectorAll("#scenario-results a").length'),1);
  assert.ok(await evaluate('document.querySelectorAll(".check-item mark").length>0'));
  await evaluate('document.querySelector("[data-action=all]").click()');
  assert.equal(await evaluate('document.querySelectorAll(".check-item input:checked").length'),15);
  assert.equal(await evaluate('document.querySelector("progress").value'),15);
  await send('Page.reload');await ready();
  assert.equal(await evaluate('document.getElementById("checklist-search").value'),'Remember');
  assert.equal(await evaluate('document.getElementById("checklist-category").value'),'login');
  await evaluate('document.querySelector("[data-action=copy]").click()');
  await until('document.querySelector(".check-message").textContent.includes("скопирован")');
  const md=await evaluate('navigator.clipboard.readText()');
  assert.ok(md.startsWith('# Авторизация'));
  assert.equal(md.split('- [x]').length-1,15);
  await evaluate('document.getElementById("checklist-format").value="text"');
  await evaluate('document.getElementById("checklist-format").dispatchEvent(new Event("change"))');
  await evaluate('document.querySelector("[data-action=copy]").click()');
  await until('navigator.clipboard.readText().then(text=>text.startsWith("Авторизация"))');
  const plain=await evaluate('navigator.clipboard.readText()');assert.ok(!plain.startsWith('#'));assert.ok(plain.includes('[x] Пустые поля'));
  await filter('нетсовпадений123','forms');
  assert.ok(await evaluate('Boolean(document.querySelector(".scenario-empty"))'));
  assert.equal(await evaluate('document.querySelectorAll(".check-item input:checked").length'),15);
  await evaluate('document.querySelector("[data-action=reset]").click()');
  assert.equal(await evaluate('document.querySelector("progress").value'),0);
  await evaluate('document.querySelector("[data-action=undo]").click()');
  assert.equal(await evaluate('document.querySelector("progress").value'),15);
  await filter('<img onerror=alert(1)>');
  assert.equal(await evaluate('document.querySelectorAll("#scenario-results img").length'),0);
  await filter('','forms');
  await evaluate('document.querySelector("a[data-scenario=forms]").click()');
  await until('document.querySelector(".interactive-checklist").id==="forms"');
  assert.equal(await evaluate('document.querySelector("progress").value'),0);
  await evaluate('history.back()');
  await until('document.querySelector(".interactive-checklist").id==="login"');
  assert.equal(await evaluate('document.querySelector("progress").value'),15);
  await go('/what-to-test?category=bad&checklist-search=remember&q=SQL#bad');
  assert.equal(await evaluate('document.getElementById("checklist-category").value'),'');
  assert.equal(await evaluate('location.hash'),'#login');
  assert.ok(await evaluate('document.querySelector(".return-link").href.includes("q=SQL")'));
  console.log('Library filters, full-list actions, progress, exports, URL and compatibility verified.');


  await go('/troubleshooting');
  assert.equal(await evaluate('document.querySelectorAll("a[data-symptom]").length'),16);
  const symptoms=await evaluate('Array.from(document.querySelectorAll("a[data-symptom]")).map(a=>a.dataset.symptom)');
  for(const id of symptoms){
   await evaluate('document.querySelector('+JSON.stringify('a[data-symptom="'+id+'"]')+').click()');
   await until('document.querySelector(".diagnostic-scenario").id==='+JSON.stringify(id));
   assert.equal(await evaluate('document.querySelectorAll(".diagnostic-scenario h3").length'),6);
   assert.ok(await evaluate('document.querySelectorAll(".diagnostic-scenario ol li").length>=5'));
  }
  await go('/troubleshooting?q=timeout#api-timeout');
  assert.equal(await evaluate('document.querySelector(".diagnostic-scenario").id'),'api-timeout');
  assert.ok(await evaluate('document.querySelector(".return-link").href.includes("q=timeout")'));
  await send('Page.reload');await ready();
  assert.equal(await evaluate('document.querySelector(".diagnostic-scenario").id'),'api-timeout');
  await evaluate('document.querySelector("a[data-symptom=cors]").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until('document.querySelector(".diagnostic-scenario").id==="cors"');
  assert.equal(await evaluate('document.activeElement.id'),'symptom-title');
  await evaluate('history.back()');await until('document.querySelector(".diagnostic-scenario").id==="api-timeout"');
  await go('/troubleshooting#unknown');
  assert.equal(await evaluate('location.hash'),'#api-400');
  await viewport(390);await go('/troubleshooting#cors');await noOverflow('Troubleshooting mobile');await screenshot('troubleshooting-mobile');
  await viewport(1440);await go('/troubleshooting#api-500');await screenshot('troubleshooting-desktop');
  console.log('Troubleshooting: all symptoms, six sections, direct URLs, keyboard and history verified.');


  await go('/toolbox?q=JWT#jwt');
  await delay(150);
  const beforeRequests=requests.length;
  await evaluate('document.getElementById("tool-example").click()');
  assert.ok(await evaluate('document.getElementById("tool-output").value.includes("qa-demo")'));
  await evaluate('document.getElementById("tool-copy").click()');
  await until('document.querySelector(".tool-form [role=status]").textContent.includes("скопирован")');
  assert.ok((await evaluate('navigator.clipboard.readText()')).includes('qa-demo'));
  await delay(150);
  assert.equal(requests.length,beforeRequests,'JWT operations cause no network requests');
  assert.equal(await evaluate('Object.keys(localStorage).some(k=>/toolbox|jwt/i.test(k))'),false);
  const toolIds=await evaluate('Array.from(document.querySelectorAll("[data-tool]")).map(a=>a.dataset.tool)');
  assert.equal(toolIds.length,14);
  for(const id of toolIds.filter(id=>!["test-data-generator","boundary-value-generator","bug-report-builder"].includes(id))) {
    await evaluate('document.querySelector('+JSON.stringify('[data-tool="'+id+'"]')+').click()');
    assert.equal(await evaluate('document.activeElement.id'),'tool-title');
    await evaluate('document.getElementById("tool-example").click()');
    assert.equal(await evaluate('document.getElementById("tool-error").textContent'),'');
    assert.ok(await evaluate('document.getElementById("tool-output").value.length>0'),id);
    await evaluate('document.getElementById("tool-clear").click()');
    assert.equal(await evaluate('document.getElementById("tool-input-0").value'),'');
    assert.equal(await evaluate('document.getElementById("tool-output").value'),'');
    assert.equal(await evaluate('document.getElementById("tool-copy").disabled'),true);
  }
  await go('/toolbox#json-format');
  await evaluate('document.getElementById("tool-input-0").value="{broken";document.getElementById("tool-run").click()');
  assert.ok(await evaluate('document.getElementById("tool-error").textContent.includes("JSON")'));
  await evaluate('document.getElementById("tool-example").click();document.getElementById("tool-input-0").dispatchEvent(new Event("input"))');
  assert.equal(await evaluate('document.getElementById("tool-copy").disabled'),true);
  await evaluate('document.querySelector("[data-tool=base64]").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until('location.hash==="#base64"');
  assert.equal(await evaluate('document.activeElement.id'),'tool-title');
  await evaluate('document.getElementById("tool-mode").value="decode";document.getElementById("tool-example").click()');
  assert.equal(await evaluate('document.getElementById("tool-output").value'),'Привет, QA!');
  await evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>Promise.reject(new Error("denied"))}});document.getElementById("tool-copy").click()');
  await until('document.querySelector(".tool-form [role=status]").textContent.includes("Ctrl+C")');
  await evaluate('history.back()');await until('location.hash==="#json-format"');
  await go('/toolbox#unknown');assert.equal(await evaluate('location.hash'),'#json-format');
  for(const width of [1440,1024,768,390,320]) {
    await viewport(width);await go('/toolbox#json-diff');
    await evaluate('document.getElementById("tool-example").click()');
    await noOverflow('Toolbox '+width);await screenshot('toolbox-'+width);
  }
  console.log('Toolbox: 11 examples, errors, clear/copy, keyboard, history, responsive layouts and local-only JWT verified.');


  await go('/toolbox?q=generator#test-data-generator');
  await delay(100);
  const generatorRequests=requests.length;
  const setGenerator=async (key,value)=>evaluate('document.getElementById('+JSON.stringify('generator-'+key)+').value='+JSON.stringify(String(value))+';document.getElementById('+JSON.stringify('generator-'+key)+').dispatchEvent(new Event("input"))');
  const generateData=async()=>evaluate('document.getElementById("generator-generate").click()');
  const allData=async()=>JSON.parse(await evaluate('document.getElementById("generator-export").value'));
  const types=await evaluate('window.qaGenerator.types.map(t=>t.id)');
  assert.equal(types.length,11);
  for(const type of types) {
    await setGenerator('type',type);await setGenerator('count',3);await generateData();
    assert.equal(await evaluate('document.getElementById("generator-error").textContent'),'');
    assert.equal((await allData()).length,3,type);
    assert.equal(await evaluate('document.querySelectorAll(".generator-result").length'),3);
  }
  await setGenerator('type','uuid');await generateData();const firstUUIDs=await allData();
  await evaluate('document.getElementById("generator-regenerate").click()');
  assert.notDeepEqual(await allData(),firstUUIDs);
  await setGenerator('type','string');await setGenerator('length',25);await generateData();
  assert.ok((await allData()).every(v=>v.length===25));
  await setGenerator('count',0);await generateData();
  assert.ok(await evaluate('document.getElementById("generator-error").textContent.includes("Количество")'));
  assert.equal(await evaluate('document.getElementById("generator-copy-all").disabled'),true);
  await setGenerator('mode','edge');await generateData();
  const edgeData=await allData();assert.equal(edgeData.length,12);assert.equal(edgeData[0],'');assert.equal(edgeData[1],' ');
  assert.equal(await evaluate('document.querySelectorAll(".generator-result b, .generator-result script").length'),0);
  await evaluate('document.querySelectorAll(".generator-result button")[1].click()');
  await until('document.querySelector(".generator-form [role=status]").textContent.includes("Скопировано")');
  assert.equal(await evaluate('navigator.clipboard.readText()'),' ');
  await evaluate('document.querySelectorAll(".generator-result button")[0].click()');
  await until('navigator.clipboard.readText().then(v=>v==="")');
  await evaluate('document.getElementById("generator-copy-all").click()');
  await until('navigator.clipboard.readText().then(v=>v.startsWith("["))');
  assert.deepEqual(JSON.parse(await evaluate('navigator.clipboard.readText()')),edgeData);
  await setGenerator('edge','long');await setGenerator('count',2);await setGenerator('longLength',2048);await generateData();
  assert.ok((await allData()).every(v=>v.length===2048));
  await delay(100);// Chrome reports its built-in date picker icon as a data: resource; it never uses the network.
  assert.deepEqual(requests.slice(generatorRequests).filter(r=>!r.url.startsWith('data:')),[],'Generator makes no network requests');
  await evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>Promise.reject(new Error("denied"))}});document.getElementById("generator-copy-all").click()');
  await until('document.querySelector(".generator-form [role=status]").textContent.includes("Ctrl+C")');
  assert.equal(await evaluate('document.activeElement.id'),'generator-export');
  await evaluate('document.getElementById("generator-clear").click()');
  assert.equal(await evaluate('document.querySelectorAll(".generator-result").length'),0);
  assert.equal(await evaluate('document.getElementById("generator-copy-all").disabled'),true);
  assert.equal(await evaluate('document.activeElement.id'),'generator-count');
  await evaluate('document.getElementById("generator-generate").focus()');
  assert.equal(await evaluate("document.activeElement.id"),"generator-generate");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until('document.querySelectorAll(".generator-result").length===2 || document.getElementById("generator-error").textContent.length>0');
  assert.equal(await evaluate('document.querySelectorAll(".generator-result").length'),2,await evaluate('document.getElementById("generator-error").textContent'));
  for(const width of [1440,1024,768,390,320]) {
    await viewport(width);await go('/toolbox#test-data-generator');
    await setGenerator('mode','edge');await generateData();await noOverflow('Generator '+width);
    await evaluate('document.getElementById("generator-mode").scrollIntoView({block:"start"})');
    await screenshot('generator-'+width);
  }
  await go('/toolbox#test-data-generator');
  await send('Page.reload');await ready();
  assert.equal(await evaluate('document.querySelectorAll(".generator-result").length'),0);
  console.log('Test Data Generator: 11 types, 12 edge cases, ranges, copies, regenerate, keyboard, no network and responsive layouts verified.');


  await go('/toolbox#boundary-value-generator');await delay(100);
  const boundaryRequests=requests.length;
  const setBoundary=async(key,value)=>evaluate('document.getElementById('+JSON.stringify('boundary-'+key)+').value='+JSON.stringify(String(value))+';document.getElementById('+JSON.stringify('boundary-'+key)+').dispatchEvent(new Event("input"))');
  const generateBoundary=async()=>evaluate('document.getElementById("boundary-generate").click()');
  await generateBoundary();
  assert.equal(await evaluate('document.getElementById("boundary-export").value'),'2\n3\n4\n49\n50\n51');
  assert.equal(await evaluate('document.querySelectorAll(".generator-result").length'),6);
  await evaluate('document.getElementById("boundary-copy-values").click()');
  await until('document.querySelector(".tool-form [role=status]").textContent.includes("Скопировано")');
  assert.equal((await evaluate('navigator.clipboard.readText()')).replace(/\r\n/g,'\n'),'2\n3\n4\n49\n50\n51');
  await evaluate('document.getElementById("boundary-copy-checklist").click()');
  await until('navigator.clipboard.readText().then(v=>v.startsWith("# Boundary"))');
  assert.equal((await evaluate('navigator.clipboard.readText()')).split('- [ ]').length-1,6);
  await setBoundary('min','-0.1');await setBoundary('max','0.1');await setBoundary('step','0.1');await generateBoundary();
  assert.equal(await evaluate('document.getElementById("boundary-export").value'),'-0.2\n-0.1\n0\n0\n0.1\n0.2');
  for(const [min,max] of [['','5'],['5',''],['6','5'],['abc','5']]){
    await setBoundary('min',min);await setBoundary('max',max);await generateBoundary();
    assert.ok(await evaluate('document.getElementById("boundary-error").textContent.length>0'));
    assert.equal(await evaluate('document.getElementById("boundary-copy-values").disabled'),true);
  }
  await setBoundary('min','5');await setBoundary('max','5');await generateBoundary();
  assert.ok(await evaluate('document.querySelector(".tool-form .content-note").textContent.includes("min = max")'));
  await setBoundary('mode','length');await setBoundary('min','3');await setBoundary('max','50');await generateBoundary();
  assert.equal(await evaluate('document.getElementById("boundary-step").disabled'),true);
  const boundaryStrings=JSON.parse(await evaluate('document.getElementById("boundary-export").value'));
  assert.deepEqual(boundaryStrings.map(s=>s.length),[2,3,4,49,50,51]);
  await evaluate('document.getElementById("boundary-copy-values").click()');
  await until('navigator.clipboard.readText().then(v=>v.startsWith("["))');
  assert.deepEqual(JSON.parse(await evaluate('navigator.clipboard.readText()')),boundaryStrings);
  await setBoundary('min',0);await setBoundary('max',0);await generateBoundary();
  assert.deepEqual(JSON.parse(await evaluate('document.getElementById("boundary-export").value')),['','A','','A']);
  assert.equal(await evaluate('document.querySelectorAll(".generator-result textarea").length'),4);
  await evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>Promise.reject(new Error("denied"))}});document.getElementById("boundary-copy-checklist").click()');
  await until('document.querySelector(".tool-form [role=status]").textContent.includes("Ctrl+C")');
  assert.equal(await evaluate('document.activeElement.id'),'boundary-export');
  assert.deepEqual(requests.slice(boundaryRequests).filter(r=>!r.url.startsWith('data:')),[]);
  await evaluate('document.getElementById("boundary-clear").click()');
  assert.equal(await evaluate('document.activeElement.id'),'boundary-min');
  assert.equal(await evaluate('document.getElementById("boundary-min").value'),'');
  await setBoundary('min',3);await setBoundary('max',50);
  await evaluate('document.getElementById("boundary-generate").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until('document.querySelectorAll(".generator-result").length===6');
  assert.ok(await evaluate('Array.from(document.querySelectorAll(".utility a")).some(a=>a.pathname==="/test-design" && a.hash==="#boundaries")'));
  for(const width of [1440,1024,768,390,320]) {
    await viewport(width);await go('/toolbox#boundary-value-generator');
    await setBoundary('mode','length');await setBoundary('min',3);await setBoundary('max',50);await generateBoundary();
    await noOverflow('Boundary '+width);await evaluate('document.getElementById("boundary-mode").scrollIntoView({block:"start"})');await screenshot('boundary-'+width);
  }
  console.log('Boundary generator: exact decimals, six roles, invalid bounds, strings, clipboard, keyboard, links, no network and responsive layouts verified.');


  await go('/http-codes');
  assert.equal(await evaluate('document.querySelectorAll(".status-card").length'),26);
  assert.equal(await evaluate('document.querySelectorAll(".status-comparison").length'),6);
  const findStatus=async value=>evaluate('document.getElementById("status-search").value='+JSON.stringify(value)+';document.getElementById("status-search").dispatchEvent(new Event("input"))');
  await findStatus('409');assert.equal(await evaluate('document.querySelectorAll(".status-card").length'),1);
  assert.equal(await evaluate('document.querySelector(".status-card").id'),'status-409');
  await findStatus('нет авторизации');assert.equal(await evaluate('document.querySelector(".status-card").id'),'status-401');
  await findStatus('ресурс не найден');assert.equal(await evaluate('document.querySelector(".status-card").id'),'status-404');
  await findStatus('<script>');assert.equal(await evaluate('document.querySelectorAll(".status-card").length'),0);
  assert.ok(await evaluate('document.getElementById("finder-status").textContent.includes("Ничего")'));
  await evaluate('document.getElementById("finder-reset").click()');
  assert.equal(await evaluate('document.activeElement.id'),'status-search');
  for(const prefix of ['1xx','2xx','3xx','4xx','5xx']){
    await evaluate('document.querySelector('+JSON.stringify('[data-status-class="'+prefix+'"]')+').click()');
    assert.equal(await evaluate('Array.from(document.querySelectorAll(".status-card")).every(c=>c.id.startsWith("status-'+prefix[0]+'"))'),true);
    assert.equal(await evaluate('document.querySelector('+JSON.stringify('[data-status-class="'+prefix+'"]')+').getAttribute("aria-pressed")'),'true');
  }
  await findStatus('409');assert.equal(await evaluate('document.querySelectorAll(".status-card").length'),0);
  await evaluate('document.getElementById("finder-reset").click()');await findStatus('нет авторизации');
  await send('Page.reload');await ready();assert.equal(await evaluate('document.getElementById("status-search").value'),'нет авторизации');
  await go('/http-codes?q=HTTP&status-search=409&status-class=4xx');
  await evaluate('document.querySelector("#status-409 details").open=true;document.querySelector("#status-409 a[data-finder-target=status-422]").click()');
  assert.equal(await evaluate('location.hash'),'#status-422');
  assert.equal(await evaluate('document.querySelector("#status-422 details").open'),true);
  assert.ok(await evaluate('location.search.includes("q=HTTP") && !location.search.includes("status-search")'));
  await evaluate('history.back()');await until('document.getElementById("status-search").value==="409"');
  assert.equal(await evaluate('document.querySelectorAll(".status-card").length'),1);
  await go('/http-codes#codes-4xx');assert.ok(await evaluate('document.getElementById("codes-4xx")!==null'));
  await go('/http-codes?status-search=409&status-class=4xx#status-410');
  assert.equal(await evaluate('document.querySelector("#status-410 details").open'),true);
  assert.equal(await evaluate('document.getElementById("status-search").value'),'');
  await evaluate('document.querySelector("#status-410 a[data-finder-target=compare-404-410]").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until('location.hash==="#compare-404-410"');
  assert.equal(await evaluate('document.activeElement.parentElement.id'),'compare-404-410');
  await go('/http-codes#status-401');
  assert.ok(await evaluate('document.querySelector("#status-401 a.back-link").href.includes("/http#headers")'));
  for(const width of [1440,1024,768,390,320]){
    await viewport(width);await go('/http-codes#status-401');await noOverflow('HTTP Finder '+width);await screenshot('http-finder-'+width);
    await go('/http-codes#compare-500-502-503-504');await noOverflow('HTTP comparisons '+width);
  }
  console.log('HTTP Finder: 26 statuses, problem search, class filters, six comparisons, old/new URLs, reload/history and keyboard verified.');


  await go('/toolbox#bug-report-builder');
  assert.equal(await evaluate('document.querySelectorAll(".bug-form .content-note li").length'),5);
  const fillBug=async(id,value)=>evaluate('document.getElementById('+JSON.stringify('bug-'+id)+').value='+JSON.stringify(value)+';document.getElementById('+JSON.stringify('bug-'+id)+').dispatchEvent(new Event("input"))');
  const bugRequests=requests.length;
  await fillBug('title','Корзина: итоговая сумма не обновляется после удаления товара');
  await fillBug('environment','stage / build 52 / Chrome');await fillBug('preconditions','Два товара');
  await fillBug('actual','Сумма прежняя');await fillBug('expected','Сумма уменьшилась');
  await fillBug('severity','Major');await fillBug('priority','P1');await fillBug('additional','request ID: qa-123');
  await fillBug('step-0','Открыть корзину');await evaluate('document.getElementById("bug-add-step").click()');
  assert.equal(await evaluate('document.activeElement.id'),'bug-step-1');await fillBug('step-1','Удалить товар');
  await evaluate('document.querySelectorAll(".bug-step")[1].querySelector("[data-step-action=up]").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await until('document.getElementById("bug-step-0").value==="Удалить товар"');
  assert.equal(await evaluate('document.getElementById("bug-step-0").value'),'Удалить товар');
  assert.equal(await evaluate('document.activeElement.id'),'bug-step-0');
  await evaluate('document.querySelectorAll(".bug-step")[0].querySelector("[data-step-action=down]").click()');
  await evaluate('document.querySelectorAll(".bug-step")[1].querySelector("[data-step-action=remove]").click()');
  assert.equal(await evaluate('document.querySelectorAll(".bug-step").length'),1);
  await evaluate('document.getElementById("bug-undo-step").click()');
  assert.equal(await evaluate('document.getElementById("bug-step-1").value'),'Удалить товар');
  assert.ok(await evaluate('document.querySelector(".bug-form .content-note").textContent.includes("замечаний нет")'));
  for(const format of ['plain','markdown','jira']){
    await fillBug('format',format);const exportText=await evaluate('document.getElementById("bug-output").value');
    assert.ok(exportText.includes('Expected result') && exportText.includes('Удалить товар'));
    await evaluate('document.getElementById("bug-copy").click()');
    await until('document.querySelector(".bug-form > [role=status]:last-child").textContent.includes("скопирован")');
    assert.equal((await evaluate('navigator.clipboard.readText()')).replace(/\r\n/g,'\n'),exportText);
  }
  // The host antivirus injects Kaspersky form-inspection code into HTTP pages.
  // Exclude only that observed third-party traffic; do not alter antivirus settings.
  assert.deepEqual(requests.slice(bugRequests).filter(r=>!r.url.startsWith('data:') && !new URL(r.url).hostname.endsWith('.kaspersky-labs.com')),[]);
  await send('Page.reload');await ready();
  await until('document.getElementById("bug-title")?.value.includes("Корзина")');
  assert.equal(await evaluate('document.getElementById("bug-step-1").value'),'Удалить товар');
  assert.equal(await evaluate('document.getElementById("bug-format").value'),'jira');
  assert.equal(await evaluate('document.getElementById("bug-environment").value'),'stage / build 52 / Chrome');
  await evaluate('document.querySelector("[data-tool=json-format]").click();document.querySelector("[data-tool=bug-report-builder]").click()');
  assert.equal(await evaluate('document.getElementById("bug-priority").value'),'P1');
  await fillBug('expected','');assert.ok(await evaluate('document.querySelector(".bug-form .content-note").textContent.includes("Не заполнен Expected")'));
  assert.equal(await evaluate('document.getElementById("bug-copy").disabled'),false);
  await evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>Promise.reject(new Error("denied"))}});document.getElementById("bug-copy").click()');
  await until('document.querySelector(".bug-form > [role=status]:last-child").textContent.includes("Ctrl+C")');
  assert.equal(await evaluate('document.activeElement.id'),'bug-output');
  await evaluate('Object.defineProperty(window,"localStorage",{configurable:true,get:()=>{throw new Error("denied")}});true');
  await fillBug('additional','memory fallback');assert.ok(await evaluate('document.getElementById("bug-draft-status").textContent.includes("Не удалось сохранить")'));
  await evaluate('document.querySelector("[data-tool=json-format]").click();document.querySelector("[data-tool=bug-report-builder]").click()');
  assert.equal(await evaluate('document.getElementById("bug-additional").value'),'memory fallback');
  assert.ok(await evaluate('document.getElementById("bug-draft-status").textContent.includes("Не удалось сохранить")'));
  await send('Page.reload');await ready();
  await evaluate('localStorage.setItem("qaHelpers.bugReport.v1","{broken");window.qaBugDraftSession=null;document.querySelector("[data-tool=json-format]").click();document.querySelector("[data-tool=bug-report-builder]").click()');
  assert.ok(await evaluate('document.getElementById("bug-draft-status").textContent.includes("Не удалось прочитать")'));
  assert.equal(await evaluate('localStorage.getItem("qaHelpers.bugReport.v1")'),'{broken');
  await fillBug('title','Корзина: итоговая сумма не обновляется');await fillBug('environment','stage / Chrome');await fillBug('step-0','Открыть корзину');
  for(const width of [1440,1024,768,390,320]){
    await viewport(width);await noOverflow('Bug builder '+width);await evaluate('document.getElementById("bug-title").scrollIntoView({block:"start",behavior:"instant"})');await screenshot('bug-report-'+width);
  }
  console.log('Bug builder: fields, dynamic steps, three exports, clipboard, advisory rules, draft reload, storage failure and responsive layouts verified.');

  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  console.log('Responsive layouts 1440/768/390/320 verified; no browser exceptions.');
  await send('Browser.close');
})().catch(error => {console.error(error);process.exitCode=1;}).finally(() => {ws?.close();child.kill();});

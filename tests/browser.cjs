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
  let id=0; const pending = new Map(); const exceptions=[];
  ws.addEventListener('message',event => {
    const message=JSON.parse(event.data);
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
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await viewport(1440);
  const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('web/data.js','utf8'),context);
  for(const meta of context.window.qaData.sections) {
    await go(meta.href);
    assert.ok(await evaluate('document.querySelector("h1").textContent.length > 0'),meta.id);
    const expected=meta.id==='http-codes'?25:3;
    const count=await evaluate(meta.id==='http-codes'?'document.querySelectorAll(".code-row").length':'document.querySelectorAll(".article-topic").length');
    assert.ok(count>=expected,meta.id);
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('.topic-nav a,.category-nav a')).every(a => document.getElementById(a.hash.slice(1)))`),true,meta.id);
    await noOverflow(meta.id);
  }
  console.log('All 21 pages rendered, headings and anchors verified.');
  await go('/');
  assert.equal(await evaluate('document.querySelectorAll("a.section-card").length'),21);
  assert.equal(await evaluate('document.querySelectorAll(".card-pending").length'),0);
  await evaluate("document.querySelector('a.section-card').click()");
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
  for (const width of [1440,768,390,320]) {
    await viewport(width);
    for (const route of ['/','/sql','/architecture','/http-codes']) {
      await go(route);await noOverflow(width+' '+route);
      if(route==='/') await screenshot('home-'+width);
      if(route==='/sql' && width===390) await screenshot('sql-mobile');
      if(route==='/architecture' && width===1440) await screenshot('architecture-desktop');
    }
  }
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  console.log('Responsive layouts 1440/768/390/320 verified; no browser exceptions.');
  await send('Browser.close');
})().catch(error => {console.error(error);process.exitCode=1;}).finally(() => {ws?.close();child.kill();});

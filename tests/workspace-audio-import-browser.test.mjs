import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromeBinary = ['google-chrome','chromium','chromium-browser'].find(x => spawnSync('which',[x],{encoding:'utf8'}).status === 0);

const html = [
 '<!doctype html><html lang="en"><body>',
 '<section id="ashwood-drop"><div class="ashwood-drop__grid"></div>',
 '<form id="ashwood-drop-form"><input name="title"><input name="sourceUrl">',
 '<input name="publishToMusic" type="checkbox"></form></section>',
 '<script>window.__staged=[]; document.querySelector("#ashwood-drop").addEventListener("ashwood:prepared-audio",',
 'e=>window.__staged.push({name:e.detail.file.name,type:e.detail.file.type}));</script>',
 '<script defer src="/workspace/audio-import-studio.js"></script></body></html>'
].join('');

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl), waiting = new Map();
  let id = 0;
  ws.addEventListener('message', e => {
    const msg=JSON.parse(e.data), slot=waiting.get(msg.id);
    if (!slot) return;
    waiting.delete(msg.id);
    if(msg.error) slot.reject(new Error(msg.error.message)); else slot.resolve(msg.result);
  });
  return { ws, opened:new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});}),
    send(method,params={}) { const next=++id;return new Promise((resolve,reject)=>{waiting.set(next,{resolve,reject});ws.send(JSON.stringify({id:next,method,params}));}); }
  };
}

test('Chromium converts WAV to MP3, rejects disallowed pages and stages without publishing', {timeout:45000,skip:!chromeBinary}, async () => {
  const root = new URL('../',import.meta.url);
  const server=createServer((req,res)=>{
    if(req.url==='/') {res.setHeader('content-type','text/html');res.end(html);return;}
    const paths={'/workspace/audio-import-studio.js':'workspace/audio-import-studio.js','/workspace/vendor/lame.min.js':'workspace/vendor/lame.min.js'};
    if(!paths[req.url]) {res.statusCode=404;res.end('Not found');return;}
    res.setHeader('content-type','application/javascript');res.end(readFileSync(new URL(paths[req.url],root)));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port, dir=mkdtempSync(join(tmpdir(),'ashwood-chrome-'));
  const chrome=spawn(chromeBinary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
  let conn;
  try {
    let dbgPort=0;
    for(let n=0;n<100;n++){
      try {dbgPort=Number(readFileSync(join(dir,'DevToolsActivePort'),'utf8').split('\n')[0]);break;}
      catch {await new Promise(resolve=>setTimeout(resolve,80));}
    }
    assert.ok(dbgPort>0,'Browser debugging port unavailable');
    const pages=await fetch('http://127.0.0.1:'+dbgPort+'/json/list').then(r=>r.json());
    const page=pages.find(p=>p.type==='page');assert.ok(page);
    conn=cdp(page.webSocketDebuggerUrl);await conn.opened;
    await conn.send('Page.enable');await conn.send('Runtime.enable');
    await conn.send('Page.navigate',{url:'http://127.0.0.1:'+port+'/'});
    const evalJs=async expression=>{
      const r=await conn.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
      if(r.exceptionDetails) throw new Error(r.result?.description || r.exceptionDetails.text);
      return r.result?.value;
    };
    for(let n=0;n<60;n++) {if(await evalJs('!!document.querySelector("#audio-import-convert")'))break;await new Promise(resolve=>setTimeout(resolve,80));}
    assert.equal(await evalJs('!!document.querySelector("#audio-import-convert")'),true,'UI not mounted');
    await evalJs('document.querySelector("#audio-import-convert").click()');
    assert.match(await evalJs('document.querySelector("#audio-import-status").textContent'),/Confirm processing permission/);
    const result=await evalJs([
      '(async()=>{',
      'const samples=6615,rate=44100,bytes=new ArrayBuffer(44+samples*2),v=new DataView(bytes);',
      'const ascii=(i,s)=>{for(let j=0;j<s.length;j++)v.setUint8(i+j,s.charCodeAt(j));};',
      'ascii(0,"RIFF");v.setUint32(4,bytes.byteLength-8,true);ascii(8,"WAVE");ascii(12,"fmt ");',
      'v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);',
      'v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);',
      'ascii(36,"data");v.setUint32(40,samples*2,true);',
      'for(let i=0;i<samples;i++)v.setInt16(44+2*i,Math.round(Math.sin(2*Math.PI*440*i/rate)*12000),true);',
      'const dt=new DataTransfer();dt.items.add(new File([bytes],"demo.wav",{type:"audio/wav"}));',
      'document.querySelector("#audio-import-file").files=dt.files;',
      'document.querySelector("#audio-import-rights").checked=true;',
      'document.querySelector("#audio-import-convert").click();',
      'for(let n=0;n<150;n++){if(!document.querySelector("#audio-import-result").hidden)break;',
      'const msg=document.querySelector("#audio-import-status").textContent;',
      'if(msg.includes("failed")||msg.includes("unavailable")||msg.includes("could not"))break;',
      'await new Promise(r=>setTimeout(r,100));}',
      'const ready=!document.querySelector("#audio-import-result").hidden;',
      'const msg=document.querySelector("#audio-import-status").textContent;',
      'if(!ready)return {ready,msg};',
      'const src=document.querySelector("#audio-import-preview").src;',
      'const data=new Uint8Array(await (await fetch(src)).arrayBuffer());',
      'const mp3=(data[0]===73&&data[1]===68&&data[2]===51)||(data[0]===255&&(data[1]&224)===224);',
      'document.querySelector("#audio-import-stage").click();',
      'return {ready,msg,size:data.length,mp3,staged:window.__staged};',
      '})()'
    ].join('\n'));
    assert.equal(result.ready,true,JSON.stringify(result));
    assert.ok(result.size>100,JSON.stringify(result));assert.equal(result.mp3,true);
    assert.deepEqual(result.staged,[{name:'demo.mp3',type:'audio/mpeg'}]);
    const reject=await evalJs([
      '(async()=>{',
      'document.querySelector("#audio-import-file").value="";',
      'document.querySelector("#audio-import-url").value="https://www.youtube.com/watch?v=abc123";',
      'document.querySelector("#audio-import-convert").click();',
      'for(let n=0;n<20;n++){const msg=document.querySelector("#audio-import-status").textContent;',
      'if(msg.includes("YouTube pages"))return msg;await new Promise(r=>setTimeout(r,100));}',
      'return document.querySelector("#audio-import-status").textContent;})()'
    ].join('\n'));
    assert.match(reject,/YouTube pages cannot be converted/);
  }finally{
    conn?.ws.close();
    chrome.kill('SIGTERM');
    if (chrome.exitCode === null) await new Promise(resolve => { chrome.once('exit', resolve); setTimeout(resolve, 2500).unref(); });
    await new Promise(resolve=>server.close(resolve));
    rmSync(dir,{recursive:true,force:true,maxRetries:12,retryDelay:150});
  }
});

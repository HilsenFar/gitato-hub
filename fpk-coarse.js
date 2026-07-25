const http=require('http'),fs=require('fs');const PORT=9342;
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>res(JSON.parse(b)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs;for(let i=0;i<40;i++){try{tabs=await get('/json/list');break}catch(e){await sleep(300)}}
  const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  let id=0;const pend=new Map();
  ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id&&pend.has(m.id)){const{res,rej}=pend.get(m.id);pend.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}});
  await new Promise(r=>ws.addEventListener('open',r));
  const send=(m,p={})=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:p}))});
  const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)return{ERR:r.exceptionDetails.text};return r.result.value};
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:375,height:760,deviceScaleFactor:2,mobile:true});
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  await send('Emulation.setEmitTouchEventsForMouse',{enabled:true,configuration:'mobile'});
  await send('Page.navigate',{url:'http://localhost:8493/index.html'});await sleep(2600);
  console.log(JSON.stringify({
    coarse: await ev(`matchMedia('(pointer: coarse)').matches`),
    hintDisplay: await ev(`getComputedStyle(document.querySelector('.pilot-hint')).display`),
    hintIcons: await ev(`[...document.querySelectorAll('.pilot-hint .gi')].map(s=>{const r=s.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)})`),
    hintText: await ev(`document.querySelector('.pilot-hint').innerText.trim()`),
    tableScrolls: await ev(`(()=>{const w=document.querySelector('.pilot-wrap');return w.scrollWidth>w.clientWidth})()`),
    docOverflow: await ev(`document.documentElement.scrollWidth+'/'+document.documentElement.clientWidth`)
  },null,1));
  ws.close();process.exit(0);
})().catch(e=>{console.error('FAIL',e);process.exit(1)});

const { chromium } = require('playwright');
const SHOTS='../screenshots/';
exports.SHOTS=SHOTS;
exports.start=async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1100,height:800}});const p=await c.newPage();
 p.api=[];p.on('response',async r=>{if(r.url().includes('/api/')&&r.request().method()!=='OPTIONS'){let t='';try{t=(await r.text()).slice(0,300)}catch{} p.api.push(`${r.request().method()} ${r.url().replace('http://127.0.0.1:3000','')} -> ${r.status()} ${t}`)}});
 return {b,c,p}};
exports.body=async(p)=>(await p.innerText('body',{timeout:3000}).catch(()=>'')).replace(/\s+/g,' ').trim();
exports.shot=async(p,n)=>p.screenshot({path:SHOTS+n+'.png'});
exports.log=(...a)=>console.log(...a);

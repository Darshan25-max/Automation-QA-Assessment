const L=require('./lib');const H='http://127.0.0.1:3000/#';const API='http://127.0.0.1:3000/api';
const S=s=>console.log('\n### '+s),note=(...a)=>console.log('  ',...a);
async function apiJ(method,path,body,token){const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Token '+token}:{})},body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{}return {status:r.status,j}}
const login=async(e,pw)=>(await apiJ('POST','/users/login',{user:{email:e,password:pw}})).status;
(async()=>{const {b,p}=await L.start();
 const ui=async(path)=>{await p.goto(H+path);await p.waitForTimeout(700)};
 S('R4 BUG: saving Settings (bio only) overwrites password');
 await ui('/register');await p.fill('input[name=username]','carol');await p.fill('input[name=email]','carol@example.com');await p.fill('input[name=password]','Passw0rd!');await p.click('main form button');await p.waitForTimeout(900);
 note('before: login with Passw0rd! ->',await login('carol@example.com','Passw0rd!'),'| login with empty password ->',await login('carol@example.com',''));
 await ui('/settings');await p.fill('textarea[name=bio]','just updating my bio');await L.shot(p,'29_settings_bio_only');p.api.length=0;await p.click('main form button');await p.waitForTimeout(900);
 note('Settings save: ',p.api.map(x=>x.slice(0,80)));await L.shot(p,'30_settings_saved_bio_only');
 note('after:  login with Passw0rd! ->',await login('carol@example.com','Passw0rd!'),'| login with EMPTY password ->',await login('carol@example.com',''));
 const reqBody=await (async()=>{return null})();
 S('R3b change email -> session breaks');
 await ui('/register');await p.fill('input[name=username]','dave');await p.fill('input[name=email]','dave@example.com');await p.fill('input[name=password]','Passw0rd!');await p.click('main form button');await p.waitForTimeout(900);
 await ui('/settings');await p.fill('input[name=email]','dave.new@example.com');p.api.length=0;await p.click('main form button');await p.waitForTimeout(900);
 note('save #1 (email change): ',p.api.map(x=>x.slice(0,90)));
 await p.fill('textarea[name=bio]','second change');p.api.length=0;await p.click('main form button');await p.waitForTimeout(900);
 note('save #2 (bio) right after: ',p.api.map(x=>x.slice(0,110)));await L.shot(p,'27_settings_after_email_change');
 await ui('/editor');await p.fill('input[name=title]','after email change');await p.fill('input[name=description]','d');await p.fill('textarea[name=body]','b');p.api.length=0;await p.click('main form button');await p.waitForTimeout(900);
 note('publish article: url',p.url().replace(H,'#'),'api',p.api.map(x=>x.slice(0,110)));await L.shot(p,'28_publish_after_email_change');
 await p.reload();await p.waitForTimeout(900);note('after page reload, nav:',(await p.innerText('nav')).replace(/\s+/g,' '));
 S('R3c username change to an existing username');
 await apiJ('POST','/users',{user:{username:'erin',email:'erin@example.com',password:'Passw0rd!'}});
 const t=(await apiJ('POST','/users/login',{user:{email:'dave.new@example.com',password:''}})).j?.user?.token; // pw was blanked by R4 bug
 const r=await apiJ('PUT','/user',{user:{username:'erin',password:'Passw0rd!'}},t);note('PUT username=erin ->',r.status,JSON.stringify(r.j).slice(0,100));
 await b.close();
})().catch(e=>{console.log('SCRIPT ERROR',e.message);process.exit(1)});

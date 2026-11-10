const L=require('./lib'); const H='http://127.0.0.1:3000/#'; const API='http://127.0.0.1:3000/api';
let p,b; const dialogs=[];
const S=(s)=>console.log('\n### '+s);
const note=(...a)=>console.log('  ',...a);
async function reg(name,email,pw){ await p.goto(H+'/register'); await p.waitForSelector('input[name=username]'); p.api.length=0;
  await p.fill('input[name=username]',name);await p.fill('input[name=email]',email);await p.fill('input[name=password]',pw);await p.click('main form button');await p.waitForTimeout(1000);}
async function clearSession(){await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.goto(H+'/');await p.reload();await p.waitForTimeout(500);}
async function api(method,path,body,token){const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Token '+token}:{})},body:body?JSON.stringify(body):undefined});let t=await r.text();return `${r.status} ${t.slice(0,220)}`}
async function apiJ(method,path,body,token){const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Token '+token}:{})},body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{} return {status:r.status,j}}
async function fillArticle(t,d,bd,tags){await p.goto(H+'/editor');await p.waitForSelector('input[name=title]');await p.fill('input[name=title]',t);await p.fill('input[name=description]',d);await p.fill('textarea[name=body]',bd);if(tags!==undefined&&tags!==null){await p.click('input[name=tags]');await p.keyboard.type(tags)}}
async function publish(){p.api.length=0;await p.click('main form button');await p.waitForTimeout(1200)}
(async()=>{
 ({b,p}=await L.start());
 p.on('dialog',async d=>{dialogs.push(d.type()+':'+d.message());await d.accept()});
 const tokenOf=async()=>p.evaluate(()=>{for(const k of Object.keys(localStorage)){try{const v=JSON.parse(localStorage[k]);if(v&&v.token)return v.token}catch{ if(/eyJ/.test(localStorage[k])) return localStorage[k]}}return null});

 S('AUTH-01 valid signup'); await reg('qa_alice','alice@example.com','Passw0rd!'); note('url',p.url().replace(H,'#'),'| nav:',(await p.innerText('nav')).replace(/\s+/g,' ')); await L.shot(p,'01_signup_success');
 const tokA=await tokenOf(); note('token stored?',!!tokA, 'localStorage keys:',await p.evaluate(()=>Object.keys(localStorage)));
 S('AUTH-02 session persists on reload'); await p.reload();await p.waitForTimeout(800); note('nav:',(await p.innerText('nav')).replace(/\s+/g,' '));
 S('AUTH-03 logout'); await p.click('.dropdown-toggle'); await L.shot(p,'02_user_menu'); await p.click('text=Logout'); await p.waitForTimeout(800);
 note('url',p.url().replace(H,'#'),'| nav:',(await p.innerText('nav')).replace(/\s+/g,' '),'| token after logout:',await tokenOf(),'| keys:',await p.evaluate(()=>Object.keys(localStorage))); await L.shot(p,'03_after_logout');
 await p.goBack(); await p.waitForTimeout(600); note('after browser Back: url',p.url().replace(H,'#'),'nav:',(await p.innerText('nav')).replace(/\s+/g,' '));
 await p.goto(H+'/editor');await p.waitForTimeout(600);note('/editor when logged out ->',p.url().replace(H,'#'));
 await p.goto(H+'/settings');await p.waitForTimeout(600);note('/settings when logged out ->',p.url().replace(H,'#'));
 S('AUTH-04 login valid'); await p.goto(H+'/login');await p.fill('input[name=email]','alice@example.com');await p.fill('input[name=password]','Passw0rd!');await p.click('main form button');await p.waitForTimeout(1000);note('url',p.url().replace(H,'#'),'nav:',(await p.innerText('nav')).replace(/\s+/g,' '));
 await clearSession();
 await L.shot(p,'03b_logged_out_home'); S('AUTH-05 login wrong password'); p.api.length=0; await p.goto(H+'/login');await p.fill('input[name=email]','alice@example.com');await p.fill('input[name=password]','nope');await p.click('main form button');await p.waitForTimeout(900);await p.waitForTimeout(500); note('msg:',await L.body(p),'| api:',p.api.map(x=>x.slice(0,120))); await L.shot(p,'04_login_wrong_password');
 S('AUTH-06 login unknown email'); p.api.length=0; await p.fill('input[name=email]','ghost@example.com');await p.click('main form button');await p.waitForTimeout(900);note('msg:',await L.body(p),'| api:',p.api.slice(-1)); await L.shot(p,'05_login_unknown_email');
 S('AUTH-07 login empty (browser validation)'); await p.reload(); await p.click('main form button'); await p.waitForTimeout(400); note('url',p.url().replace(H,'#'),'api calls:',p.api.length, 'validationMessage(email):',await p.$eval('input[name=email]',e=>e.validationMessage));

 S('AUTH-08 signup duplicate email'); await reg('qa_dupmail','alice@example.com','Passw0rd!');note('msg:',await L.body(p),'api:',p.api.slice(-1)); await L.shot(p,'06_signup_duplicate_email');
 S('AUTH-09 signup duplicate USERNAME'); await reg('qa_alice','alice2@example.com','Passw0rd!');note('url',p.url().replace(H,'#'),'api:',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,120)));
 const t2=await tokenOf(); await L.shot(p,'07_signup_duplicate_username'); await clearSession();
 S('AUTH-10 signup 1-char password'); await reg('qa_weakpw','weak@example.com','1');note('url',p.url().replace(H,'#'),'api:',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,100))); await L.shot(p,'08_signup_one_char_password'); await clearSession();
 S('AUTH-11 signup 300-char username'); await reg('a'.repeat(300),'long@example.com','Passw0rd!');note('url',p.url().replace(H,'#'),'msg:',await L.body(p),'api:',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,150))); await L.shot(p,'09_signup_long_username');
 S('AUTH-12 signup whitespace-only username'); await reg('   ','space@example.com','Passw0rd!');note('url',p.url().replace(H,'#'),'api:',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,150))); await clearSession();
 S('AUTH-13 signup email differing only by case'); await reg('qa_case','ALICE@EXAMPLE.COM','Passw0rd!');note('url',p.url().replace(H,'#'),'api:',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,150))); await clearSession();

 // login as alice for article tests
 await p.goto(H+'/login');await p.fill('input[name=email]','alice@example.com');await p.fill('input[name=password]','Passw0rd!');await p.click('main form button');await p.waitForTimeout(1000);
 const tok=await tokenOf();
 S('ART-01 create valid article w/ tags'); await fillArticle('First QA Article','About QA','Hello **world**','react qa');
 note('tag field shows:',JSON.stringify(await p.inputValue('input[name=tags]'))); await L.shot(p,'10_editor_filled'); await publish();
 note('url',p.url().replace(H,'#'),'| page:',(await L.body(p)).slice(0,200)); await L.shot(p,'11_article_created'); const slug1=p.url().split('/article/')[1];
 S('ART-02 whitespace-only title/desc/body'); await fillArticle('   ','   ','   ','');await publish();note('url',p.url().replace(H,'#'),'api:',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,200)));await L.shot(p,'12_article_whitespace_only');
 S('ART-03 XSS payloads in title/desc/body/tags'); dialogs.length=0;
 await fillArticle('<img src=x onerror=alert("xss-title")>','<b>desc</b>','<script>alert("xss-body-script")</script>\n\n<img src=x onerror=alert("xss-body-img")>\n\n[click](javascript:alert("xss-link"))','');await publish();
 await p.waitForTimeout(800); note('url',p.url().replace(H,'#'),'| dialogs fired:',JSON.stringify(dialogs)); await L.shot(p,'13_article_xss_payload');
 const html=await p.innerHTML('main'); note('rendered contains raw <img onerror>?',/<img[^>]+onerror/i.test(html),'| javascript: href present?',/href="javascript:/i.test(html));
 const xssSlug=p.url().split('/article/')[1];
 S('ART-04 duplicate title'); await fillArticle('First QA Article','dup','dup body','');await publish();note('url',p.url().replace(H,'#'),'api:',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,200)));await L.shot(p,'14_article_duplicate_title');
 S('ART-05 very long title (300 chars) and long body'); await fillArticle('T'.repeat(300),'d','b'.repeat(20000),'');await publish();note('url',p.url().replace(H,'#'),'api:',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,200)));await L.shot(p,'15_article_long_title');
 S('ART-06 special chars / emoji / unicode title'); await fillArticle('Café ñ 日本語 🚀 & <b>','d','b','');await publish();note('url',p.url().replace(H,'#'),'| heading:',await p.innerText('h1').catch(()=>'n/a'));await L.shot(p,'16_article_unicode');
 S('ART-07 tag edge cases'); await fillArticle('Tag edge','d','b','a,,b  a,');note('tag field:',JSON.stringify(await p.inputValue('input[name=tags]')));await publish();note('url',p.url().replace(H,'#'),'tags shown:',await p.$$eval('.tag-list li, .tag-list .tag-default',e=>e.map(x=>JSON.stringify(x.innerText))).catch(()=>'n/a'),'api:',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,260)));await L.shot(p,'17_article_tag_edge');

 S('EDIT-01 edit own article'); await p.goto(H+'/article/'+slug1);await p.waitForTimeout(800);
 await p.click('text=Edit Article'); await p.waitForTimeout(800); note('editor url',p.url().replace(H,'#'),'| prefilled title:',await p.inputValue('input[name=title]'),'| tags prefilled:',JSON.stringify(await p.inputValue('input[name=tags]')));
 await p.fill('input[name=title]','First QA Article EDITED');await p.fill('textarea[name=body]','Edited body');await L.shot(p,'18_edit_form'); await publish();
 note('GET after edit tagList:',(await api('GET','/articles/first-qa-article-edited')).slice(0,400));note('after edit url',p.url().replace(H,'#'),'| h1:',await p.innerText('h1').catch(()=>'n/a'),'| api:',p.api.filter(x=>x.startsWith('PUT')).map(x=>x.slice(0,200)));await L.shot(p,'19_article_edited');
 const slugAfterEdit=p.url().split('/article/')[1]; note('slug before/after edit:',slug1,'->',slugAfterEdit);
 note('old slug URL now:'); await p.goto(H+'/article/'+slug1);await p.waitForTimeout(900);note((await L.body(p)).slice(0,150));
 S('EDIT-02 edit with empty title (browser validation)'); await p.goto(H+'/article/'+slugAfterEdit);await p.waitForTimeout(600);await p.click('text=Edit Article');await p.waitForTimeout(600);await p.fill('input[name=title]','');await p.click('main form button');await p.waitForTimeout(500);note('validationMessage:',await p.$eval('input[name=title]',e=>e.validationMessage));

 S('AUTHZ-01 second user edits/deletes alice article via API'); 
 const bob=await apiJ('POST','/users',{user:{username:'qa_bob',email:'bob@example.com',password:'Passw0rd!'}}); const tokB=bob.j?.user?.token; note('bob signup',bob.status);
 note('PUT as bob ->',await api('PUT','/articles/'+slugAfterEdit,{article:{title:'hacked by bob'}},tokB));
 note('DELETE as bob ->',await api('DELETE','/articles/'+slugAfterEdit,null,tokB));
 note('PUT no token ->',await api('PUT','/articles/'+slugAfterEdit,{article:{title:'x'}},null));
 note('DELETE no token ->',await api('DELETE','/articles/'+slugAfterEdit,null,null));
 note('GET article after those ->',await api('GET','/articles/'+slugAfterEdit));
 S('API-01 edge input'); 
 note('GET /articles/does-not-exist ->',await api('GET','/articles/does-not-exist'));
 note('GET /articles?limit=-1 ->',await api('GET','/articles?limit=-1'));
 note('GET /articles?limit=abc ->',await api('GET','/articles?limit=abc'));
 note('GET /articles?offset=-5 ->',await api('GET','/articles?offset=-5'));
 note('GET /articles?limit=100000 -> status/len',(await api('GET','/articles?limit=100000')).slice(0,60));
 note('invalid token GET /user ->',await api('GET','/user',null,'garbage'));
 note('POST /articles malformed json ->',await (async()=>{const r=await fetch(API+'/articles',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Token '+tok},body:'{bad json'});return r.status+' '+(await r.text()).slice(0,200)})());
 note('POST /articles missing body fields ->',await api('POST','/articles',{article:{title:'only title'}},tok));
 note('POST /articles empty tagList string items ->',await api('POST','/articles',{article:{title:'api empty tag',description:'d',body:'b',tagList:['','']}},tok));

 S('DEL-01 delete own article via UI'); await p.goto(H+'/article/'+slugAfterEdit);await p.waitForTimeout(700);await L.shot(p,'20_before_delete');dialogs.length=0;await p.click('text=Delete Article');await p.waitForTimeout(1200);
 note('dialogs:',dialogs,'| url',p.url().replace(H,'#'));await L.shot(p,'21_after_delete');
 await p.goto(H+'/article/'+slugAfterEdit);await p.waitForTimeout(900);note('visit deleted article ->',(await L.body(p)).slice(0,160));await L.shot(p,'22_deleted_article_url');
 note('API GET deleted ->',await api('GET','/articles/'+slugAfterEdit));
 note('API DELETE again ->',await api('DELETE','/articles/'+slugAfterEdit,null,tok));

 S('CMT-01 comments'); await p.goto(H+'/article/'+xssSlug);await p.waitForTimeout(800);
 const ta=await p.$('textarea'); note('comment box present',!!ta);
 if(ta){ await p.click('main form button'); await p.waitForTimeout(500); note('post empty comment: api',p.api.slice(-1), 'validationMessage',await ta.evaluate(e=>e.validationMessage));
   p.api.length=0; await ta.fill('   ');await p.click('main form button');await p.waitForTimeout(800);note('whitespace comment api:',p.api.slice(-2).map(x=>x.slice(0,200)));
   p.api.length=0; await ta.fill('<img src=x onerror=alert("xss-comment")> hi');await p.click('main form button');await p.waitForTimeout(900);note('xss comment api:',p.api.slice(-2).map(x=>x.slice(0,200)),'dialogs',dialogs);await L.shot(p,'23_comments');
   const cc=await p.$$('.card'); note('cards on page',cc.length);
 }
 S('SET-01 settings'); await p.goto(H+'/settings');await p.waitForTimeout(700);
 await p.fill('textarea[name=bio]','My bio');await p.click('main form button');await p.waitForTimeout(900);note('after save url',p.url().replace(H,'#'),'api:',p.api.filter(x=>/PUT/.test(x)).map(x=>x.slice(0,200)));await L.shot(p,'24_settings_saved');
 await p.goto(H+'/settings');await p.waitForTimeout(700);await p.fill('input[name=email]','bob@example.com');await p.click('main form button');await p.waitForTimeout(900);note('change email to existing (bob): url',p.url().replace(H,'#'),'msg:',(await L.body(p)).slice(0,160),'api:',p.api.filter(x=>/PUT/.test(x)).map(x=>x.slice(0,200)));await L.shot(p,'25_settings_dup_email');
 await p.goto(H+'/settings');await p.waitForTimeout(700);await p.fill('input[name=username]','qa_bob');await p.click('main form button');await p.waitForTimeout(900);note('change username to existing (bob): url',p.url().replace(H,'#'),'api:',p.api.filter(x=>/PUT/.test(x)).map(x=>x.slice(0,200)));
 await p.goto(H+'/settings');await p.waitForTimeout(700);note('fields now:',await p.inputValue('input[name=username]'),await p.inputValue('input[name=email]'),'| password field value:',JSON.stringify(await p.inputValue('input[name=password]')));
 S('SET-02 change password then login'); await p.fill('input[name=password]','NewPassw0rd!');await p.click('main form button');await p.waitForTimeout(900);note('api',p.api.filter(x=>/PUT/.test(x)).map(x=>x.slice(0,200)));
 const cur=await p.inputValue('input[name=email]'); await clearSession();
 note('login with NEW pw ->',await api('POST','/users/login',{user:{email:cur,password:'NewPassw0rd!'}}));
 note('login with OLD pw ->',await api('POST','/users/login',{user:{email:cur,password:'Passw0rd!'}}));
 await b.close();
})().catch(e=>{console.log('SCRIPT ERROR',e.message);process.exit(1)});

const L=require('./lib');const {execSync}=require('child_process');const H='http://127.0.0.1:3000/#';const API='http://127.0.0.1:3000/api';
const sql=q=>execSync(`psql -h 127.0.0.1 -p 5433 -U postgres conduit -At -c ${JSON.stringify(q)}`).toString().trim();
const S=s=>console.log('\n### '+s),note=(...a)=>console.log('  ',...a);
async function apiJ(method,path,body,token){const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Token '+token}:{})},body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{}return {status:r.status,j}}
(async()=>{const {b,p}=await L.start();
 const ui=async(path)=>{await p.goto(H+path);await p.waitForTimeout(700)};
 const reg=async(n,e,pw)=>{await ui('/register');await p.fill('input[name=username]',n);await p.fill('input[name=email]',e);await p.fill('input[name=password]',pw);await p.click('main form button');await p.waitForTimeout(900)};
 const logoutUI=async()=>{await p.click('.dropdown-toggle');await p.click('text=Logout');await p.waitForTimeout(500)};
 const loginUI=async(e,pw)=>{await ui('/login');await p.fill('input[name=email]',e);await p.fill('input[name=password]',pw);p.api.length=0;await p.click('main form button');await p.waitForTimeout(900)};

 S('R1 account created with short password cannot log in through the UI');
 await reg('shortpw','shortpw@example.com','abc'); note('signup url',p.url().replace(H,'#'),'api',p.api.filter(x=>x.startsWith('POST')).map(x=>x.slice(0,70)));
 await logoutUI(); await loginUI('shortpw@example.com','abc'); note('login attempt: url',p.url().replace(H,'#'),'| POST login sent?',p.api.some(x=>x.includes('/users/login')),'| browser msg:',await p.$eval('input[name=password]',e=>e.validationMessage)); await L.shot(p,'08b_short_password_cannot_login');
 note('API login with same creds ->',(await apiJ('POST','/users/login',{user:{email:'shortpw@example.com',password:'abc'}})).status);

 S('R2 login error messages reveal whether an email is registered');
 await reg('alice','alice@example.com','Passw0rd!'); await logoutUI();
 await loginUI('alice@example.com','WrongPass1'); note('registered email + wrong pw ->',await L.body(p).then(t=>t.match(/Need an account\? (.*) Login/)?.[1]),p.api.map(x=>x.slice(0,100)));await L.shot(p,'04_login_wrong_password');
 await loginUI('ghost@example.com','WrongPass1'); note('unregistered email ->',await L.body(p).then(t=>t.match(/Need an account\? (.*) Login/)?.[1]),p.api.map(x=>x.slice(0,100)));await L.shot(p,'05_login_unknown_email');

 S('R3 settings: duplicate email / username, stale token after email change');
 const bob=await apiJ('POST','/users',{user:{username:'bob',email:'bob@example.com',password:'Passw0rd!'}});
 await loginUI('alice@example.com','Passw0rd!');
 await ui('/settings'); await p.fill('input[name=email]','bob@example.com'); p.api.length=0; await p.click('main form button'); await p.waitForTimeout(900);
 note('change alice email -> bob@example.com: api',p.api.map(x=>x.slice(0,70)),'| page:',(await L.body(p)).match(/Your Settings.*/)?.[0].slice(0,60));await L.shot(p,'26_settings_email_taken_by_other_user');
 note('DB rows with bob@example.com:',sql(`select username,email from "Users" where email='bob@example.com' order by id`).replace(/\n/g,' ; '));
 note('login API as bob@example.com ->',(await apiJ('POST','/users/login',{user:{email:'bob@example.com',password:'Passw0rd!'}})).j?.user?.username,'(ambiguous: two accounts share the email)');
 // reset alice email
 sql(`update "Users" set email='alice@example.com' where username='alice'`);
 await logoutUI(); await loginUI('alice@example.com','Passw0rd!');
 await ui('/settings'); await p.fill('input[name=email]','alice.new@example.com'); p.api.length=0; await p.click('main form button'); await p.waitForTimeout(900);
 note('change email to a NEW unique address: api',p.api.map(x=>x.slice(0,90)));
 await p.fill('textarea[name=bio]','second change'); p.api.length=0; await p.click('main form button'); await p.waitForTimeout(900);
 note('second settings save right after: api',p.api.map(x=>x.slice(0,110)),'| page:',(await L.body(p)).match(/Your Settings.*/)?.[0].slice(0,80)); await L.shot(p,'27_settings_after_email_change');
 await ui('/editor'); await p.fill('input[name=title]','after email change');await p.fill('input[name=description]','d');await p.fill('textarea[name=body]','b'); p.api.length=0; await p.click('main form button'); await p.waitForTimeout(900);
 note('publish article after email change: url',p.url().replace(H,'#'),'api',p.api.map(x=>x.slice(0,110)));await L.shot(p,'28_publish_after_email_change');
 await ui('/settings'); await p.fill('input[name=username]','bob'); p.api.length=0; await p.click('main form button'); await p.waitForTimeout(900); note('change username to existing "bob": api',p.api.map(x=>x.slice(0,90)));
 await b.close();
})().catch(e=>{console.log('SCRIPT ERROR',e.message);process.exit(1)});

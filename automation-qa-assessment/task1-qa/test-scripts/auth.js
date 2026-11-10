const L=require('./lib');
(async()=>{
 const {b,p}=await L.start(); const H='http://127.0.0.1:3000/#';
 async function signup(name,email,pw,tag){
   await p.goto(H+'/register'); await p.waitForSelector('input[name=username]');
   p.api.length=0;
   await p.fill('input[name=username]',name); await p.fill('input[name=email]',email); await p.fill('input[name=password]',pw);
   await p.click('main form button'); await p.waitForTimeout(1200);
   console.log(`\n[${tag}] user=${JSON.stringify(name.slice(0,40))} email=${JSON.stringify(email)} pw.len=${pw.length}\n  url=${p.url().replace(H,'#')}\n  page: ${(await L.body(p)).slice(0,200)}\n  api: ${p.api.join(' | ').slice(0,400)}\n  validity: email.valid=${await p.$eval('input[name=email]',e=>e.validity.valid).catch(()=>'n/a')}`);
   await L.shot(p,tag);
 }
 async function logout(){ await p.evaluate(()=>localStorage.clear()); await p.context().clearCookies(); await p.goto(H+'/'); await p.reload(); }
 async function login(email,pw,tag){
   await p.goto(H+'/login'); await p.waitForSelector('input[name=email]'); p.api.length=0;
   await p.fill('input[name=email]',email); await p.fill('input[name=password]',pw); await p.click('main form button'); await p.waitForTimeout(1200);
   console.log(`\n[${tag}] email=${JSON.stringify(email)} pw=${JSON.stringify(pw)}\n  url=${p.url().replace(H,'#')}\n  page: ${(await L.body(p)).slice(0,200)}\n  api: ${p.api.join(' | ').slice(0,400)}`);
   await L.shot(p,tag);
 }
 await signup('','','','A01_signup_empty');
 await signup('qa_user1','abc','password123','A02_signup_email_abc');
 await signup('qa_user1','a@b','password123','A03_signup_email_a_at_b');
 await signup('qa_user1','qa1@example.com','1','A04_signup_pw_1char');
 await signup('qa_user1','qa1@example.com','password123','A05_signup_valid');
 await logout();
 await signup('qa_user1','other@example.com','password123','A06_signup_dup_username');
 await signup('qa_other','qa1@example.com','password123','A07_signup_dup_email');
 await signup('QA_USER1','upper@example.com','password123','A08_signup_username_case');
 await signup('qa_user1','QA1@EXAMPLE.COM','password123','A09_signup_email_case');
 await signup('a'.repeat(300),'long@example.com','password123','A10_signup_long_username');
 await signup('   ','space@example.com','password123','A11_signup_space_username');
 await signup('<script>alert(1)</script>','xss@example.com','password123','A12_signup_html_username');
 await login('qa1@example.com','password123','B01_login_valid');
 await logout();
 await login('qa1@example.com','wrongpass','B02_login_wrong_pw');
 await login('nobody@example.com','password123','B03_login_unknown_email');
 await login('','','B04_login_empty');
 await login('QA1@example.com','password123','B05_login_email_case');
 await b.close();
})();

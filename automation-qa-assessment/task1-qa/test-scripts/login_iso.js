const L=require('./lib');const H='http://127.0.0.1:3000/#';
(async()=>{const {b,p}=await L.start();
 p.on('pageerror',e=>console.log('PAGEERROR',e.message.slice(0,200)));
 async function attempt(tag,email,pw){p.api.length=0;await p.fill('input[name=email]',email);await p.fill('input[name=password]',pw);await p.click('main form button');await p.waitForTimeout(1000);
  console.log(tag,'| url',p.url().replace(H,'#'),'| api',p.api.map(x=>x.slice(0,110)),'| page:',(await L.body(p)).replace(/conduit Source code Home|An interactive.*/g,'').slice(0,120));}
 // fresh browser, clean state
 await p.goto(H+'/login');await p.waitForSelector('input[name=email]');
 await attempt('wrong pw #1','alice@example.com','nope');
 await attempt('wrong pw #2 (same page)','alice@example.com','nope2');
 await attempt('unknown email','ghost@example.com','x');
 await L.shot(p,'04_login_wrong_password');
 await b.close()})();

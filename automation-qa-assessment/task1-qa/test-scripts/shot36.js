const L=require('./lib');const H='http://127.0.0.1:3000/#';
(async()=>{const {b,p}=await L.start();
 await p.goto(H+'/register');await p.fill('input[name=username]','ivy');await p.fill('input[name=email]','ivy@example.com');await p.fill('input[name=password]','Passw0rd!');await p.click('main form button');await p.waitForTimeout(900);
 const mk=async(t)=>{await p.goto(H+'/editor');await p.fill('input[name=title]',t);await p.fill('input[name=description]','d');await p.fill('textarea[name=body]','b');await p.click('main form button');await p.waitForTimeout(1000);console.log(JSON.stringify(t),'-> url',decodeURIComponent(p.url().replace(H,'#')),'| msg:',(await L.body(p)).match(/Title already exists[^P]*/)?.[0]||'')};
 await mk('東京ニュース');await L.shot(p,'36a_japanese_title_slug_dashes');await mk('大阪グルメ記');await L.shot(p,'36_unicode_title_collision');
 await b.close()})();

const L=require('./lib');const H='http://127.0.0.1:3000/#';
(async()=>{const {b,p}=await L.start();
 await p.goto(H+'/register');await p.fill('input[name=username]','henry');await p.fill('input[name=email]','henry@example.com');await p.fill('input[name=password]','Passw0rd!');await p.click('main form button');await p.waitForTimeout(900);
 await p.goto(H+'/editor');await p.fill('input[name=title]','   ');await p.fill('input[name=description]','   ');await p.fill('textarea[name=body]','   ');await L.shot(p,'12a_whitespace_only_form');p.api.length=0;await p.click('main form button');await p.waitForTimeout(1200);
 console.log('url',p.url().replace(H,'#'),p.api.map(x=>x.slice(0,120)));console.log((await L.body(p)).slice(0,200));await L.shot(p,'12_article_whitespace_only');
 await p.goto(H+'/');await p.click('text=Global Feed');await p.waitForTimeout(900);await L.shot(p,'35_home_feed_blank_article');
 console.log(await L.body(p).then(t=>t.slice(0,250)));
 console.log('links',JSON.stringify(await p.$$eval('main a',e=>e.map(x=>x.getAttribute('href')))));
 // can the user open/edit/delete it from UI? try clicking the preview
 const prev=await p.$('.article-preview');if(prev){const box=await prev.boundingBox();console.log('preview box',!!box)}
 await b.close()})();

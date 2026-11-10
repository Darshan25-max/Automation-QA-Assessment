const L=require('./lib');const H='http://127.0.0.1:3000/#';const API='http://127.0.0.1:3000/api';
const S=s=>console.log('\n### '+s),note=(...a)=>console.log('  ',...a);
async function apiJ(method,path,body,token){const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Token '+token}:{})},body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{}return {status:r.status,j}}
(async()=>{const {b,p}=await L.start();p.on('dialog',d=>d.accept());
 const ui=async(path)=>{await p.goto(H+path);await p.waitForTimeout(800)};
 await ui('/register');await p.fill('input[name=username]','frank');await p.fill('input[name=email]','frank@example.com');await p.fill('input[name=password]','Passw0rd!');await p.click('main form button');await p.waitForTimeout(900);
 const tok=(await apiJ('POST','/users/login',{user:{email:'frank@example.com',password:'Passw0rd!'}})).j.user.token;
 const create=async(t,d,bd,tags)=>{await ui('/editor');await p.fill('input[name=title]',t);await p.fill('input[name=description]',d);await p.fill('textarea[name=body]',bd);if(tags){await p.click('input[name=tags]');await p.keyboard.type(tags)}p.api.length=0;await p.click('main form button');await p.waitForTimeout(1000)};

 S('T1 tags dropped when editing an article');
 await create('Tags test','d','body','react qa testing');
 const slug=p.url().split('/article/')[1];
 note('created. tagList on server:',JSON.stringify((await apiJ('GET','/articles/'+slug)).j.article.tagList)); await L.shot(p,'31_article_with_3_tags');
 await ui('/editor/'+slug); note('editor tag field when editing:',JSON.stringify(await p.inputValue('input[name=tags]')));await L.shot(p,'32_edit_form_tags_prefill');
 await p.fill('textarea[name=body]','edited body only');p.api.length=0;await p.click('main form button');await p.waitForTimeout(1000);
 note('after saving edit, tagList on server:',JSON.stringify((await apiJ('GET','/articles/'+slug)).j.article.tagList)); await L.shot(p,'33_article_after_edit_tags');

 S('T2 empty-string tags');
 await create('Empty tags','d','b','a,,b');
 const s2=p.url().split('/article/')[1]; note('url',p.url().replace(H,'#'),'tagList:',JSON.stringify((await apiJ('GET','/articles/'+s2)).j.article.tagList));
 await ui('/'); note('popular tags on home:',JSON.stringify(await p.$$eval('.sidebar a, .tag-list a, .tag-pill',e=>e.map(x=>x.innerText))));await L.shot(p,'34_popular_tags_empty_tag');
 note('GET /tags ->',JSON.stringify((await apiJ('GET','/tags')).j));

 S('T3 whitespace-only title/desc/body creates article with empty slug');
 await create('   ','   ','   ','');note('url after publish',p.url().replace(H,'#'),'| api',p.api.map(x=>x.slice(0,110)));await L.shot(p,'12_article_whitespace_only');
 const list=(await apiJ('GET','/articles')).j.articles.map(a=>JSON.stringify(a.slug)+' / '+JSON.stringify(a.title)); note('articles in feed:',list.join(' | '));
 await ui('/'); await L.shot(p,'35_home_feed_blank_article');
 note('API GET /articles/ (empty slug) ->',(await apiJ('GET','/articles/')).status,'| PUT ->',(await apiJ('PUT','/articles/',{article:{title:'x'}},tok)).status,'| DELETE ->',(await apiJ('DELETE','/articles/',null,tok)).status);
 const link=await p.$$eval('a[href*="/article/"]',e=>e.map(x=>x.getAttribute('href'))); note('feed links:',JSON.stringify(link));

 S('T4 non-ASCII titles produce colliding / meaningless slugs');
 await create('日本語','d','b','');note('title 日本語 -> url',p.url().replace(H,'#'),'| api',p.api.map(x=>x.slice(0,90)));
 await create('中文标题','d','b','');note('title 中文标题 -> url',p.url().replace(H,'#'),'| api',p.api.map(x=>x.slice(0,110)));await L.shot(p,'36_unicode_title_collision');
 await create('Español: ¿Qué tal?','d','b','');note('title "Español: ¿Qué tal?" -> url',p.url().replace(H,'#'));

 S('T5 duplicate title error is shown in UI?');
 await create('Tags test','d2','b2','');note('url',p.url().replace(H,'#'),'| visible message:',(await L.body(p)).match(/Publish Article|Title already.*/)?.[0]);await L.shot(p,'14_article_duplicate_title');

 S('T6 article title length');
 await create('T'.repeat(300),'d','b','');note('url',p.url().replace(H,'#'),'| api',p.api.map(x=>x.slice(0,110)),'| visible:',(await L.body(p)).match(/value too long.*?\)/)?.[0]);await L.shot(p,'15_article_long_title');
 await b.close();
})().catch(e=>{console.log('SCRIPT ERROR',e.message);process.exit(1)});

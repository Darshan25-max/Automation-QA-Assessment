const L=require('./lib');const H='http://127.0.0.1:3000/#';const API='http://127.0.0.1:3000/api';
const note=(...a)=>console.log('  ',...a),S=s=>console.log('\n### '+s);
async function apiJ(method,path,body,token){const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Token '+token}:{})},body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{}return {status:r.status,j}}
(async()=>{
 const tf=(await apiJ('POST','/users/login',{user:{email:'frank@example.com',password:'Passw0rd!'}})).j.user.token;
 const g=(await apiJ('POST','/users',{user:{username:'grace',email:'grace@example.com',password:'Passw0rd!'}})).j.user.token;
 S('CJK slug collision'); 
 const a=await apiJ('POST','/articles',{article:{title:'東京ニュース',description:'d',body:'b',tagList:[]}},tf);note('title 東京ニュース ->',a.status,a.j.article?.slug);
 const c=await apiJ('POST','/articles',{article:{title:'大阪グルメ記',description:'d',body:'b',tagList:[]}},tf);note('title 大阪グルメ記 (different title, same length) ->',c.status,c.j.article?.slug||JSON.stringify(c.j));
 S('Comment authorization');
 const cm=await apiJ('POST','/articles/tags-test/comments',{comment:{body:'frank comment'}},tf);note('frank comments ->',cm.status);const cid=cm.j.comment?.id;
 note('grace deletes frank comment ->',(await apiJ('DELETE','/articles/tags-test/comments/'+cid,null,g)).status);
 note('comment still present?',JSON.stringify((await apiJ('GET','/articles/tags-test/comments')).j.comments.map(x=>x.id)));
 note('empty comment body via API ->',(await apiJ('POST','/articles/tags-test/comments',{comment:{body:''}},tf)).status);
 note('comment on non-existent article ->',(await apiJ('POST','/articles/nope/comments',{comment:{body:'x'}},tf)).status,JSON.stringify((await apiJ('POST','/articles/nope/comments',{comment:{body:'x'}},tf)).j));
 S('Favorite / follow');
 note('favorite twice ->',(await apiJ('POST','/articles/tags-test/favorite',null,g)).status,(await apiJ('POST','/articles/tags-test/favorite',null,g)).status,'count:',(await apiJ('GET','/articles/tags-test',null,g)).j.article.favoritesCount);
 note('follow self ->',(await apiJ('POST','/profiles/grace/follow',null,g)).status,JSON.stringify((await apiJ('POST','/profiles/grace/follow',null,g)).j).slice(0,100));
 note('follow nonexistent ->',(await apiJ('POST','/profiles/nobody/follow',null,g)).status);
 note('GET profile nonexistent ->',(await apiJ('GET','/profiles/nobody')).status);
 S('Pagination');
 const r=await apiJ('GET','/articles?limit=2&offset=1');note('limit=2 offset=1 ->',r.status,r.j.articles.length,'count',r.j.articlesCount);
 const {b,p}=await L.start();
 await p.goto(H+'/profile/nobody');await p.waitForTimeout(900);note('UI profile/nobody:',(await L.body(p)).slice(0,120));await L.shot(p,'37_profile_nonexistent_user');
 await p.goto(H+'/article/does-not-exist');await p.waitForTimeout(900);note('UI article/does-not-exist:',(await L.body(p)).slice(0,120));await L.shot(p,'38_404_page_no_navbar');
 await p.goto(H+'/nonexistent-route');await p.waitForTimeout(700);note('UI unknown route:',(await L.body(p)).slice(0,100));
 await b.close();
})();

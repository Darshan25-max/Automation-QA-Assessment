const { chromium } = require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const OUT='../screenshots/';const API='http://127.0.0.1:3001/api';
const run=(cmd)=>{let o;try{o=execSync(cmd,{shell:'/bin/bash',stdio:['ignore','pipe','pipe']}).toString()}catch(e){o=(e.stdout||'')+(e.stderr||'')}return o.trim()};
const J=(m,path,body,tok,extra='')=>`curl -s -w ' [HTTP %{http_code}]' -X ${m} ${API}${path} -H 'Content-Type: application/json' ${tok?`-H 'Authorization: Token ${tok}'`:''} ${body?`-d '${body}'`:''} ${extra}`;
const show=(c)=>c.replace(/Token eyJ[\w.\-]+/g,'Token <JWT>');
const trunc=s=>s.replace(/"token":"[^"]+"/g,'"token":"<JWT>"').slice(0,420);
const tokenOf=(o)=>{try{return JSON.parse(o.replace(/ \[HTTP \d+\]$/,'')).user.token}catch{return ''}};
async function panel(name,title,steps){let html=`<html><body style="margin:0;background:#1e1e1e;color:#ddd;font:13px/1.45 Consolas,Menlo,monospace;padding:18px;width:1000px"><div style="color:#9cdcfe;font-size:15px;margin-bottom:10px">${title}</div>`;
 for(const s of steps){html+=`<div style="color:#6a9955"># ${s.note}</div><div style="color:#dcdcaa;white-space:pre-wrap;word-break:break-all">$ ${show(s.cmd).replace(/</g,'&lt;')}</div><div style="white-space:pre-wrap;word-break:break-all;margin-bottom:10px;color:#ce9178">${trunc(s.out).replace(/</g,'&lt;')}</div>`}
 html+='</body></html>';fs.writeFileSync('/tmp/ev.html',html);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1040,height:400}});await p.goto('file:///tmp/ev.html');await p.screenshot({path:OUT+name+'.png',fullPage:true});await b.close()}
const step=(note,cmd)=>({note,cmd,out:run(cmd)});
(async()=>{
 const sfx=Date.now()%100000;
 // E1 password overwrite
 let s1=[]; const em=`ev${sfx}@example.com`;
 s1.push(step('1. Sign up a user (password: Passw0rd!)',J('POST','/users',`{"user":{"username":"ev${sfx}","email":"${em}","password":"Passw0rd!"}}`)));
 const t=tokenOf(s1[0].out.replace(/ \[HTTP \d+\]$/,'')+'')||tokenOf(s1[0].out);
 s1.push(step('2. Login with the real password -> works',J('POST','/users/login',`{"user":{"email":"${em}","password":"Passw0rd!"}}`)));
 s1.push(step('3. Login with an EMPTY password -> rejected (expected)',J('POST','/users/login',`{"user":{"email":"${em}","password":""}}`)));
 s1.push(step('4. Same request the Settings page sends when only the bio is changed (password field left blank)',J('PUT','/user',`{"user":{"bio":"only changing my bio","password":""}}`,t)));
 s1.push(step('5. Login with the REAL password again',J('POST','/users/login',`{"user":{"email":"${em}","password":"Passw0rd!"}}`)));
 s1.push(step('6. Login with an EMPTY password',J('POST','/users/login',`{"user":{"email":"${em}","password":""}}`)));
 await panel('40_evidence_password_overwrite','BUG-01  Saving Settings overwrites the password (live API calls)',s1);
 // E2 duplicates
 const s2=[]; 
 s2.push(step('Create user "dupname" (email 1)',J('POST','/users',`{"user":{"username":"dupname${sfx}","email":"d1_${sfx}@example.com","password":"Passw0rd!"}}`)));
 s2.push(step('Create a SECOND user with the same username',J('POST','/users',`{"user":{"username":"dupname${sfx}","email":"d2_${sfx}@example.com","password":"Passw0rd!"}}`)));
 s2.push(step('Same email, different letter case',J('POST','/users',`{"user":{"username":"dupcase${sfx}","email":"D1_${sfx}@EXAMPLE.COM","password":"Passw0rd!"}}`)));
 s2.push(step('DB check: rows for the username',`psql -h 127.0.0.1 -p 5433 -U postgres conduit -c "select id,username,email from \\"Users\\" where username='dupname${sfx}' or lower(email)='d1_${sfx}@example.com' order by id"`));
 await panel('41_evidence_duplicate_accounts','BUG-02/03  Duplicate usernames and case-variant emails accepted (live API calls)',s2);
 // E3 500s
 const s3=[]; const tk=tokenOf(run(J('POST','/users/login',`{"user":{"email":"${em}","password":""}}`)));
 s3.push(step('Garbage token',J('GET','/user','','garbage')));
 s3.push(step('Malformed JSON body',J('POST','/users/login','{bad json')));
 s3.push(step('limit=-1',`curl -s -w ' [HTTP %{http_code}]' '${API}/articles?limit=-1'`));
 s3.push(step('limit=abc',`curl -s -w ' [HTTP %{http_code}]' '${API}/articles?limit=abc'`));
 s3.push(step('300-char username',J('POST','/users',`{"user":{"username":"${'a'.repeat(300)}","email":"long${sfx}@example.com","password":"Passw0rd!"}}`)));
 await panel('42_evidence_http_500_errors','BUG-06/07  Client mistakes return HTTP 500 with internal error text (live API calls)',s3);
 // E4 tags
 const s4=[];
 s4.push(step('Create article with tags qa, js, react, ab',J('POST','/articles',`{"article":{"title":"tag test ${sfx}","description":"d","body":"b","tagList":["qa","js","react","ab"]}}`,tk)));
 s4.push(step('Fetch the same article',`curl -s -w ' [HTTP %{http_code}]' ${API}/articles/tag-test-${sfx}`));
 await panel('43_evidence_tags_dropped','BUG-08  Tags of 1-2 characters are silently dropped (live API calls)',s4);
})();

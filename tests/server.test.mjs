// Integration tests for real local HTTP routes with in-memory users and simulated Gemini replies.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {once} from 'node:events';
import {createBudgetronServer} from '../server/server.mjs';
import {createAuthStore,DEMO_USER} from '../server/auth.mjs';
import {OFF_TOPIC_REPLY} from '../server/chat-policy.mjs';
const root=new URL('../',import.meta.url);
// Page folder names mirror the visible navigation labels.
const pageFolders={"auth":"Sign In Page","home":"Home Page","goals":"Goals Page","income":"Income Page","expenses":"Expenses Page","spending-chart":"Pie Chart Page","transactions":"Transactions Page","calendar":"Calendar Page"};
async function setup(testContext,overrides={}){
  let received;const store=createAuthStore();
  const server=createBudgetronServer({authStore:store,loadSettings:async()=>({configured:true,key:'test-only',model:'gemini-test'}),generateReply:async input=>{received=input;return 'Mock budget response';},...overrides});
  server.listen(0,'127.0.0.1');await once(server,'listening');testContext.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
  const base=`http://127.0.0.1:${server.address().port}`;
  const login=await fetch(base+'/api/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(DEMO_USER)});
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const request=(path,options={})=>fetch(base+path,{...options,headers:{Cookie:cookie,...options.headers}});
  return {base,request,cookie,received:()=>received};
}
test('each authenticated page has its own assets and all links load',async testContext=>{
  const {request}=await setup(testContext);
  for(const page of ['home','goals','income','expenses','spending-chart','transactions','calendar','auth']){
    const path=`pages/${pageFolders[page]}/${page}.html`,response=await request('/'+path);assert.equal(response.status,200);
    const html=await response.text();assert.equal(html,await readFile(new URL(path,root),'utf8'));assert.ok(html.includes(`href="${page}.css"`));assert.ok(html.includes(`src="${page}.js"`));
    const scripts=[];for(const [,target]of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
      if(/^(https?:|data:)/.test(target))continue;const localURL=new URL(target,new URL(path,root));await access(fileURLToPath(localURL));
      const publicURL=new URL(target,'http://test/'+path),resource=await request(publicURL.pathname+publicURL.search);assert.equal(resource.status,200,target);
      if(target.endsWith('.js'))scripts.push(await resource.text());
    }new Script(scripts.join(String.fromCharCode(10)+';'+String.fromCharCode(10)),{filename:path});
  }
});
test('legacy page URLs redirect to the new pages and preserve query parameters',async testContext=>{
  const {request}=await setup(testContext);for(const [old,target]of [['accounts','income'],['goals','goals'],['pie','spending-chart'],['spending','transactions'],['calendar','calendar'],['index','home']]){
    const response=await request('/'+old+'.html?category=Food',{redirect:'manual'});assert.equal(response.status,302);assert.equal(response.headers.get('location'),`/pages/${pageFolders[target]}/${target}.html?category=Food`);
  }
});
test('private files and server source cannot be downloaded',async testContext=>{const {request}=await setup(testContext);for(const path of ['/.env','/.git/config','/server/auth.mjs','/server/server.mjs','/users.json','/tests/auth.test.mjs'])assert.equal((await request(path)).status,404,path);});
test('chat requires sign-in, and valid requests return the client reply contract',async testContext=>{
  const {base,request,received}=await setup(testContext),input={messages:[{role:'user',content:'How is my budget?'}],budget:{income:300000}};
  assert.equal((await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})).status,401);
  const response=await request('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});assert.equal(response.status,200);assert.match((await response.json()).reply,/Mock/);assert.deepEqual(received().messages,input.messages);assert.equal(received().budget.incomeTotal,3000);assert.equal(received().budget.income,undefined);
});
test('chat rejects malformed input and cross-site writes',async testContext=>{const {request}=await setup(testContext);const post=(body,origin)=>request('/api/chat',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body});assert.equal((await post('{')).status,400);assert.equal((await post(JSON.stringify({messages:[]}))).status,400);assert.equal((await post('{}','http://example.com')).status,403);});
test('local refusals skip Gemini and preserve all ten provider calls',async testContext=>{
  let providerCalls=0;const {request}=await setup(testContext,{generateReply:async()=>{providerCalls++;return 'Budget answer';}});
  const post=question=>request('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:question}]})});
  for(let index=0;index<12;index++){const response=await post('Give me a cake recipe');assert.equal(response.status,200);assert.equal((await response.json()).reply,OFF_TOPIC_REPLY);}assert.equal(providerCalls,0);
  for(let index=0;index<10;index++)assert.equal((await post('How is my budget?')).status,200);assert.equal(providerCalls,10);assert.equal((await post('How is my budget?')).status,429);
});
test('local refusals do not need a configured Gemini key',async testContext=>{const {request}=await setup(testContext,{loadSettings:async()=>({configured:false}),generateReply:async()=>{throw new Error('Provider called');}});const response=await request('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Tell me a joke'}]})});assert.equal(response.status,200);assert.equal((await response.json()).reply,OFF_TOPIC_REPLY);});
test('signup, budget saves, conflict rejection, isolation and sign-out work over HTTP',async testContext=>{
  const {base}=await setup(testContext);
  const signup=async email=>{const response=await fetch(base+'/api/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'New User',email,password:'Password123!'})});assert.equal(response.status,200);return response.headers.get('set-cookie').split(';')[0];};
  const cookie=await signup('new@example.com'),otherCookie=await signup('other@example.com');
  const session=await(await fetch(base+'/api/session',{headers:{Cookie:cookie}})).json();assert.equal(session.budget.events.length,0);assert.equal(session.user.password,undefined);
  session.budget.events.push({id:'new-pay',name:'Pay',amount:10000,date:'2026-10-30',kind:'income',category:'Salary'});
  const save=body=>fetch(base+'/api/budget',{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await save({budget:session.budget,revision:0,userId:'another-user'})).status,409);
  assert.equal((await save({budget:session.budget,revision:0,userId:session.user.id})).status,200);
  assert.equal((await save({budget:session.budget,revision:0,userId:session.user.id})).status,409);
  assert.equal((await(await fetch(base+'/api/budget',{headers:{Cookie:otherCookie}})).json()).budget.events.length,0);
  await fetch(base+'/api/signout',{method:'POST',headers:{Cookie:cookie}});assert.equal((await fetch(base+'/api/session',{headers:{Cookie:cookie}})).status,401);
  assert.equal((await fetch(base+'/pages/Home Page/home.html',{redirect:'manual'})).headers.get('location'),'/pages/Sign In Page/auth.html');
});


test('settings API persists partial updates and rejects anonymous, cross-site, wrong-user and malformed writes',async testContext=>{
  const {base,request}=await setup(testContext);const session=await(await request('/api/session')).json();
  assert.equal((await fetch(base+'/api/preferences')).status,401);
  const patch=(body,origin)=>request('/api/preferences',{method:'PATCH',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
  assert.equal((await patch({userId:'wrong-user',patch:{theme:'dark'}})).status,409);
  assert.equal((await patch({userId:session.user.id,patch:{theme:'dark'}},'http://other.example')).status,403);
  assert.equal((await patch({userId:session.user.id,patch:{theme:'invalid'}})).status,400);
  assert.equal((await patch({userId:session.user.id,patch:{theme:'dark',chat:{homeOnly:true}}})).status,200);
  assert.equal((await patch({userId:session.user.id,patch:{palette:'ocean',chat:{shareBudget:false}}})).status,200);
  const restored=await(await request('/api/session')).json();assert.equal(restored.preferences.theme,'dark');assert.equal(restored.preferences.palette,'ocean');assert.equal(restored.preferences.chat.homeOnly,true);assert.equal(restored.preferences.chat.shareBudget,false);assert.equal(restored.revision,session.revision);assert.deepEqual(restored.budget.events,session.budget.events);
});

// Former nested URLs remain valid after the folder rename, including sign-in.
test('previous nested page links redirect to their named folders',async testContext=>{
  const {request}=await setup(testContext);
  for(const [slug,folder] of Object.entries(pageFolders)){
    const response=await request('/pages/'+slug+'/'+slug+'.html?source=bookmark',{redirect:'manual'});
    assert.equal(response.status,302);assert.equal(response.headers.get('location'),'/pages/'+folder+'/'+slug+'.html?source=bookmark');
  }
});

test('every reorganized app page still requires sign-in',async testContext=>{
  const {base}=await setup(testContext);
  for(const [slug,folder] of Object.entries(pageFolders)){
    const response=await fetch(base+'/pages/'+folder+'/'+slug+'.html',{redirect:'manual'});
    assert.equal(response.status,slug==='auth'?200:302);
    if(slug!=='auth')assert.equal(response.headers.get('location'),'/pages/Sign In Page/auth.html');
  }
});

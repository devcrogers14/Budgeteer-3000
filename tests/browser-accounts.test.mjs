// Browser-only accounts are tested with disposable memory storage, never real browser profiles.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import BrowserAccounts from '../javascript files/browser-accounts.js';
import BudgetMath from '../javascript files/budget-core.js';
import BudgetPreferences from '../javascript files/preferences.js';
function memoryStorage(){const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key),data};}
function setup(){const storage=memoryStorage(),sessionStorage=memoryStorage();const options={storage,sessionStorage,budgetMath:BudgetMath,preferences:BudgetPreferences};return {...options,store:BrowserAccounts.createBrowserStore(options)};}
const post=(store,route,body)=>store.request(route,{method:'POST',body:JSON.stringify(body)});
const signup=(store,email='new@example.com')=>post(store,'/api/signup',{name:'New User',email,password:'Password123!'});
const read=async store=>(await store.request('/api/session')).json();
const save=(store,session,budget,revision=session.revision)=>store.request('/api/budget',{method:'PUT',body:JSON.stringify({userId:session.user.id,budget,revision})});
const patch=(store,session,value)=>store.request('/api/preferences',{method:'PATCH',body:JSON.stringify({userId:session.user.id,patch:value})});

test('browser demo sign-in seeds the presentation budget without storing raw passwords',async()=>{
 const {store,storage}=setup();assert.equal((await post(store,'/api/signin',{email:'demo@budgetron.local',password:'wrong'})).status,401);
 assert.equal((await post(store,'/api/signin',{email:'demo@budgetron.local',password:'BudgetronDemo3000!'})).status,200);
 const session=await read(store);assert.equal(BudgetMath.totalIncome(session.budget),300000);assert.equal(BudgetMath.totalExpenses(session.budget),149000);assert.equal(session.user.password,undefined);
 assert.equal([...storage.data.values()].join('').includes('BudgetronDemo3000!'),false);
});

test('browser signup normalizes email, validates credentials and keeps profiles separate',async()=>{
 const {store,storage}=setup();assert.equal((await signup(store,'invalid')).status,400);assert.equal((await signup(store,' FIRST@example.com ')).status,200);
 const first=await read(store);assert.equal(first.user.email,'first@example.com');assert.equal(first.budget.events.length,0);assert.equal((await signup(store,'first@example.com')).status,409);
 await signup(store,'second@example.com');const second=await read(store);assert.notEqual(first.user.id,second.user.id);assert.equal(second.budget.events.length,0);
 const users=JSON.parse([...storage.data.values()][0]).users;assert.notDeepEqual(users[0].password.salt,users[1].password.salt);assert.notDeepEqual(users[0].password.hash,users[1].password.hash);
});

test('browser budgets persist across store recreation and reject stale revisions or wrong users',async()=>{
 const context=setup();await signup(context.store);const session=await read(context.store),budget=BudgetMath.createBudget(true);
 assert.equal((await save(context.store,session,budget)).status,200);assert.equal((await save(context.store,session,budget)).status,409);
 assert.equal((await save(context.store,{...session,user:{id:'other'}},budget,1)).status,409);
 const restored=await read(BrowserAccounts.createBrowserStore(context));assert.deepEqual(restored.budget,budget);assert.equal(restored.revision,1);
});

test('browser preferences survive relogin, remain isolated and survive budget reset',async()=>{
 const {store}=setup();await signup(store);let session=await read(store);
 assert.equal((await patch(store,session,{theme:'dark',palette:'ocean',chat:{homeOnly:true,position:{x:0.2,y:0.7}},chatHistory:[{role:'user',content:'My budget?'}]})).status,200);
 await save(store,session,BudgetMath.createBudget(false));await store.request('/api/signout',{method:'POST'});await signup(store,'second@example.com');assert.equal((await read(store)).preferences.palette,'cream');
 await post(store,'/api/signin',{email:'new@example.com',password:'Password123!'});session=await read(store);assert.equal(session.preferences.theme,'dark');assert.equal(session.preferences.chat.homeOnly,true);assert.equal(session.preferences.chatHistory.length,1);assert.equal(session.budget.events.length,0);
 assert.equal((await patch(store,session,{theme:'invalid'})).status,400);
});

test('browser sign-out and expired sessions prevent access until sign-in',async()=>{
 const {store,sessionStorage}=setup();assert.equal((await store.request('/api/session')).status,401);await signup(store);await store.request('/api/signout',{method:'POST'});assert.equal((await store.request('/api/budget')).status,401);
 await post(store,'/api/signin',{email:'new@example.com',password:'Password123!'});const key=[...sessionStorage.data.keys()][0];sessionStorage.setItem(key,JSON.stringify({id:(await read(store)).user.id,expires:0}));assert.equal((await store.request('/api/session')).status,401);
});

test('browser storage failures report unsaved changes without replacing saved data',async()=>{
 const {store,storage}=setup();await signup(store);const session=await read(store),before=[...storage.data.values()][0];storage.setItem=()=>{throw new Error('Quota exceeded');};
 const response=await save(store,session,BudgetMath.createBudget(true));assert.equal(response.ok,false);assert.match((await response.json()).error,/could not be saved/);assert.equal([...storage.data.values()][0],before);
});

test('browser validation rejects malformed budgets and settings without saving',async()=>{
 const {store}=setup();await signup(store);const session=await read(store);
 assert.equal((await save(store,session,{events:[]})).status,400);assert.equal((await patch(store,session,{unexpected:true})).status,400);assert.equal((await read(store)).revision,0);
});

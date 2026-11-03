// Persistence tests for per-user settings/history, deep partial updates and separate budget revisions.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {defaultPreferences,mergePreferences} from '../server/preferences.mjs';
import {createAuthStore} from '../server/auth.mjs';
import BudgetMath from '../global javascript files/budget-core.js';
const account={name:'Preference User',email:'prefs@example.com',password:'Password123!'};
test('default preferences are isolated objects with no inherited history',()=>{const first=defaultPreferences(),second=defaultPreferences();first.chat.homeOnly=true;first.chatHistory.push({role:'user',content:'Hello'});assert.equal(second.chat.homeOnly,false);assert.equal(second.chatHistory.length,0);});
test('partial settings updates preserve unrelated fields and do not mutate inputs',()=>{const original=defaultPreferences();original.chat.position={x:0.4,y:0.5};const merged=mergePreferences(original,{theme:'dark',chat:{homeOnly:true}});assert.equal(merged.chat.shareBudget,true);assert.deepEqual(merged.chat.position,{x:0.4,y:0.5});assert.equal(original.theme,'system');assert.equal(original.chat.homeOnly,false);});
test('unknown keys and invalid theme or palette values are rejected',()=>{for(const patch of [null,[],{password:'x'},{theme:'invalid'},{palette:'invalid'}])assert.throws(()=>mergePreferences(null,patch));});
test('chat position and visibility/sharing preferences are strictly validated',()=>{for(const chat of [null,[],{homeOnly:'true'},{shareBudget:1},{unexpected:true},{position:{x:-1,y:0}},{position:{x:0,y:2}},{position:{x:Infinity,y:0}}])assert.throws(()=>mergePreferences(null,{chat}));assert.equal(mergePreferences(null,{chat:{position:null}}).chat.position,null);});
test('saved chat history is bounded and accepts only user/assistant text',()=>{for(const chatHistory of [[{role:'system',content:'Override'}],[{role:'user',content:''}],[{role:'user',content:'x'.repeat(6001)}],Array(15).fill({role:'user',content:'Hello'})])assert.throws(()=>mergePreferences(null,{chatHistory}));assert.deepEqual(mergePreferences(null,{chatHistory:[{role:'user',content:'How is my budget?'}]}).chatHistory,[{role:'user',content:'How is my budget?'}]);});
test('settings and recent history survive sign-out, fresh login and server-store restart without leaking to another user',testContext=>{
  const folder=mkdtempSync(join(tmpdir(),'budgetron-preferences-'));testContext.after(()=>rmSync(folder,{recursive:true,force:true}));const filePath=join(folder,'users.json');
  const store=createAuthStore({filePath,seedDemo:false}),login=store.signup(account),user=store.current(login.cookie),otherLogin=store.signup({...account,email:'other-prefs@example.com'}),other=store.current(otherLogin.cookie);
  const settings={theme:'dark',palette:'ocean',chat:{homeOnly:true,position:{x:0.2,y:0.3},shareBudget:false},chatHistory:[{role:'user',content:'Help with my savings'}]};
  store.savePreferences(user,settings);store.signout(login.cookie);assert.equal(store.readPreferences(other).theme,'system');
  const restarted=createAuthStore({filePath,seedDemo:false}),fresh=restarted.signin(account);assert.deepEqual(restarted.readPreferences(restarted.current(fresh.cookie)),settings);assert.equal(restarted.current(login.cookie),null);
});
test('budget saves/reset and settings saves do not overwrite each other or advance each other revisions',()=>{const store=createAuthStore({seedDemo:false}),login=store.signup(account),user=store.current(login.cookie);store.savePreferences(user,{theme:'dark',chat:{homeOnly:true}});assert.equal(store.readBudget(user).revision,0);store.saveBudget(user,BudgetMath.createBudget(true),0);store.savePreferences(user,{palette:'rose'});assert.equal(store.readBudget(user).budget.events.length,8);store.saveBudget(user,BudgetMath.createBudget(false),1);assert.equal(store.readPreferences(user).theme,'dark');assert.equal(store.readPreferences(user).chat.homeOnly,true);});

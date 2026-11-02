// Local-classroom authentication: salted scrypt password hashes, opaque HttpOnly sessions and per-user budgets.
import {scryptSync,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {existsSync,readFileSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {dirname} from 'node:path';
import BudgetMath from '../javascript files/budget-core.js';
export const DEMO_USER={email:'demo@budgetron.local',password:'BudgetronDemo3000!',name:'Jordan Demo'};
export function hashPassword(password,salt=randomBytes(16).toString('hex')) {return {salt,hash:scryptSync(password,salt,64).toString('hex')};}
export function verifyPassword(password,stored) {const actual=scryptSync(password,stored.salt,64);const expected=Buffer.from(stored.hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
const cookieName='budgetron_session';
export function createAuthStore({filePath=null,seedDemo=true}={}) {
  let users=null;const sessions=new Map();
  function persist(){if(!filePath)return;mkdirSync(dirname(filePath),{recursive:true});const temporary=filePath+'.tmp';writeFileSync(temporary,JSON.stringify({users},null,2),{mode:0o600});renameSync(temporary,filePath);}
  function load(){if(users)return;if(filePath&&existsSync(filePath)){const saved=JSON.parse(readFileSync(filePath,'utf8'));if(!Array.isArray(saved.users))throw new Error('Invalid user database.');users=saved.users;}else users=[];
    if(seedDemo&&!users.some(user=>user.email===DEMO_USER.email)){users.push({id:randomUUID(),email:DEMO_USER.email,name:DEMO_USER.name,password:hashPassword(DEMO_USER.password),budget:BudgetMath.createBudget(true),revision:0,isDemo:true});persist();}}
  const publicUser=user=>({id:user.id,email:user.email,name:user.name,isDemo:!!user.isDemo});
  function issue(user){const token=randomBytes(32).toString('hex');sessions.set(token,{id:user.id,expires:Date.now()+86400000});return {user:publicUser(user),cookie:`${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`};}
  function tokenFrom(cookie=''){return cookie.split(';').map(part=>part.trim()).find(part=>part.startsWith(cookieName+'='))?.slice(cookieName.length+1);}
  function current(cookie){load();const token=tokenFrom(cookie),session=sessions.get(token);if(!session)return null;if(session.expires<Date.now()){sessions.delete(token);return null;}return users.find(user=>user.id===session.id)||null;}
  return {
    signup({name,email,password}){load();name=typeof name==='string'?name.trim():'';email=typeof email==='string'?email.trim().toLowerCase():'';
      if(!name||name.length>60||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||typeof password!=='string'||password.length<8||password.length>128)throw Object.assign(new Error('Enter a name, valid email, and password of 8–128 characters.'),{status:400});
      if(users.some(user=>user.email===email))throw Object.assign(new Error('An account with that email already exists.'),{status:409});
      const user={id:randomUUID(),name,email,password:hashPassword(password),budget:BudgetMath.createBudget(false),revision:0};users.push(user);persist();return issue(user);},
    signin({email,password}){load();const user=users.find(user=>user.email===String(email).trim().toLowerCase());if(typeof password!=='string'||password.length>128)throw Object.assign(new Error('Email or password is incorrect.'),{status:401});
      const fallback=users[0]?.password||hashPassword('invalid-account-password');const matches=verifyPassword(password,user?.password||fallback);if(!user||!matches)throw Object.assign(new Error('Email or password is incorrect.'),{status:401});return issue(user);},
    current,publicUser,
    signout(cookie){sessions.delete(tokenFrom(cookie));return `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;},
    readBudget(user){return {budget:structuredClone(user.budget),revision:user.revision};},
    saveBudget(user,budget,revision){BudgetMath.validateBudget(budget);if(revision!==user.revision)throw Object.assign(new Error('Your budget changed in another tab. Refresh before saving again.'),{status:409});user.budget=structuredClone(budget);user.revision++;persist();return {revision:user.revision};},
  };
}

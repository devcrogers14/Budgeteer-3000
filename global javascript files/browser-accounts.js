// Browser-only classroom accounts. Each profile owns its budget and settings; no API key or server is needed.
(function(root){
  const databaseKey='budgetron-browser-profiles-v1';
  const sessionKey='budgetron-browser-session-v1';
  const demo={name:'Jordan Demo',email:'demo@budgetron.local',password:'BudgetronDemo3000!'};
  const fail=(message,status=400)=>Object.assign(new Error(message),{status});

  // Inject storage and crypto in tests so no real browser profiles are read or modified.
  function createBrowserStore({storage,sessionStorage,cryptoImpl=root.crypto,budgetMath=root.BudgetMath,preferences=root.BudgetPreferences}){
    const publicUser=user=>({id:user.id,name:user.name,email:user.email,isDemo:!!user.isDemo});
    const clone=value=>structuredClone(value);
    function readDatabase(){
      try{const saved=storage.getItem(databaseKey);const database=saved?JSON.parse(saved):{users:[]};if(!Array.isArray(database.users))throw new Error();return database;}
      catch{throw fail('Browser storage is unavailable or unreadable. Allow local storage and use a regular browser window.');}
    }
    function writeDatabase(database){
      try{storage.setItem(databaseKey,JSON.stringify(database));}
      catch{throw fail('Your changes could not be saved in this browser. Check storage permissions or available space.');}
    }
    // PBKDF2 uses a random salt for each profile. Raw passwords are never written to storage.
    async function passwordHash(password,salt){
      const key=await cryptoImpl.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
      const bits=await cryptoImpl.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations:210000},key,256);
      return Array.from(new Uint8Array(bits));
    }
    async function newUser(details,isDemo=false){
      const salt=Array.from(cryptoImpl.getRandomValues(new Uint8Array(16)));
      return {id:cryptoImpl.randomUUID(),name:details.name,email:details.email,isDemo,password:{salt,hash:await passwordHash(details.password,salt)},budget:budgetMath.createBudget(isDemo),revision:0,preferences:preferences.defaultPreferences()};
    }
    function currentUser(database){
      let session;try{session=JSON.parse(sessionStorage.getItem(sessionKey)||'null');}catch{throw fail('Browser session storage is unavailable. Allow storage to sign in.');}
      if(!session||session.expires<Date.now())throw fail('Sign in to continue.',401);
      const user=database.users.find(user=>user.id===session.id);if(!user)throw fail('Sign in to continue.',401);return user;
    }
    function issueSession(user){
      try{sessionStorage.setItem(sessionKey,JSON.stringify({id:user.id,expires:Date.now()+86400000}));}catch{throw fail('Browser session storage is unavailable. Allow storage to sign in.');}
      return {user:publicUser(user)};
    }
    async function handle(route,{method='GET',body}={}){
      const input=body?JSON.parse(body):{};
      if(route==='/api/signout'){
        if(method!=='POST')throw fail('Use POST.',405);
        sessionStorage.removeItem(sessionKey);return {ok:true};
      }
      if(route==='/api/signup'){
        if(method!=='POST')throw fail('Use POST.',405);
        const name=typeof input.name==='string'?input.name.trim():'';
        const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
        if(!name||name.length>60||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||typeof input.password!=='string'||input.password.length<8||input.password.length>128)throw fail('Enter a name, valid email, and password of 8–128 characters.');
        const user=await newUser({name,email,password:input.password});
        // Re-read after hashing so concurrent writes are not replaced by an old database snapshot.
        const database=readDatabase();if(email===demo.email||database.users.some(user=>user.email===email))throw fail('An account with that email already exists.',409);
        database.users.push(user);writeDatabase(database);return issueSession(user);
      }
      if(route==='/api/signin'){
        if(method!=='POST')throw fail('Use POST.',405);
        const email=String(input.email||'').trim().toLowerCase();
        let database=readDatabase(),user=database.users.find(user=>user.email===email);
        if(email===demo.email&&!user){
          const seeded=await newUser(demo,true);database=readDatabase();user=database.users.find(user=>user.email===email);
          if(!user){user=seeded;database.users.push(user);writeDatabase(database);}
        }
        if(!user||typeof input.password!=='string'||input.password.length>128)throw fail('Email or password is incorrect.',401);
        const actual=await passwordHash(input.password,user.password.salt);
        if(actual.length!==user.password.hash.length||actual.some((value,index)=>value!==user.password.hash[index]))throw fail('Email or password is incorrect.',401);
        return issueSession(user);
      }
      const database=readDatabase(),user=currentUser(database);
      if(['/api/session','/api/budget'].includes(route)&&method==='GET')return {user:publicUser(user),budget:clone(user.budget),revision:user.revision,preferences:clone(user.preferences)};
      if(input.userId!==user.id)throw fail('Your signed-in user changed. Refresh this page.',409);
      if(route==='/api/budget'&&method==='PUT'){
        budgetMath.validateBudget(input.budget);
        if(input.revision!==user.revision)throw fail('Your budget changed in another tab. Refresh before saving again.',409);
        user.budget=clone(input.budget);user.revision++;writeDatabase(database);return {revision:user.revision};
      }
      if(route==='/api/preferences'&&method==='PATCH'){
        user.preferences=preferences.mergePreferences(user.preferences,input.patch);writeDatabase(database);return {preferences:clone(user.preferences)};
      }
      throw fail('Not found.',404);
    }
    // Match fetch's small response contract so existing save queues and error handling work in both modes.
    return {async request(route,options){try{const result=await handle(route,options);return {ok:true,status:200,json:async()=>result};}catch(error){return {ok:false,status:error.status||400,json:async()=>({error:error.message})};}}};
  }
  root.BudgetronBrowserAccounts={createBrowserStore};
  if(typeof module!=='undefined'&&module.exports)module.exports={createBrowserStore};
  if(root.document){
    const projectRoot=new URL('../',document.currentScript.src);
    let store;
    root.BudgetronAccounts={
      isBrowserOnly:location.protocol==='file:',
      pageURL:relativePath=>new URL(relativePath,projectRoot).href,
      async request(route,options){
        if(!this.isBrowserOnly)return fetch(route,options);
        try{store??=createBrowserStore({storage:root.localStorage,sessionStorage:root.sessionStorage});return await store.request(route,options);}
        catch{ return {ok:false,status:400,json:async()=>({error:'Browser storage is unavailable. Allow local storage and use a regular browser window.'})}; }
      },
    };
  }
})(globalThis);

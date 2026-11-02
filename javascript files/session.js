// Load only the signed-in user's budget. Cookies stay HttpOnly; no passwords or profile budgets are stored in localStorage.
let signedInUser=null,budgetRevision=0;
let budgetSaveQueue=Promise.resolve();
window.BudgetronSession={
  ready:false,
  persist(snapshot){
    budgetSaveQueue=budgetSaveQueue.then(async()=>{
      const response=await fetch('/api/budget',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({budget:snapshot,revision:budgetRevision,userId:signedInUser.id})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save budget.');budgetRevision=result.revision;
    });
    // Leave a rejected queue blocked after a conflict: stale data must not overwrite newer data.
    budgetSaveQueue.catch(error=>{const status=getElement('status');if(status)status.textContent=error.message+' Refresh to reload your saved budget.';});
    return budgetSaveQueue;
  },
};
(async()=>{
  if(location.protocol==='file:'){document.documentElement.dataset.session='offline';document.body.replaceChildren();const note=document.createElement('main');note.textContent='For sign-in and saved user budgets, run Start Budgetron.bat and open http://127.0.0.1:3000.';document.body.append(note);return;}
  try{
    const response=await fetch('/api/session',{cache:'no-store'});
    if(response.status===401){location.replace('/pages/auth/auth.html');return;}
    if(!response.ok)throw new Error('Could not load your profile.');
    const result=await response.json();signedInUser=result.user;budgetData=result.budget;budgetRevision=result.revision;initializeGoals();
    window.BudgetronSession.ready=true;render();document.documentElement.dataset.session='ready';
    const profile=document.querySelector('.sidebar-bottom');profile.replaceChildren();const name=document.createElement('strong');name.textContent=signedInUser.name;profile.append(name);
    const signout=document.createElement('button');signout.className='secondary';signout.textContent='Sign out';signout.type='button';document.querySelector('.page-actions').append(signout);
    signout.addEventListener('click',async()=>{try{await budgetSaveQueue.catch(()=>{});const response=await fetch('/api/signout',{method:'POST'});if(!response.ok)throw new Error('Could not sign out. Please try again.');sessionStorage.removeItem('budgetron-chat-history-v1');location.replace('/pages/auth/auth.html');}catch(error){getElement('status').textContent=error.message;}});
  }catch(error){document.documentElement.dataset.session='ready';const status=getElement('status');if(status)status.textContent=error.message;}
})();

// Revalidate a restored history page after sign-out or switching users.
window.addEventListener("pageshow",event=>{if(event.persisted){document.documentElement.dataset.session="loading";location.reload();}});

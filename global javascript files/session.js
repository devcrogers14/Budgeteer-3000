// Account-owned budgets and settings: browser-only storage for file mode, authenticated API storage for server mode.
let signedInUser=null,budgetRevision=0;
let budgetSaveQueue=Promise.resolve(),preferenceSaveQueue=Promise.resolve();
let pendingBudgetSaves=0,pendingPreferenceSaves=0,lastSaveError=null,isSigningOut=false;
function showSaveError(error){lastSaveError=error;showFeedback(error.message+' Refresh to reload saved data before making more changes.',{error:true});}
window.BudgetronSession={
  ready:false,preferences:null,
  get pending(){return pendingBudgetSaves+pendingPreferenceSaves;},
  flush(){return Promise.all([budgetSaveQueue,preferenceSaveQueue]);},
  persist(snapshot){
    pendingBudgetSaves++;
    budgetSaveQueue=budgetSaveQueue.then(async()=>{
      const body=JSON.stringify({budget:snapshot,revision:budgetRevision,userId:signedInUser.id});
      const response=await BudgetronAccounts.request('/api/budget',{method:'PUT',headers:{'Content-Type':'application/json'},body,keepalive:new TextEncoder().encode(body).length<60000});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save budget.');budgetRevision=result.revision;
    }).finally(()=>{pendingBudgetSaves--;});
    // A rejected budget queue stays blocked: stale data cannot overwrite a newer tab's changes.
    budgetSaveQueue.catch(showSaveError);return budgetSaveQueue;
  },
  savePreferences(patch){
    if(!signedInUser||!this.ready)return Promise.resolve();
    this.preferences={...this.preferences,...patch,chat:{...this.preferences?.chat,...patch.chat}};
    pendingPreferenceSaves++;
    preferenceSaveQueue=preferenceSaveQueue.then(async()=>{
      const body=JSON.stringify({userId:signedInUser.id,patch});
      const response=await BudgetronAccounts.request('/api/preferences',{method:'PATCH',headers:{'Content-Type':'application/json'},body,keepalive:new TextEncoder().encode(body).length<60000});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save settings.');
    }).finally(()=>{pendingPreferenceSaves--;});
    preferenceSaveQueue.catch(showSaveError);return preferenceSaveQueue;
  },
};
// Existing profiles can claim legacy browser-only settings once; other users get isolated defaults.
function initialPreferences(userId){
  const defaults={theme:'system',palette:'cream',chat:{homeOnly:false,position:null,shareBudget:true},chatHistory:[]};
  try{
    const owner=localStorage.getItem('budgetron-legacy-settings-owner');if(owner&&owner!==userId)return defaults;
    const theme=localStorage.getItem(themeKey),palette=localStorage.getItem(paletteKey),display=JSON.parse(localStorage.getItem('budgetron-chat-display-v1')||'null');
    if(['light','dark'].includes(theme))defaults.theme=theme;if(palettes.includes(palette))defaults.palette=palette;
    if(display){defaults.chat.homeOnly=display.homeOnly===true;const position=display.position;if(position&&Number.isFinite(position.x)&&Number.isFinite(position.y)&&position.x>=0&&position.x<=1&&position.y>=0&&position.y<=1)defaults.chat.position={x:position.x,y:position.y};}
    defaults.chat.shareBudget=sessionStorage.getItem('budgetron-share-budget')!=='false';
  }catch{ /* Use defaults if legacy storage is unavailable or malformed. */ }
  return defaults;
}
(async()=>{
  try{
    const response=await window.BudgetronSessionRequest||await BudgetronAccounts.request('/api/session',{cache:'no-store'});
    if(response.status===401){location.replace(BudgetronAccounts.pageURL('pages/Sign In Page/auth.html'));return;}
    if(!response.ok)throw new Error('Could not load your profile.');
    const result=await response.json();signedInUser=result.user;budgetData=result.budget;budgetRevision=result.revision;initializeGoals();
    window.BudgetronSession.ready=true;
    const preferences=result.preferences||initialPreferences(signedInUser.id);window.BudgetronSession.preferences=preferences;
    window.dispatchEvent(new CustomEvent('budgetron:preferences',{detail:preferences}));
    if(!result.preferences){await window.BudgetronSession.savePreferences(preferences);try{localStorage.setItem('budgetron-legacy-settings-owner',signedInUser.id);}catch{}}
    render();BudgetronDrafts.start(signedInUser.id);document.documentElement.dataset.session='ready';
    const profile=document.querySelector('.sidebar-bottom');profile.replaceChildren();const name=document.createElement('strong');name.textContent=signedInUser.name;profile.append(name);
    const signout=document.createElement('button');signout.className='secondary';signout.textContent='Sign Out';signout.type='button';document.querySelector('.page-actions').append(signout);
    signout.addEventListener('click',async()=>{
      try{
        await Promise.allSettled([budgetSaveQueue,preferenceSaveQueue]);
        if(lastSaveError&&!confirm('Some changes could not be saved. Sign out anyway?'))return;
        const response=await BudgetronAccounts.request('/api/signout',{method:'POST'});if(!response.ok)throw new Error('Could not sign out. Please try again.');
        BudgetronDrafts.clearAll();isSigningOut=true;sessionStorage.removeItem('budgetron-chat-history-v1');sessionStorage.removeItem(themePreviewKey);location.replace(BudgetronAccounts.pageURL('pages/Sign In Page/auth.html'));
      }catch(error){getElement('status').textContent=error.message;}
    });
  }catch(error){document.documentElement.dataset.session='ready';showSaveError(error);}
})();
// Wait only for real outstanding writes, never for a decorative transition.
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download')||link.origin!==location.origin||!window.BudgetronSession.pending)return;
  event.preventDefault();window.BudgetronSession.flush().then(()=>location.assign(link.href)).catch(()=>{});
});
window.addEventListener('beforeunload',event=>{if(!isSigningOut&&(window.BudgetronSession.pending||lastSaveError)){event.preventDefault();event.returnValue='';}});
// History restores must revalidate after sign-out or a change of account.
window.addEventListener('pageshow',event=>{if(event.persisted){document.documentElement.dataset.session='loading';location.reload();}});

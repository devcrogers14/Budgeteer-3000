// Shared interface actions: save the budget, refresh the current page, open/close dialogs and reset demo data. Each page registers its render function as window.BudgetronPage.
// Persist the budget, rerender the active page and announce the result in the status message.
function save(message,draft=null) {
  initializeGoals();render();
  if(!window.BudgetronSession?.ready)return;
  showFeedback('Saving…',{pending:true});
  window.BudgetronSession.persist(structuredClone(budgetData)).then(()=>{BudgetronDrafts.clearSaved(draft);showFeedback(message);}).catch(()=>{});
}

// Read a dollar input and round it to integer cents before storing it.

function readAmountInCents(id) { return Math.round(Number(getElement(id).value) * 100); }

// Call the current page renderer if the page has registered one.

function render() { window.BudgetronPage?.render(); }

document.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.open === 'goal-dialog') {
    const adding = button.dataset.goalMode === 'add' || !budgetData.goal; getElement('goal-dialog').dataset.mode = adding ? 'add' : 'edit';
    getElement('goal-input-name').value = adding ? '' : budgetData.goal.name; getElement('goal-target').value = adding ? 1000 : budgetData.goal.target / 100;
    if (getElement('goal-date')) getElement('goal-date').value = adding ? '' : budgetData.goal.dueDate || '';
    if (getElement('goal-account')) getElement('goal-account').value = adding ? '' : budgetData.goal.accountId || '';
  }
  if(button.dataset.open==='goal-dialog'){
    const context=getElement('goal-dialog').dataset.mode==='add'?'add':'edit:'+budgetData.goal.id;
    BudgetronDrafts.restore(getElement('goal-form'),context);
  }
  if(button.dataset.open==='payment-dialog'){
    const selectedDate=window.BudgetronPage?.entryDate?.();
    fillCategories(getElement('payment-category'),getElement('payment-kind').value);
    getElement('payment-date').value=selectedDate||isoDate(today);
    BudgetronDrafts.restore(getElement('payment-form'),'add');
    if(selectedDate)getElement('payment-date').value=selectedDate;
  }
  getElement(button.dataset.open).showModal();
}));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>{
  const dialog=button.closest('dialog'),form=dialog.querySelector('form');if(form){BudgetronDrafts.clear(form);form.reset();}dialog.close();
}));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('cancel',()=>{const form=dialog.querySelector('form');if(form){BudgetronDrafts.clear(form);form.reset();}}));

getElement('reset-demo')?.addEventListener('click', () => {
  if (!confirm('Reset this profile? The presentation profile restores dummy data; other profiles become empty.')) return;
  BudgetronDrafts.clearAll();
  budgetData = signedInUser?.isDemo ? sampleData() : BudgetMath.createBudget(false);
  initializeGoals(); window.BudgetronPage?.reset?.();
  save(signedInUser?.isDemo?'Presentation data restored.':'Profile cleared.');
});
// Form drafts are tab-local and account-scoped; they are never shared with AI or the server.
const BudgetronDrafts=(()=>{
  const draftPrefix='budgetron-form-drafts-v1:';
  const contexts=new WeakMap();
  const boundForms=new WeakSet();
  let currentUserId=null,restoring=false;
  const fields=form=>[...form.querySelectorAll('input[id]:not([type="password"]),select[id],textarea[id]')];
  function keyFor(form){return currentUserId?draftPrefix+currentUserId+':'+location.pathname+':'+form.id+':'+(contexts.get(form)||'default'):null;}
  function remember(form){
    if(restoring||!currentUserId)return null;
    const values=Object.fromEntries(fields(form).map(field=>[field.id,field.type==='checkbox'?field.checked:field.value]));
    const draft={key:keyFor(form),value:JSON.stringify({fields:values,revision:crypto.randomUUID()})};
    try{sessionStorage.setItem(draft.key,draft.value);}catch{ /* Forms remain usable if draft storage is unavailable. */ }
    return draft;
  }
  function restore(form,context='default'){
    if(!form||!currentUserId)return;
    contexts.set(form,context);
    if(!boundForms.has(form)){
      form.addEventListener('input',()=>remember(form));form.addEventListener('change',()=>remember(form));
      boundForms.add(form);
    }
    try{
      const saved=sessionStorage.getItem(keyFor(form));if(!saved||saved.length>20000)return;
      const parsed=JSON.parse(saved),values=parsed?.fields||parsed;if(!values||typeof values!=='object'||Array.isArray(values))return;
      restoring=true;
      // Restore Type before Category, allowing the page's normal change handler to refill its options.
      for(const field of fields(form)){
        if(!(field.id in values))continue;
        if(field.type==='checkbox')field.checked=values[field.id]===true;
        else if(typeof values[field.id]==='string'){
          if(field.tagName==='SELECT'&&![...field.options].some(option=>option.value===values[field.id]))continue;
          field.value=values[field.id];
        }
        field.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }catch{ /* Ignore malformed drafts rather than preventing entry. */ }
    finally{restoring=false;}
  }
  function clear(form){try{const key=keyFor(form);if(key)sessionStorage.removeItem(key);}catch{}}
  return {
    start(userId){currentUserId=userId;for(const id of ['deposit-form','expense-form','category-form'])restore(document.getElementById(id));},
    restore,remember,capture:remember,clear,
    // A completed save must not erase a newer entry the user has already started typing.
    clearSaved(draft){if(!draft)return;try{if(sessionStorage.getItem(draft.key)===draft.value)sessionStorage.removeItem(draft.key);}catch{}},
    clearAll(){if(!currentUserId)return;try{for(let index=sessionStorage.length-1;index>=0;index--){const key=sessionStorage.key(index);if(key?.startsWith(draftPrefix+currentUserId+':'))sessionStorage.removeItem(key);}}catch{}},
  };
})();

// Save feedback stays visible without scrolling to the bottom of the history list.
let feedbackTimer=null;
function showFeedback(message,{pending=false,error=false}={}){
  const status=getElement('status');if(!status)return;
  clearTimeout(feedbackTimer);status.classList.add('save-feedback');status.dataset.error=String(error);
  status.setAttribute('aria-live',error?'assertive':'polite');status.textContent=message;
  if(!pending&&!error)feedbackTimer=setTimeout(()=>{if(status.textContent===message)status.textContent='';},5000);
}

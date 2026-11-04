// Independent income and expense donuts use the same accessible SVG renderer.
let selectedIncomeCategory='Salary',selectedExpenseCategory='Home';
let requestedEntry=new URLSearchParams(location.search).get('entry');
function renderPiePage(){
  if(window.BudgetronSession?.ready&&['deposit','expense'].includes(requestedEntry)){
    const entry=requestedEntry;requestedEntry=null;
    queueMicrotask(()=>document.querySelector('[data-open="'+entry+'-dialog"]').click());
  }
  getElement('income-total').textContent=formatMoney(BudgetMath.totalIncome(budgetData,currentMonth));
  getElement('expense-total').textContent=formatMoney(BudgetMath.totalExpenses(budgetData,currentMonth));
  getElement('budget-net').textContent=formatMoney(BudgetMath.totalIncome(budgetData)-BudgetMath.totalExpenses(budgetData));
  showPurchases('income-history-list',budgetData.events.filter(event=>event.kind==='income'));
  showPurchases('expense-history-list',budgetData.events.filter(event=>event.kind!=='income'));
  for(const prefix of ['deposit','expense']){
    const select=getElement(prefix+'-category');
    fillCategories(select,getElement(prefix+'-kind').value,select.value);
  }
  for(const type of ['income','expense']){
    const totals=BudgetMath.categoryTotals(budgetData,type,currentMonth);
    const chartCategories=budgetData.categories.filter(category=>category.type===type);
    const colors=Object.fromEntries(chartCategories.map(category=>[category.name,category.color]));
    let selected=type==='income'?selectedIncomeCategory:selectedExpenseCategory;
    if(!(selected in totals))selected=chartCategories[0]?.name||'';
    const choose=name=>{if(type==='income')selectedIncomeCategory=name;else selectedExpenseCategory=name;renderPiePage();};
    drawSpendingChart(getElement(type+'-donut'),totals,choose,{colors,selectedCategory:selected,independent:true,label:type==='income'?'Income by category':'Expenses by category'});
    getElement(type+'-chart-total').textContent=formatMoney(Object.values(totals).reduce((sum,amount)=>sum+amount,0))+' this month';
    getElement(type+'-chart-categories').replaceChildren(...chartCategories.map(category=>{
      const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=category.name+' · '+formatMoney(totals[category.name]);button.setAttribute('aria-pressed',String(category.name===selected));button.addEventListener('click',()=>choose(category.name));return button;
    }));
    showPurchases(type+'-category-items',budgetData.events.filter(event=>event.kind===(type==='income'?'income':'purchase')&&event.date.startsWith(currentMonth)&&event.category===selected));
  }
}
// The existing shared dialog controller handles focus, Escape, Cancel and draft cleanup.
for(const prefix of ['deposit','expense']){
  const form=getElement(prefix+'-form');
  getElement(prefix+'-date').value=isoDate(today);
  getElement(prefix+'-kind').addEventListener('change',()=>fillCategories(getElement(prefix+'-category'),getElement(prefix+'-kind').value));
  getElement(prefix+'-name').addEventListener('input',()=>getElement(prefix+'-name').setCustomValidity(''));
  document.querySelector('[data-open="'+prefix+'-dialog"]').addEventListener('click',()=>{
    const date=getElement(prefix+'-date');if(!date.value)date.value=isoDate(today);
    fillCategories(getElement(prefix+'-category'),getElement(prefix+'-kind').value,getElement(prefix+'-category').value);
    BudgetronDrafts.restore(form);
    if(!date.value)date.value=isoDate(today);
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const name=getElement(prefix+'-name').value.trim(),amount=readAmountInCents(prefix+'-amount');
    if(!name){const field=getElement(prefix+'-name');field.setCustomValidity('Enter a description.');field.reportValidity();return;}
    if(!Number.isSafeInteger(amount)||amount<=0)return;
    const draft=BudgetronDrafts.capture(form);
    budgetData.events.push({id:newId(),name,amount,date:getElement(prefix+'-date').value,kind:getElement(prefix+'-kind').value,category:getElement(prefix+'-category').value});
    form.reset();getElement(prefix+'-date').value=isoDate(today);
    getElement(prefix+'-dialog').close();save(prefix==='deposit'?'Deposit added.':'Expense added.',draft);
  });
}
getElement('category-form').addEventListener('submit',event=>{
  event.preventDefault();
  try{
    const name=getElement('category-name').value.trim(),type=getElement('category-type').value;
    const draft=BudgetronDrafts.capture(getElement('category-form'));
    BudgetMath.addCategory(budgetData,name,type,getElement('category-color').value);
    getElement('category-form').reset();getElement('category-status').textContent='';getElement('category-dialog').close();
    save('Category created and selected.',draft);
    const form=getElement((type==='income'?'deposit':'expense')+'-form');
    getElement((type==='income'?'deposit':'expense')+'-category').value=name;
    BudgetronDrafts.remember(form);
  }catch(error){getElement('category-status').textContent=error.message;}
});
getElement('category-dialog').addEventListener('close',()=>{getElement('category-status').textContent='';});
window.BudgetronPage={render:renderPiePage};render();

// Independent income and expense donuts use the same accessible SVG renderer.
let selectedIncomeCategory='Salary',selectedExpenseCategory='Home';
function renderPiePage(){
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
window.BudgetronPage={render:renderPiePage};render();

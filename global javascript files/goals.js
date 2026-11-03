// Savings-goal summary and Add/Edit form. Progress is total income minus recorded expenses, clamped to zero.
// Update goal progress and form account choices from the shared budget.
function renderGoalSummary() {
  const goal=budgetData.goal;
  const savings=goalSavings(goal);
  getElement('goal-name').textContent=goal?goal.name:'No savings goals yet';
  getElement('goal-progress').textContent=goal?`${formatMoney(savings)} saved of ${formatMoney(goal.target)}`:'Add a goal to start tracking your savings.';
  getElement('goal-bar').hidden=!goal;
  getElement('goal-bar').value=goal?Math.min(savings/goal.target*100,100):0;
  getElement('goal-remaining').textContent=goal?(savings>=goal.target?'Goal reached!':`${formatMoney(goal.target-savings)} to go`):'';
  document.querySelectorAll('[data-goal-action="edit"]').forEach(button=>{
    button.textContent=goal?'Edit goal':'+ Add goal';
    button.dataset.goalMode=goal?'edit':'add';
  });

}

getElement('goal-form')?.addEventListener('submit',event=>{
  event.preventDefault();
  const name=getElement('goal-input-name').value.trim();
  if(!name){getElement('goal-input-name').setCustomValidity('Enter a goal name.');getElement('goal-input-name').reportValidity();return;}
  const draft=BudgetronDrafts.capture(getElement('goal-form'));
  const goal={name,target:readAmountInCents('goal-target'),dueDate:getElement('goal-date')?.value||'',progressSource:'net-income'};
  if(getElement('goal-dialog').dataset.mode==='add'||!budgetData.goal){
    goal.id=newId();budgetData.goals.push(goal);budgetData.goal=goal;budgetData.activeGoalId=goal.id;
  }else Object.assign(budgetData.goal,goal);
  getElement('goal-dialog').close();save('Savings goal saved.',draft);
});
getElement('goal-input-name')?.addEventListener('input',()=>getElement('goal-input-name').setCustomValidity(''));

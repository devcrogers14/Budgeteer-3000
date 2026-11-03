// Complete income/expense history, with planned payments visible but excluded from totals.
function renderTransactionsPage(){
  const income=BudgetMath.totalIncome(budgetData),expenses=BudgetMath.totalExpenses(budgetData);
  getElement('transactions-income').textContent=formatMoney(income);
  getElement('transactions-expenses').textContent=formatMoney(expenses);
  getElement('transactions-net').textContent=formatMoney(income-expenses);
  const filter=getElement('transaction-filter').value;
  showPurchases('all-spending',budgetData.events.filter(event=>filter==='all'||event.kind===filter));
}
getElement('transaction-filter').addEventListener('change',renderTransactionsPage);
window.BudgetronPage={render:renderTransactionsPage};render();

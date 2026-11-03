// Shared browser state. Financial calculations are pure functions in budget-core.js; signed-in data comes from the server.
const getElement=id=>document.getElementById(id);
const formatMoney=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const isoDate=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const today=new Date(),currentMonth=isoDate(today).slice(0,7);
const newId=()=>crypto.randomUUID();
const formatPercentage=(amount,total)=>`${(total?amount/total*100:0).toFixed(1)}%`;
let selectedCategory=new URLSearchParams(location.search).get('category')||'Home';
let categories={};
let budgetData=BudgetMath.createBudget(false);
function sampleData(){return BudgetMath.createBudget(true);}
function refreshCategories(){categories=Object.fromEntries(budgetData.categories.filter(category=>category.type==='expense').map(category=>[category.name,category.color]));}
function initializeGoals(){
  budgetData.goals=Array.isArray(budgetData.goals)?budgetData.goals:[];
  budgetData.goal=budgetData.goals.find(goal=>goal.id===budgetData.activeGoalId)||budgetData.goals[0]||null;
  budgetData.activeGoalId=budgetData.goal?.id||null;
  budgetData.income=BudgetMath.totalIncome(budgetData,currentMonth);
  refreshCategories();
}
function removeGoal(id){if(!budgetData.goals.some(goal=>goal.id===id))return false;budgetData.goals=budgetData.goals.filter(goal=>goal.id!==id);initializeGoals();return true;}
function currentMonthPurchases(){return budgetData.events.filter(event=>event.kind==='purchase'&&event.date.startsWith(currentMonth));}
function spendingTotals(){return BudgetMath.categoryTotals(budgetData,'expense',currentMonth);}
function goalSavings(goal){return BudgetMath.goalProgress(budgetData,goal).amount;}
function typeLabel(kind){return kind==='income'?'Income':kind==='planned'?'Planned expense':'Expense';}
function fillCategories(select,kind,selected){select.replaceChildren(...budgetData.categories.filter(category=>category.type===(kind==='income'?'income':'expense')).map(category=>new Option(category.name,category.name)));if(selected&&[...select.options].some(option=>option.value===selected))select.value=selected;}
initializeGoals();

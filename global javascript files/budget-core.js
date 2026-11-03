// Pure budgeting functions shared by the browser, server and unit tests. Money is integer cents.
(function(root) {
  const defaultCategories = () => [
    {name:'Salary',type:'income',color:'#376b50'}, {name:'Side Work',type:'income',color:'#447b9a'},
    {name:'Other Income',type:'income',color:'#8d4862'}, {name:'Home',type:'expense',color:'#376b50'},
    {name:'Food',type:'expense',color:'#95c4a3'}, {name:'Transport',type:'expense',color:'#507a63'},
    {name:'Other',type:'expense',color:'#8d4862'},
  ];
  const dateString = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function createBudget(demo=false, date=new Date()) {
    const day = number => dateString(new Date(date.getFullYear(),date.getMonth(),Math.min(number,new Date(date.getFullYear(),date.getMonth()+1,0).getDate())));
    return {schemaVersion:2,categories:defaultCategories(),events:demo?[
      {id:'salary',name:'Campus job paycheck',amount:250000,date:day(1),kind:'income',category:'Salary'},
      {id:'side-work',name:'Freelance design',amount:50000,date:day(5),kind:'income',category:'Side Work'},
      {id:'rent',name:'Rent',amount:120000,date:day(2),kind:'purchase',category:'Home'},
      {id:'food',name:'Groceries',amount:18000,date:day(8),kind:'purchase',category:'Food'},
      {id:'gas',name:'Transit and gas',amount:6500,date:day(10),kind:'purchase',category:'Transport'},
      {id:'other',name:'Unexpected purchase',amount:4500,date:day(12),kind:'purchase',category:'Other'},
      {id:'phone',name:'Phone bill',amount:4500,date:day(28),kind:'planned',category:'Other'},
      {id:'insurance',name:'Insurance',amount:9000,date:day(30),kind:'planned',category:'Other'},
    ]:[],goals:demo?[
      {id:'emergency',name:'Emergency fund',target:500000,dueDate:dateString(new Date(date.getFullYear()+1,date.getMonth(),1))},
      {id:'laptop',name:'New laptop',target:400000,dueDate:''},
    ]:[],activeGoalId:demo?'emergency':null};
  }
  function totalIncome(budget,month=null) {return budget.events.filter(event=>event.kind==='income'&&(!month||event.date.startsWith(month))).reduce((sum,event)=>sum+event.amount,0);}
  function totalExpenses(budget,month=null) {return budget.events.filter(event=>event.kind==='purchase'&&(!month||event.date.startsWith(month))).reduce((sum,event)=>sum+event.amount,0);}
  function categoryTotals(budget,type,month=null) {
    const totals=Object.fromEntries(budget.categories.filter(category=>category.type===type).map(category=>[category.name,0]));
    for(const event of budget.events) if(event.kind===(type==='income'?'income':'purchase')&&(!month||event.date.startsWith(month))) totals[event.category]=(totals[event.category]||0)+event.amount;
    return totals;
  }
  // Goals follow income remaining after recorded expenses; planned transactions are excluded. They do not reserve funds.
  function goalProgress(budget,goal) {return goal?{amount:Math.max(0,totalIncome(budget)-totalExpenses(budget)),percent:Math.min(100,Math.max(0,totalIncome(budget)-totalExpenses(budget))/goal.target*100)}:{amount:0,percent:0};}
  function addCategory(budget,name,type,color='#507a63') {
    name=String(name).trim();
    if(!name||name.length>40||!['income','expense'].includes(type)||!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Use a category name of 1–40 characters and a valid color.');
    if(budget.categories.some(category=>category.type===type&&category.name.toLowerCase()===name.toLowerCase())) throw new Error('That category already exists.');
    if(budget.categories.length>=60)throw new Error('Keep at most 60 categories.');
    budget.categories.push({name,type,color});
  }
  function validateBudget(budget) {
    if(!budget||!Array.isArray(budget.categories)||!Array.isArray(budget.events)||!Array.isArray(budget.goals)||budget.categories.length>60||budget.events.length>2000||budget.goals.length>30)throw new Error('Invalid budget structure.');
    const validText=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
    const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
    const validAmount=value=>Number.isSafeInteger(value)&&value>0&&value<=100000000000;
    const categoryKeys=new Set(),eventIds=new Set(),goalIds=new Set();
    for(const category of budget.categories){
      if(!validText(category.name,40)||!['income','expense'].includes(category.type)||!/^#[0-9a-f]{6}$/i.test(category.color))throw new Error('Invalid category.');
      const key=category.type+':'+category.name.toLowerCase();if(categoryKeys.has(key))throw new Error('Duplicate category.');categoryKeys.add(key);
    }
    for(const event of budget.events){
      if(!validText(event.id,100)||eventIds.has(event.id)||!validText(event.name,60)||!validAmount(event.amount)||!validDate(event.date)||!['income','purchase','planned'].includes(event.kind))throw new Error('Invalid transaction.');
      eventIds.add(event.id);
      if(!budget.categories.some(category=>category.name===event.category&&category.type===(event.kind==='income'?'income':'expense')))throw new Error('Transaction category does not match its type.');
    }
    for(const goal of budget.goals){if(!validText(goal.id,100)||goalIds.has(goal.id)||!validText(goal.name,60)||!validAmount(goal.target)||(goal.dueDate&&!validDate(goal.dueDate)))throw new Error('Invalid goal.');goalIds.add(goal.id);}
    return true;
  }
  const api={createBudget,totalIncome,totalExpenses,categoryTotals,goalProgress,addCategory,validateBudget};
  root.BudgetMath=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);

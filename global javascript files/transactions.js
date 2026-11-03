// Shared transaction lists and Edit/Delete controls. Editing recorded purchases updates spending; planned payments stay separate and neither action moves account balances.
// Build Edit/Delete buttons only for saved transactions, excluding generated transfer reminders.
function transactionActions(record) {
  const actions = document.createElement('div'); actions.className = 'transaction-actions';
  if (!record.id || !budgetData.events.some((item) => item.id === record.id)) return actions;
  const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'text-button'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', `Edit ${record.name}`);
  edit.addEventListener('click', () => openTransactionEditor(record.id));
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button delete-transaction'; remove.textContent = 'Delete'; remove.setAttribute('aria-label', `Delete ${record.name}`);
  remove.addEventListener('click', () => {
    if (!confirm(`Delete "${record.name}"? It will be removed from the calendar and spending charts.`)) return;
    budgetData.events = budgetData.events.filter((item) => item.id !== record.id);
    save('Transaction deleted. Calendar and spending totals updated.');
  });
  actions.append(edit, remove); return actions;
}

// Create the shared dialog once, then populate it from the requested transaction.

function openTransactionEditor(id) {
  let dialog = getElement('transaction-editor');
  if (!dialog) {
    dialog = document.createElement('dialog'); dialog.id = 'transaction-editor'; dialog.setAttribute('aria-labelledby', 'transaction-editor-title');
    dialog.innerHTML = `<form id="transaction-edit-form"><h2 id="transaction-editor-title">Edit Transaction</h2>
      <label>Description<input id="tx-name" maxlength="60" required></label>
      <label>Amount ($)<input id="tx-amount" type="number" min="0.01" max="1000000000" step="0.01" required></label>
      <label>Date<input id="tx-date" type="date" required></label>
      <label>Type<select id="tx-kind"><option value="purchase">Purchase</option><option value="planned">Planned expense</option><option value="income">Income</option></select></label>
      <label>Category<select id="tx-category"><option>Home</option><option>Food</option><option>Transport</option><option>Other</option></select></label>
      <p class="small">Income increases available funds; expenses decrease them. Planned expenses are excluded from totals.</p>
      <div class="button-row"><button type="button" class="secondary" id="tx-cancel">Cancel</button><button type="submit">Save Changes</button></div></form>`;
    document.body.append(dialog);
    getElement('tx-cancel').addEventListener('click',()=>{BudgetronDrafts.clear(getElement('transaction-edit-form'));dialog.close();});
    dialog.addEventListener('cancel',()=>BudgetronDrafts.clear(getElement('transaction-edit-form')));
    getElement('tx-kind').addEventListener('change',()=>fillCategories(getElement('tx-category'),getElement('tx-kind').value));
    getElement('tx-name').addEventListener('input', () => getElement('tx-name').setCustomValidity(''));
    getElement('transaction-edit-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const name = getElement('tx-name').value.trim();
      if (!name) { getElement('tx-name').setCustomValidity('Enter a description.'); getElement('tx-name').reportValidity(); return; }
      const amount = Math.round(Number(getElement('tx-amount').value) * 100);
      if (!Number.isSafeInteger(amount) || amount <= 0) return;
      const current = budgetData.events.find((item) => item.id === dialog.dataset.transactionId);
      if (!current) { dialog.close(); return; }
      const draft=BudgetronDrafts.capture(getElement('transaction-edit-form'));
      Object.assign(current, {name, amount, date:getElement('tx-date').value, kind:getElement('tx-kind').value, category:getElement('tx-category').value});
      window.BudgetronPage?.transactionChanged?.(current);
      dialog.close(); save('Transaction updated. Calendar and spending totals updated.',draft);
    });
  }
  const record = budgetData.events.find((item) => item.id === id); if (!record) return;
  dialog.dataset.transactionId = id;
  getElement('tx-name').setCustomValidity(''); getElement('tx-name').value = record.name;
  getElement('tx-amount').value = (record.amount/100).toFixed(2); getElement('tx-date').value = record.date;
  getElement('tx-kind').value = record.kind; fillCategories(getElement('tx-category'),record.kind,record.category);
  BudgetronDrafts.restore(getElement('transaction-edit-form'),'edit:'+id);
  dialog.showModal();
}

// Sort transactions newest first and build text-safe rows with their action buttons.

function showPurchases(id, items) {
  if (!getElement(id)) return;
  getElement(id).replaceChildren(...[...items].sort((a, b) => b.date.localeCompare(a.date)).map((event) => {
    const item = document.createElement('li'); const title = document.createElement('div'); title.className = 'payment-title';
    const name = document.createElement('span'); name.textContent = event.name;
    const amount = document.createElement('span'); amount.textContent = `${event.kind==='income'?'+':event.kind==='purchase'?'−':''}${formatMoney(event.amount)}`; title.append(name, amount);
    const detail = document.createElement('small'); detail.textContent = `${event.date} · ${typeLabel(event.kind)} · ${event.category}`;
    item.append(title, detail, transactionActions(event)); return item;
  }));
  if (!items.length) { const item = document.createElement('li'); item.textContent = 'No transactions to show.'; getElement(id).append(item); }
}


// Income and Expenses share entry validation, category creation and history rendering.
function initializeLedgerPage(type) {
  const kind=type==='income'?'income':'purchase';
  function renderLedger(){
    const matching=budgetData.events.filter(event=>type==='income'?event.kind==='income':event.kind!=='income');
    const monthly=matching.filter(event=>event.date.startsWith(currentMonth)&&event.kind===kind);
    getElement('ledger-total').textContent=formatMoney(monthly.reduce((sum,event)=>sum+event.amount,0));
    getElement('ledger-count').textContent=monthly.length;
    getElement('ledger-net').textContent=formatMoney(BudgetMath.totalIncome(budgetData)-BudgetMath.totalExpenses(budgetData));
    fillCategories(getElement('ledger-category'),kind,getElement('ledger-category').value);
    showPurchases('ledger-list',matching);
  }
  getElement('ledger-date').value=isoDate(today);
  getElement('ledger-form').addEventListener('submit',event=>{
    event.preventDefault();const name=getElement('ledger-name').value.trim(),amount=readAmountInCents('ledger-amount');
    if(!name||!Number.isSafeInteger(amount)||amount<=0)return;
    const draft=BudgetronDrafts.capture(getElement('ledger-form'));
    budgetData.events.push({id:newId(),name,amount,date:getElement('ledger-date').value,kind:getElement('ledger-kind').value,category:getElement('ledger-category').value});
    getElement('ledger-name').value='';getElement('ledger-amount').value='';save(type==='income'?'Income added.':'Expense added.',draft);
  });
  getElement('category-form').addEventListener('submit',event=>{
    event.preventDefault();try{
      const categoryName=getElement('category-name').value.trim(),draft=BudgetronDrafts.capture(getElement('category-form'));
      BudgetMath.addCategory(budgetData,categoryName,type,getElement('category-color').value);
      getElement('category-name').value='';getElement('category-status').textContent='Category created.';
      save('Category created and selected.',draft);
      // The renderer fills options synchronously; select the newly created option for the next entry.
      getElement('ledger-category').value=categoryName;BudgetronDrafts.remember(getElement('ledger-form'));
    }catch(error){getElement('category-status').textContent=error.message;}
  });
  window.BudgetronPage={render:renderLedger};render();
}

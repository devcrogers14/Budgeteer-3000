// Sign in, create a new account, or fill the presentation user's public dummy credentials.
let createAccount=false;
const form=document.getElementById('auth-form'),message=document.getElementById('auth-status'),submit=document.getElementById('auth-submit');
document.getElementById('auth-switch').addEventListener('click',()=>{createAccount=!createAccount;document.getElementById('name-field').hidden=!createAccount;document.getElementById('auth-name').required=createAccount;submit.textContent=createAccount?'Create account':'Sign in';document.getElementById('auth-title').textContent=createAccount?'Create your account':'Welcome back';document.getElementById('auth-switch').textContent=createAccount?'Already have an account? Sign in':'New here? Create an account';document.getElementById('auth-password').autocomplete=createAccount?'new-password':'current-password';message.textContent='';});
document.getElementById('fill-demo').addEventListener('click',()=>{if(createAccount)document.getElementById('auth-switch').click();document.getElementById('auth-email').value='demo@budgetron.local';document.getElementById('auth-password').value='BudgetronDemo3000!';message.textContent='Demo credentials filled. Click Sign in to begin the presentation.';});
form.addEventListener('submit',async event=>{
  event.preventDefault();submit.disabled=true;message.textContent='';
  try{const response=await BudgetronAccounts.request(createAccount?'/api/signup':'/api/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.getElementById('auth-name').value,email:document.getElementById('auth-email').value,password:document.getElementById('auth-password').value})});const result=await response.json();if(!response.ok)throw new Error(result.error);sessionStorage.removeItem('budgetron-chat-history-v1');location.assign(BudgetronAccounts.pageURL('Pages/Home Page/home.html'));}
  catch(error){message.textContent=error.message;}finally{submit.disabled=false;}
});

// Explain the storage choice at the point where users select an account.
const storageNote=document.createElement('p');storageNote.className='small';storageNote.textContent=BudgetronAccounts.isBrowserOnly?'Browser mode: profiles stay in this browser. No installation or API key is needed. AI chat requires Start Budgetron.bat.':'AI/server mode: profiles are saved by the local server. Browser-file profiles are separate.';form.before(storageNote);

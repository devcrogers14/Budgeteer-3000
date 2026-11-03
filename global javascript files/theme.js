// Apply a browser fallback before paint; authenticated profile preferences then restore the correct user settings.
// Apply the theme before the page appears, then connect the header toggle.
const themeKey = 'insert-name-theme';
let currentTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
try {
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === 'dark' || savedTheme === 'light') currentTheme = savedTheme;
} catch { /* The toggle still works without browser storage. */ }
document.documentElement.dataset.theme = currentTheme;
const paletteKey = 'insert-name-palette';
const palettes = ['cream', 'sage', 'ocean', 'rose'];
let currentPalette = 'cream';
try {
  const savedPalette = localStorage.getItem(paletteKey);
  if (palettes.includes(savedPalette)) currentPalette = savedPalette;
} catch { /* The selected palette still works for this page. */ }
// Cache only visual preferences for this tab; budgets and identity still load from the active account store.
const themePreviewKey='budgetron-theme-preview-v1';
function rememberThemePreview(){
  try{sessionStorage.setItem(themePreviewKey,JSON.stringify({theme:currentTheme,palette:currentPalette}));}catch{ /* Theme controls still work without this optional preview. */ }
}
try{
  const preview=JSON.parse(sessionStorage.getItem(themePreviewKey)||'null');
  if(preview&&['light','dark'].includes(preview.theme)&&palettes.includes(preview.palette)){
    currentTheme=preview.theme;currentPalette=preview.palette;
    document.documentElement.dataset.theme=currentTheme;
  }
}catch{ /* Ignore unavailable or invalid preview storage. */ }
document.documentElement.dataset.palette = currentPalette;
// Begin the authenticated read while the browser parses the page and loads the deferred UI scripts.
if(location.protocol!=='file:'&&document.documentElement.dataset.session==='loading'){
  window.BudgetronSessionRequest=fetch('/api/session',{cache:'no-store'}).catch(()=>null);
}

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const updateToggle = () => {
    themeToggle.setAttribute('aria-pressed', String(currentTheme === 'dark'));
    themeToggle.title = currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  };
  updateToggle();
  const palettePicker = document.getElementById('color-theme');
  palettePicker.value = currentPalette;
  palettePicker.addEventListener('change', () => {
    currentPalette = palettePicker.value;
    window.BudgetronSession?.savePreferences({palette:currentPalette});
    document.documentElement.dataset.palette = currentPalette;
    rememberThemePreview();
    try { if(!window.BudgetronSession?.ready)localStorage.setItem(paletteKey, currentPalette); }
    catch { /* Palette changes remain usable for this page. */ }
  });
  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    window.BudgetronSession?.savePreferences({theme:currentTheme});
    document.documentElement.dataset.theme = currentTheme;
    updateToggle();
    rememberThemePreview();
    try { if(!window.BudgetronSession?.ready)localStorage.setItem(themeKey, currentTheme); }
    catch { /* Theme changes remain usable for this page. */ }
  });
});


// Slide only the sidebar selection background; links still navigate immediately.
document.addEventListener('DOMContentLoaded', () => {
  const navigation = document.querySelector('nav');
  const links = [...(navigation?.querySelectorAll('a') || [])];
  const selectedLink = navigation?.querySelector('[aria-current="page"]');
  if (!navigation || !selectedLink) return;
  // Reveal the selected link in the phone's horizontal navigation without delaying page changes.
  if(matchMedia('(max-width:760px)').matches)selectedLink.scrollIntoView({block:'nearest',inline:'nearest'});
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const highlight = document.createElement('span');
  highlight.className = 'nav-selection-highlight'; highlight.setAttribute('aria-hidden','true');
  navigation.append(highlight); navigation.classList.add('has-sliding-highlight');
  const selectionStorageKey = 'budgetron-sidebar-selection-v1';

  // Measure relative to the navigation so desktop rows and phone grids both work.
  function highlightPosition(link) {
    const bounds = link.getBoundingClientRect();
    const navigationBounds = navigation.getBoundingClientRect();
    return {transform:`translate(${bounds.left-navigationBounds.left}px,${bounds.top-navigationBounds.top}px)`,width:`${bounds.width}px`,height:`${bounds.height}px`};
  }
  function placeHighlight() { Object.assign(highlight.style,highlightPosition(selectedLink)); }
  placeHighlight();
  try {
    const previousSelection = JSON.parse(sessionStorage.getItem(selectionStorageKey));
    sessionStorage.removeItem(selectionStorageKey);
    const previousLink = links[previousSelection?.index];
    if (!motionPreference.matches && previousLink && previousSelection.target === location.href && Date.now()-previousSelection.time < 10000 && previousLink !== selectedLink) {
      highlight.animate([highlightPosition(previousLink),highlightPosition(selectedLink)],{duration:180,easing:'ease-out'});
    }
  } catch { /* The selected-tab background still works without storage or animation support. */ }
  navigation.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    try { sessionStorage.setItem(selectionStorageKey,JSON.stringify({index:links.indexOf(selectedLink),target:link.href,time:Date.now()})); }
    catch { /* Page links never depend on storing animation state. */ }
  });
  new ResizeObserver(placeHighlight).observe(navigation);
  window.addEventListener('pageshow',placeHighlight);
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) highlight.getAnimations().forEach(animation=>animation.cancel());
    placeHighlight();
  });
});


// The session restores account-owned settings before revealing profile content.
window.addEventListener('budgetron:preferences',event=>{
  const preferences=event.detail;
  currentTheme=preferences.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):preferences.theme;
  currentPalette=preferences.palette;
  document.documentElement.dataset.theme=currentTheme;document.documentElement.dataset.palette=currentPalette;
  rememberThemePreview();
  const toggle=document.getElementById('theme-toggle'),picker=document.getElementById('color-theme');
  if(toggle){toggle.setAttribute('aria-pressed',String(currentTheme==='dark'));toggle.title=currentTheme==='dark'?'Switch to Light Mode':'Switch to Dark Mode';}
  if(picker)picker.value=currentPalette;
});

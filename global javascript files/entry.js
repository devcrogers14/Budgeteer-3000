// Redirect the root start page to Home, retaining any query parameters and hash fragment.
// Keep query parameters when the start page is opened as a local file.
location.replace(new URL('../pages/Home Page/home.html'+location.search+location.hash,document.currentScript.src));

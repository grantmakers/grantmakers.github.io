---
---
function ready(fn) {
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  /* Initialize Materialize components */
  /* ********************************* */
  const elemsSN = document.querySelectorAll('.sidenav');
  M.Sidenav.init(elemsSN);

  const elemsNavMore = document.getElementById('primary-navbar-dropdown-trigger');
  const optionsNavMore = {
    'container': 'primary-navbar',
    'constrainWidth': false,
  };
  M.Dropdown.init(elemsNavMore, optionsNavMore);

  // About page secondary/scrollspy nav
  const elemsSS = document.querySelectorAll('.scrollspy');
  const optionsSS = {
    'scrollOffset': 120, // Default is 200
  };
  M.ScrollSpy.init(elemsSS, optionsSS);

  // About page secondary/scrollspy nav cont'd...
  const elemsPP = document.querySelectorAll('.pushpin');
  const pinAnchor = document.getElementById('main-content');
  
  if (pinAnchor && elemsPP.length > 0) { // Only init if needed
    const pinAnchorTop = getElementOffset(pinAnchor).top - 15; // HACK Remove hard coded offset buffer
    const optionsPP = {
      'top': pinAnchorTop,
      'bottom': pinAnchorTop + pinAnchor.offsetHeight - 90, // HACK Remove hard coded bottom buffer
    };
    M.Pushpin.init(elemsPP, optionsPP);
  }

  // FAQ embedded collapsibles
  const elemsC = document.querySelectorAll('.collapsible');
  M.Collapsible.init(elemsC);

  /* Load Google Sheets iframe */
  /* ************************* */
  if (document.getElementById('gsheets')) {
    initGoogleSheets();
  }

  // Lazy Load Iubenda script
  // =======================================================
  function createIubendaObserver() {
    let observer;
    let anchor = document.querySelector('footer');
    let config = {
      rootMargin: '0px 0px',
      threshold: 0.01,
    };
    // Initiate observer using Footer as anchor
    observer = new IntersectionObserver(enableIubenda, config);
    observer.observe(anchor);
  }

  function enableIubenda(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        iubenda();
        observer.unobserve(entry.target);
      }
    });
  }

  function iubenda() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.iubenda.com/iubenda.js';
    document.body.appendChild(script);
  }

  if ('IntersectionObserver' in window) {
    createIubendaObserver();
  }
});

function getElementOffset(element) {
  let de = document.documentElement;
  let box = element.getBoundingClientRect(); // FIX Will throw error if element null
  let top = box.top + window.pageYOffset - de.clientTop;
  let left = box.left + window.pageXOffset - de.clientLeft;
  return { 'top': top, 'left': left };
}

function initGoogleSheets() {
  const gsDefer = document.getElementsByTagName('iframe');
  for (let i = 0; i < gsDefer.length; i++) {
    if (gsDefer[i].getAttribute('data-src')) {
      gsDefer[i].setAttribute('src', gsDefer[i].getAttribute('data-src'));
    }
  }
}

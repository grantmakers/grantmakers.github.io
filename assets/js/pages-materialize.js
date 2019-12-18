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

  const elemsSNMore = document.getElementById('sidenav-more');
  M.Sidenav.init(elemsSNMore, { 'edge': 'right' });

  const elemsSS = document.querySelectorAll('.scrollspy');
  const optionsSS = {
    'scrollOffset': 120, // Default is 200
  };
  M.ScrollSpy.init(elemsSS, optionsSS);

  const elemsPP = document.querySelectorAll('.pushpin');
  const pinAnchor = document.getElementById('main-content');
  
  if (elemsPP.length > 0) { // Only init if needed
    const pinAnchorTop = getElementOffset(pinAnchor).top - 15; // HACK Remove hard coded offset buffer
    const optionsPP = {
      'top': pinAnchorTop,
      'bottom': pinAnchorTop + pinAnchor.offsetHeight - 90, // HACK Remove hard coded bottom buffer
    };
    M.Pushpin.init(elemsPP, optionsPP);
  }

  /* Load Google Sheets iframe */
  /* ************************* */
  initGoogleSheets();
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

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
  // Helper definitions
  const scrollAnchor = document.querySelector('.nav-search');
  const isMobile = window.matchMedia('only screen and (max-width: 992px)');
  // Initialize Materialize components
  // Note: if the element is created dynamically via Instantsearch widget,
  // the plugin needs to be initialized in the normal Instantsearch workflow
  // using the render method (e.g. search.on('render'...)
  const elemsPA = document.querySelectorAll('.parallax');
  M.Parallax.init(elemsPA);

  const elemsSN = document.querySelectorAll('.sidenav');
  M.Sidenav.init(elemsSN);

  if (!isMobile.matches) { // Use pushpin on desktop only
    const elemPP = document.querySelector('.nav-search nav');
    const optionsPP = {
      'top': elemPP.offsetTop,
    };
    M.Pushpin.init(elemPP, optionsPP);
  }

  // Toggle
  const toggleParent = document.getElementById('search-toggle');
  const toggle = toggleParent.querySelector('select');
  toggle.onchange = function() {
    toggle.classList.toggle('grants-search');
  };
  

  // Algolia Instantsearch init
  const searchClient = algoliasearch('KDWVSZVS1I', 'ce4d584b0de36ca3f8b4727fdb83c658');

  const search = instantsearch({
    'indexName': 'grantmakers_io',
    searchClient,
    'numberLocale': 'en-US',
    'searchParameters': {
      'hitsPerPage': 8,
    },
    'routing': true,
  });

  // Define templates
  const templateHits = `{% include search/algolia-template-hits.html %}`;
  const templateHitsEmpty = `{% include search/algolia-template-hits-empty.html %}`;
  const templateStats = `{% include search/algolia-template-stats.html %}`;

  // Construct widgets
  search.addWidget(
    instantsearch.widgets.searchBox({
      'container': '#ais-widget-search-box',
      'placeholder': 'Foundation name...',
      'autofocus': true,
      'showSubmit': true,
      'showReset': true,
      'showLoadingIndicator': false,
      'queryHook': function(query, searchNew) {
        readyToSearchScrollPosition();
        searchNew(query);
        initTooltips();
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.poweredBy({
      'container': '#powered-by',
    })
  );

  search.addWidget(
    instantsearch.widgets.hits({
      'container': '#ais-widget-hits',
      'templates': {
        'item': templateHits,
        'empty': templateHitsEmpty,
      },
      'cssClasses': {
        'list': 'row',
        'item': ['col', 's12'],
      },
      transformItems(items) {
        return items.map(item => ({
          ...item,
          'ein_formatted': item.ein.replace(/(\d{2})(\d{7})/, '$1-$2'),
          'grant_median': `$${item.grant_median.toLocaleString()}`,
          'assets': `$${numberHuman(item.assets, 0)}`,
        }));
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.stats({
      'container': '#ais-widget-stats',
      'templates': {
        'text': templateStats,
      },
      'cssClasses': {
        'text': 'text-muted',
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.currentRefinements({
      'container': '#ais-widget-current-refined-values',
      'includedAttributes': ['city', 'state'],
      'cssClasses': {
        'list': 'list-inline',
        'item': ['btn', 'blue-grey'],
        'label': ['small'],
        'categoryLabel': 'text-bold',
        'delete': 'blue-grey-text',
      },
    })
  );

  /* Create refinements */
  const refinements = [
    'city',
    'state',
  ];

  refinements.forEach((refinement) => {
    /* Create desktop refinements */
    search.addWidget(
      instantsearch.widgets.refinementList({
        'container': `#ais-widget-refinement-list--${refinement}`,
        'attribute': refinement,
        'limit': 8,
        'showMore': false,
        'cssClasses': {
          'checkbox': 'filled-in',
          'count': ['right', 'small'],
          'selectedItem': ['grantmakers-text'],
        },
      })
    );

    /* Create mobile refinements */
    search.addWidget(
      instantsearch.widgets.refinementList({
        'container': `#ais-widget-mobile-refinement-list--${refinement}`,
        'attribute': refinement,
        'limit': 8,
        'showMore': false,
        'cssClasses': {
          'checkbox': 'filled-in',
          'count': ['right', 'small'],
          'selectedItem': ['grantmakers-text'],
        },
      })
    );
  });

  search.addWidget(
    instantsearch.widgets.clearRefinements({
      'container': '#ais-widget-clear-all',
      'cssClasses': {
        'button': ['btn'],
      },
      'templates': {
        'resetLabel': 'Clear filters',
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.pagination({
      'container': '#ais-widget-pagination',
      'maxPages': 20,
      'scrollTo': '.nav-search',
      'cssClasses': {
        'root': 'pagination',
        'page': 'waves-effect',
        'selectedItem': 'active grantmakers',
        'disabledItem': 'disabled',
      },
    })
  );

  // Initialize Materialize JS components created by Instantsearch widgets
  search.once('render', function() {
    // Search toggle
    initSelect();
  });

  search.on('render', function() {
    // Tooltips
    initTooltips();
  });

  search.on('error', function() {
    // TODO Add messaging for 403 origin not allowed
  });

  // Initialize search
  search.start();

  // Materialize init helpers
  function initTooltips() {
    const elems = document.querySelectorAll('.tooltipped');
    const options = {
      'position': 'top',
      'exitDelay': 0, // Default is 0
      'enterDelay': 100, // Default is 200
      'inDuration': 300, // Default is 300
      'outDuration': 250, // Default is 250
    };
    M.Tooltip.init(elems, options);
  }

  function initSelect() {
    const elem = document.querySelectorAll('select');
    const options = {
      'classes': 'btn blue-grey white-text',
    };
    M.FormSelect.init(elem, options);
  }

  // Scroll to top of results upon input change
  function readyToSearchScrollPosition() {
    window.scrollTo({
      'top': scrollAnchor.offsetTop,
      'left': 0,
      'behavior': 'auto',
    });
  }

  // Helper functions
  function numberHuman(num, decimals) {
    if (num === null) { return null; } // terminate early
    if (num === 0) { return '0'; } // terminate early
    if (isNaN(num)) { return num; } // terminate early if already a string - handles edge case likely caused by cacheing
    const fixed = !decimals || decimals < 0 ? 0 : decimals; // number of decimal places to show
    const b = num.toPrecision(2).split('e'); // get power
    const k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3); // floor at decimals, ceiling at trillions
    const c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed); // divide by power
    const d = c < 0 ? c : Math.abs(c); // enforce -0 is 0
    const e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
    return e;
  }
});

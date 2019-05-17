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
  // using the render method (e.g. search.once('render'...)
  const elemsPA = document.querySelectorAll('.parallax');
  M.Parallax.init(elemsPA);

  const elemsSN = document.querySelectorAll('.sidenav');
  M.Sidenav.init(elemsSN);

  if (!isMobile.matches) { // Use pushpin on desktop only
    const elemPP = document.querySelector('.nav-search nav');
    const optionsPP = {
      top: elemPP.offsetTop,
    };
    M.Pushpin.init(elemPP, optionsPP);
  }

  // Algolia Instantsearch init
  const searchClient = algoliasearch('KDWVSZVS1I', 'ce4d584b0de36ca3f8b4727fdb83c658');

  const search = instantsearch({
    indexName: 'grantmakers_io',
    searchClient,
    // TODO?
    numberLocale: 'en-US',
    // routing: true,
  });

  /*
  var APPLICATION_ID = 'KDWVSZVS1I';
  var SEARCH_ONLY_API_KEY = 'ce4d584b0de36ca3f8b4727fdb83c658';
  var INDEX_NAME = 'grantmakers_io';
  var PARAMS = {
    hitsPerPage: 10,
    maxValuesPerFacet: 8,
    facets: ['grant_median'],
    disjunctiveFacets: ['city', 'state'],
    index: INDEX_NAME
  };
  var FACETS_SLIDER = [];
  var FACETS_ORDER_OF_DISPLAY = ['city', 'state'];
  var FACETS_LABELS = {'city': 'City', 'state': 'State'};
  */

  // Define templates
  const templateHits = `{% include search/algolia-template-hits.html %}`;
  const templateStats = `{% include search/algolia-template-stats.html %}`

  // Define color palette
  const widgetHeaderClasses = ['card-header', 'grey', 'lighten-4'];

  // Helper variables - see also helper functions at bottom
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
  });

  // Construct widgets
  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#ais-widget-search-box',
      placeholder: 'Foundation name...',
      showSubmit: true,
      showReset: true,
      showLoadingIndicator: false,
      queryHook: function(query, searchNew) {
        readyToSearchScrollPosition();
        searchNew(query);
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.poweredBy({
      container: '#powered-by',
    })
  );

  search.addWidget(
    instantsearch.widgets.hits({
      container: '#ais-widget-hits',
      templates: {
        item: templateHits,
      },
      cssClasses: {
        list: 'row',
        item: ['col', 's12'],
      },
      transformItems(items) {
        return items.map(item => ({
          // n.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
          ...item,
          ein: item.ein.replace(/(\d{2})(\d{7})/, '$1-$2'),
          grant_median: `$${item.grant_median.toLocaleString()}`,
          assets: `$${numberHuman(item.assets, 0)}`,
        }));
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.stats({
      container: '#ais-widget-stats',
      templates: {
        text: templateStats,
      },
      cssClasses: {
        text: 'text-muted',
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-refinement-list--city',
      attribute: 'city',
      limit: 8,
      showMore: true,
    })
  );

  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-refinement-list--state',
      attribute: 'state',
      limit: 8,
      showMore: true,
    })
  );



  // Initialize Materialize JS components
  search.once('render', function() {
    // Search toggle
    const elem = document.querySelectorAll('select');
    const options = {
      classes: 'btn blue-grey white-text',
    };
    M.FormSelect.init(elem, options)


    // Sort by
    const elems = document.querySelectorAll('select');
    //M.FormSelect.init(elems);
  });

  // Initialize search
  search.start();

  // Scroll to top of results upon input change
  function readyToSearchScrollPosition() {
    window.scrollTo({
      top: scrollAnchor.offsetTop,
      left: 0,
      behavior: 'auto',
    });
  }

  // Helper functions
  function numberHuman(num, fixed) {
    if (num === null) { return null; } // terminate early
    if (num === 0) { return '0'; } // terminate early
    fixed = (!fixed || fixed < 0) ? 0 : fixed; // number of decimal places to show
    var b = (num).toPrecision(2).split("e"), // get power
        k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
        c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed), // divide by power
        d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
        e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
    return e;
  }

  /* Legacy functions below :: May not be using */
  function slugify(text) {
    return text.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function randomId() {
    return Math.random()
      .toString(36)
      .substr(2, 10);
  }

  function formatRefinements(item) {
    // Format numbers
    let n = item.count;
    let formattedNumber = formatter.format(n);
    item.count = formattedNumber;
    // Ensure css IDs are properly formatted and unique
    if (item.label) {
      item.cssId = 'id-' + slugify(item.label);
    } else {
      // Fallback
      item.cssId = 'id-' + randomId();
    }
    return item;
  }
});

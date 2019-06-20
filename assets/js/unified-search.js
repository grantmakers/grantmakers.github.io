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

  const elemsMO = document.querySelectorAll('.modal');
  M.Modal.init(elemsMO);

  if (!isMobile.matches) { // Use pushpin on desktop only
    const elemPP = document.querySelector('.nav-search nav');
    const optionsPP = {
      'top': elemPP.offsetTop,
    };
    M.Pushpin.init(elemPP, optionsPP);
  }

  // Define Algolia params
  let searchClient;
  let facets;

  const profilesSearch = algoliasearch('KDWVSZVS1I', 'ce4d584b0de36ca3f8b4727fdb83c658');
  const grantsSearch = algoliasearch('QA1231C5W9', 'cd47ecb3457441878399b20acc8c3fbc');

  const profilesSearchFacets = [
    'city',
    'state',
  ];
  const grantsSearchFacets = [
    'grantee_name',
    'organization_name',
    'grantee_city',
    'grantee_state',
  ];

  // Define toggle helpers
  const toggleParent = document.getElementById('search-toggle');
  const toggle = toggleParent.querySelector('select');

  // Set search type
  const urlParams = new URLSearchParams(window.location.search);
  let searchType = urlParams.get('type') || 'profiles';
  setInitialSearchType(searchType);

  function setInitialSearchType(type) {
    if (!type) {
      // TODO Set profiles as initial search type
    }
    if (type === 'profiles') {
      searchClient = profilesSearch;
      facets = profilesSearchFacets;
    } else {
      searchClient = grantsSearch;
      facets = grantsSearchFacets;
      toggle.classList.add('grants-search');
      toggle.value = 'grants';
      // TODO Ease the color change - causes a noticeable 'flash'
    }
  }
  
  function setInstantsearchParams() {

  }
  // TODO Set instantsearch params
  // NOTE To dynamically change search parameters, need either
  // 1. Custom widget, or
  // 2. A page refresh
  
  // TODO Set initial button color if grants...e.g. initialIsNotProfiles

  // Toggle search type
  toggle.onchange = function() {
    // Toggle button color
    // TODO Set via searchType
    toggle.classList.toggle('grants-search'); // Won't work if url query string starts at grants

    // searchType = !searchType; // Requires using a boolean

    // Toggle search type
    searchType = searchType === 'profiles' ? 'grants' : 'profiles';
    
    // window.location.search = urlParams.toString(); // Refreshes page

    // Update query string
    urlParams.set('type', searchType);
    if (history.pushState) {
      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${urlParams}`;
      window.history.pushState({'path': newUrl}, '', newUrl);
    }
  };

  const search = instantsearch({
    'indexName': 'grantmakers_io',
    searchClient,
    'numberLocale': 'en-US',
    'searchParameters': {
      'hitsPerPage': 8,
    },
    'routing': {
      'stateMapping': {
        stateToRoute({query, refinementList, page}) {
          // TODO Add all relevent refinements from array
          
          return {
            'type': searchType,
            'query': query,
            // we use the character ~ as it is one that is rarely present in data and renders well in URLs
            'grantee_name':
              refinementList &&
              refinementList.grantee_name &&
              refinementList.grantee_name.join('~'),
            'organization_name':
              refinementList &&
              refinementList.organization_name &&
              refinementList.organization_name.join('~'),
            'grantee_city':
              refinementList &&
              refinementList.grantee_city &&
              refinementList.grantee_city.join('~'),
            'grantee_state':
              refinementList &&
              refinementList.grantee_state &&
              refinementList.grantee_state.join('~'),
            'page': page,
          };
        },
        routeToState({type, query, grantees, orgs, cities, states, page}) {
          return {
            'type': type,
            'query': query,
            'refinementList': {
              'grantee_name': grantees && grantees.split('~'),
              'organization_name': orgs && orgs.split('~'),
              'grantee_city': cities && cities.split('~'),
              'grantee_state': states && states.split('~'),
            },
            'page': page,
          };
        },
      },
    },
  });

  // Define templates
  const templateHitsEmpty = `{% include search/algolia-template-hits-empty.html %}`;
  const templateStats = `{% include search/algolia-template-stats.html %}`;

  // Profiles
  const templateHitsProfiles = `{% include search/profiles/algolia-template-hits.html %}`;

  // Grants
  const templateHits = `{% include search/grants/algolia-template-hits.html %}`;

  // Construct widgets
  search.addWidget(
    instantsearch.widgets.searchBox({
      'container': '#ais-widget-search-box',
      'placeholder': 'Foundation name...',
      'autofocus': true,
      'showSubmit': true,
      'showReset': true,
      'showLoadingIndicator': false,
      'queryHook': function(query, searchInstance) {
        const queryCleaned = checkForEIN(query);
        readyToSearchScrollPosition();
        searchInstance(queryCleaned);
        initTooltips();
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.poweredBy({
      'container': '#powered-by',
    })
  );

  // Profiles search
  /*
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
  */

  // Grants search
  search.addWidget(
    instantsearch.widgets.hits({
      'container': '#ais-widget-hits',
      'templates': {
        'item': templateHits,
        'empty': templateHitsEmpty,
      },
      'cssClasses': {
        'root': '',
        'list': 'striped row',
        'item': ['col', 's12'],
      },
      transformItems(items) {
        return items.map(item => ({
          ...item,
          // 'ein_formatted': item.ein.replace(/(\d{2})(\d{7})/, '$1-$2'),
          'grant_amount': `$${item.grant_amount.toLocaleString()}`,
          // 'assets': `$${numberHuman(item.assets, 0)}`,
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
      transformItems(items) {
        return items.map(item => ({
          ...item,
          'label': getLabel(item),
        }));
      },
    })
  );

  /* Create refinements */
  facets.forEach((refinement) => {
    const refinementListWithPanel = instantsearch.widgets.panel({
      'templates': {
        'header': refinement,
      },
      hidden(options) {
        return options.results.nbHits === 0;
      },
      'cssClasses': {
        'root': 'card',
        'header': [
          'card-header',
          'grey',
          'lighten-4',
        ],
        'body': 'card-content',
      },
    })(instantsearch.widgets.refinementList);

    // TODO DRY it up
    const mobileRefinementListWithPanel = instantsearch.widgets.panel({
      'templates': {
        'header': refinement,
      },
      hidden(options) {
        return options.results.nbHits === 0;
      },
      'cssClasses': {
        'root': 'card',
        'header': [
          'card-header',
          'blue-grey',
          'lighten-4',
        ],
        'body': 'card-content',
      },
    })(instantsearch.widgets.refinementList);
    
    /* Create desktop refinements */
    search.addWidget(
      // instantsearch.widgets.refinementList({
      refinementListWithPanel({
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
      mobileRefinementListWithPanel({
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
    initModals();
  });

  search.on('error', function(e) {
    // TODO Add messaging for 403 origin not allowed
    // TODO Remove console statement UNLESS is development
    console.log(e);
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

  function initModals() {
    const elems = document.querySelectorAll('.modal');
    M.Modal.init(elems);
  }

  function initSelect() {
    const elem = document.querySelectorAll('select');
    const options = {
      'classes': 'btn blue-grey white-text',
    };
    M.FormSelect.init(elem, options);
  }

  // QUERY HOOKS
  // ==============
  // Handle EINs entered in searchbox with a hyphen
  function checkForEIN(query) {
    // Base Regex: /^[0-9]{2}\-\d{7}$/g;
    // Assume query is an EIN as soon as 2 digits entered after hyphen
    const regexEIN = /^[0-9]{2}\-\d{2}/g;
    const isEIN = regexEIN.test(query);
    if (query.includes('-') && isEIN) {
      // TODO Will remove hyphen if query ALSO includes prohibit string (e.g. -foo 12-3456789)
      // TODO Add toast - will assist with any confusion caused by routing:true setting...
      // ...which autoupdates the url withOUT the hyphen
      return query.replace('-', '');
    } else {
      return query;
    }
  }

  // Scroll to top of results upon input change
  function readyToSearchScrollPosition() {
    window.scrollTo({
      'top': scrollAnchor.offsetTop,
      'left': 0,
      'behavior': 'auto',
    });
  }
  // MISC HELPER FUNCTIONS
  // ==============
  function getLabel(item) {
    const obj = facets.filter(each => each.facet === item.attribute);
    return obj[0].label;
  }
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

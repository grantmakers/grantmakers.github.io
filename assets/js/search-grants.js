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

  // INITIALIZE MATERIALIZE COMPONENTS
  // =================================
  // Note: if the element is created dynamically via Instantsearch widget,
  // the plugin needs to be initialized in the normal Instantsearch workflow
  // using the render method (e.g. search.on('render'...)
  const elemsPA = document.querySelectorAll('.parallax');
  M.Parallax.init(elemsPA);

  const elemsNavMore = document.getElementById('primary-navbar-dropdown-trigger');
  const optionsNavMore = {
    'container': 'primary-navbar',
    'constrainWidth': false,
  };
  M.Dropdown.init(elemsNavMore, optionsNavMore);

  const elemsSN = document.querySelectorAll('.sidenav');
  M.Sidenav.init(elemsSN);

  const elemsMO = document.querySelectorAll('.modal');
  M.Modal.init(elemsMO);

  const elSearchBoxDropdown = document.querySelectorAll('.dropdown-trigger')[1]; // HACK Hard coding using bracket notation is precarious
  const optionsSearchBoxDropdown = {
    'alignment': 'right',
    'constrainWidth': false,
    'coverTrigger': false,
    'closeOnClick': false,
    'onOpenEnd': function() {
      gaEventsSearchBoxNarrow();
    },
  };
  M.Dropdown.init(elSearchBoxDropdown, optionsSearchBoxDropdown);

  if (!isMobile.matches) { // Use pushpin on desktop only
    const elemPP = document.querySelector('.nav-search nav');
    const optionsPP = {
      'top': elemPP.offsetTop,
    };
    M.Pushpin.init(elemPP, optionsPP);
  }

  // ALGOLIA
  // ==============
  const searchClient = algoliasearch('QA1231C5W9', '{{ site.algolia_public_key_grants }}');
  const algoliaIndex = 'grantmakers_io';
  const facets = [
    {
      'facet': 'grantee_name',
      'label': 'Recipient',
    },
    {
      'facet': 'organization_name',
      'label': 'Donor',
    },
    {
      'facet': 'grantee_city',
      'label': 'Recipient City',
    },
    {
      'facet': 'grantee_state',
      'label': 'Recipient State',
    },
    {
      'facet': 'grant_amount',
      'label': 'Amount',
    },
  ];

  // Define toggle helpers
  const toggleParent = document.getElementById('search-toggle');
  const toggle = toggleParent.querySelector('select');

  // Define RangeInput min/max - for placeholders only
  const rangeMin = 0;
  const rangeMax = 1051049025;

  // Ensure initial toggle state set to grants search
  toggle.value = 'grants';

  // Toggle search type
  toggle.onchange = function() {
    window.location.href = '/search/profiles/';
  };

  // Toogle Advanced Search tools
  // Advanced search features are hidden by default via css
  // Could handle initial show/hide directly in Instantsearch via cssClasses, but too many side effects
  // Even listener set in search.once InstantSearch event
  const toggleAdvancedElem = document.querySelector('.search-toggle-advanced input[type="checkbox"]');

  const search = instantsearch({
    'indexName': algoliaIndex,
    searchClient,
    'numberLocale': 'en-US',
    'routing': {
      'stateMapping': {
        stateToRoute(uiState) {
          /**
           * State to Route updates the url from whatever is happening in Instantsearch
           * We use the character ~ as it is one that is rarely present in data and renders well in URLs
           */
          const indexUiState = uiState[algoliaIndex];
          return {
            'query': indexUiState.query,
            'grantee_name':
              indexUiState.refinementList &&
              indexUiState.refinementList.grantee_name &&
              indexUiState.refinementList.grantee_name.join('~'),
            'organization_name':
              indexUiState.refinementList &&
              indexUiState.refinementList.organization_name &&
              indexUiState.refinementList.organization_name.join('~'),
            'grantee_city':
              indexUiState.refinementList &&
              indexUiState.refinementList.grantee_city &&
              indexUiState.refinementList.grantee_city.join('~'),
            'grantee_state':
              indexUiState.refinementList &&
              indexUiState.refinementList.grantee_state &&
              indexUiState.refinementList.grantee_state.join('~'),
            'grant_amount':
              indexUiState.range &&
              indexUiState.range.grant_amount &&
              indexUiState.range.grant_amount.replace(':', '~'),
            'page': indexUiState.page,
          };
        },
        routeToState(routeState) {
          /**
           * Route to State takes the url and parses it
           * The object it creates is sent to the widgets
           */
          return {
            [algoliaIndex]: {
              'query': routeState.query,
              'refinementList': {
                'grantee_name': routeState.grantee_name && routeState.grantee_name.split('~'),
                'organization_name': routeState.organization_name && routeState.organization_name.split('~'),
                'grantee_city': routeState.grantee_city && routeState.grantee_city.split('~'),
                'grantee_state': routeState.grantee_state && routeState.grantee_state.split('~'),
              },
              'range': {
                'grant_amount': routeState.grant_amount && routeState.grant_amount.replace('~', ':'),
              },
              'page': routeState.page,
            },
          };
        },
      },
    },
  });

  // Define templates
  const templateHitsEmpty = `{% include search/grants/algolia-template-hits-empty.html %}`;
  const templateStats = `{% include search/algolia-template-stats.html %}`;

  // Define Grants hit template
  const templateHits = `{% include search/grants/algolia-template-hits.html %}`;

  // Define default search parameters
  const defaultSearchableAttributes = [
    'organization_name',
    'grantee_name',
    'grantee_city',
    'grantee_state',
    'grant_purpose',
  ];

  /* ---------------------------- */
  /* Connector - Configure Widget */
  /* ---------------------------- */
  const renderConfigure = (renderOptions, isFirstRender) => {
    const { refine, widgetParams } = renderOptions;
    const arr = widgetParams.searchParameters.restrictSearchableAttributes;

    if (isFirstRender) {
      const searchDropdownItems = document.getElementById('dropdown-body');
      const searchDropDownOnlyButtons = document.querySelectorAll('.checkbox-only');

      // Create event listener for "Only" link clicks
      searchDropDownOnlyButtons.forEach(element => {
        element.addEventListener('click', e => {
          e.preventDefault(); // Prevent Materialize Dropdown from taking over
          const attribute = e.target.dataset.attribute;

          // Mimic default Materialize Dropdown functionality
          searchDropdownItems.querySelectorAll('input').forEach((el) => {
            if (el.id === attribute) {
              el.checked = true;
            } else {
              el.checked = false;
            }

            // Hide Materialize after selection
            // Materialize default for dropdowns requires clicking off dropdown wrapper
            const instance = M.Dropdown.getInstance(elSearchBoxDropdown);
            instance.close();
            readyToSearchScrollPosition();
          });
          
          // Refine Algolia parameters
          // TODO Add logic to handle city + state
          // Currently assumes state will always remain in searchable attributes
          refine({
            'restrictSearchableAttributes': [attribute, 'grantee_state'],
          });
        });
      });

      // Create event listener for "Select All" link clicks
      document.getElementById('select-all').addEventListener('click', e => {
        e.preventDefault(); // Prevent Materialize Dropdown from taking over

        // Mimic default Materialize Dropdown functionality
        searchDropdownItems.querySelectorAll('input').forEach((el) => {
          el.checked = true;

          // Hide Materialize after selection
          // Materialize default for dropdowns requires clicking off dropdown wrapper
          const instance = M.Dropdown.getInstance(elSearchBoxDropdown);
          instance.close();
          readyToSearchScrollPosition();
        });
        refine({
          'restrictSearchableAttributes': defaultSearchableAttributes,
        });
      });

      // Create event listener for individual checkbox selections
      searchDropdownItems.addEventListener('change', (e) => {
        const attribute = e.target.id;
        const isChecked = e.target.checked; // Note: this is the status AFTER the change
        // Note: grantee_state will always remain in searchable attributes
        // thus array.length should at least be 2, not 1
        if (widgetParams.searchParameters.restrictSearchableAttributes.length === 2 && isChecked === false) {
          e.target.checked = !isChecked;
          M.Toast.dismissAll();
          M.toast({'html': 'At least one item needs to be searchable'});
          return;
        }
        // TODO Add logic to handle city + state
        // Currently assumes state will always remain in searchable attributes
        refine({
          'restrictSearchableAttributes': addOrRemoveSearchableAttributes(arr, attribute),
        });
      });
    }

    // Adjust UI based on selections
    // Add or remove visual cue implying a customization was made
    // Change input placeholder text => default is somewhat redundant as also declared in searchBox widget
    const inputEl = document.querySelector('input[class="ais-SearchBox-input"]');
    const triggerEl = document.getElementById('search-box-dropdown-trigger').querySelector('.search-box-dropdown-trigger-wrapper');
    if (widgetParams.searchParameters.restrictSearchableAttributes.length === 5) {
      triggerEl.classList.remove('adjusted');
      inputEl.placeholder = 'Search by keywords, location, or grantee name';
    } else {
      triggerEl.classList.add('adjusted');
      inputEl.placeholder = 'Search by custom fields selected';
    }
  };

  // Create the custom widget
  const customConfigure = instantsearch.connectors.connectConfigure(
    renderConfigure,
    () => {},
  );

  /* ----------------------- */
  /* Connector - Range Input */
  /* ----------------------- */
  const renderRangeInput = (renderOptions, isFirstRender) => {
    const { start, refine, widgetParams } = renderOptions; // Not using 'range' argument
    const [min, max] = start;

    if (isFirstRender) {
      // Create panel
      const wrapper = document.createElement('div');
      wrapper.setAttribute('class', 'ais-RangeInput');
      const form = document.createElement('form');
      form.setAttribute('class', 'ais-RangeInput-form');

      form.addEventListener('submit', event => {
        event.preventDefault();

        const rawMinInputValue = parseFloat(event.target.elements.min.value);
        const rawMaxInputValue = parseFloat(event.target.elements.max.value);

        refine([
          Number.isFinite(rawMinInputValue) ? rawMinInputValue : undefined,
          Number.isFinite(rawMaxInputValue) ? rawMaxInputValue : undefined,
        ]);
      });

      widgetParams.container.appendChild(wrapper);
      wrapper.appendChild(form);

      return;
    }

    widgetParams.container.querySelector('form').addEventListener('input', event => {
      event.preventDefault();

      // Show helper text
      // TODO This feels unnecessarily complicated
      const helperEl = document.querySelector('.ais-Panel-footer');
      const helperElMin = helperEl.querySelector('#range-footer-min');
      const helperElMax = helperEl.querySelector('#range-footer-max');
      const helperElSymbol = helperEl.querySelector('#range-footer-symbol');
      let amount = parseFloat(event.target.value);
      let amountMin;
      let amountMax;
      if (event.target.classList.contains('ais-RangeInput-input--min')) {
        amountMin = numberHuman(amount);
        amountMax = helperElMax.textContent || null;
        helperElMin.textContent = `${amountMin ? '$' + amountMin : ''}`;
      }
      if (event.target.classList.contains('ais-RangeInput-input--max')) {
        amountMax = numberHuman(amount);
        amountMin = helperElMin.textContent || null;
        helperElMax.textContent = `${amountMax ? '$' + amountMax : ''}`;
      }
      helperElSymbol.textContent = getRangeFooterSymbol(amountMin, amountMax);
    });

    widgetParams.container.querySelector('form').innerHTML = `
      <label class="ais-RangeInput-label">
        <input
          class="ais-RangeInput-input ais-RangeInput-input--min"
          type="number"
          name="min"
          placeholder="${rangeMin}"
          value="${Number.isFinite(min) ? min : ''}"
        />
      </label>
      <span>to</span>
      <label class="ais-RangeInput-label">
        <input
          class="ais-RangeInput-input ais-RangeInput-input--max"
          type="number"
          name="max"
          placeholder="${rangeMax}"
          value="${Number.isFinite(max) ? max : ''}"
        />
      </label>
      <button class="ais-RangeInput-submit btn-flat blue-grey white-text" type="submit">Go</button>
    `;
  };

  // Create the custom range input widget
  const customRangeInput = instantsearch.connectors.connectRange(
    renderRangeInput,
  );

  function getRangeFooterSymbol(min, max) {
    let symbol;
    if (min && max) {
      symbol = ' - ';
    } else if (min && !max) {
      symbol = '+';
    } else if (!min && max) {
      symbol = '<';
    } else if (!min && !max) {
      symbol = '';
    }
    return symbol;
  }

  // Create the panel widget wrapper
  const customRangeInputWithPanel = instantsearch.widgets.panel({
    'templates': {
      'header': 'Grant Amount',
      footer(options) {
        // TODO DRY it up
        if (options.state && options.state.numericRefinements && options.state.numericRefinements.grant_amount) {
          const min = options.state.numericRefinements.grant_amount['>='];
          const max = options.state.numericRefinements.grant_amount['<='];
          let minFormatted;
          let maxFormatted;
          if (min) {
            const minFloat = parseFloat(min.toString());
            minFormatted = numberHuman(minFloat);
          }
          if (max) {
            const maxFloat = parseFloat(max.toString());
            maxFormatted = numberHuman(maxFloat);
          }
          return `<span id="range-footer-min">${minFormatted ? '$' + minFormatted : ''}</span><span id="range-footer-symbol">${getRangeFooterSymbol(minFormatted, maxFormatted)}</span><span id="range-footer-max">${maxFormatted ? '$' + maxFormatted : ''}</span>`;
        } else {
          return '<span id="range-footer-min"></span><span id="range-footer-symbol"></span><span id="range-footer-max"></span>';
        }
      },
    },
    hidden(options) {
      return options.results.nbHits === 0;
    },
    'cssClasses': {
      'root': ['card'],
      'header': [
        'card-header',
      ],
      'body': 'card-content',
      'footer': 'small',
    },
  })(customRangeInput);

  /* ---------------------------- */
  /* Create all other refinements */
  /* ---------------------------- */
  facets.forEach((refinement) => {
    // Amount handled by range widget
    if (refinement.facet === 'grant_amount') {
      return;
    }
    const refinementListWithPanel = instantsearch.widgets.panel({
      'templates': {
        'header': refinement.label,
      },
      hidden(options) {
        return options.results.nbHits === 0;
      },
      'cssClasses': {
        'root': 'card',
        'header': [
          'card-header',
          // 'grey',
          // 'lighten-4',
        ],
        'body': 'card-content',
      },
    })(instantsearch.widgets.refinementList);

    // TODO DRY it up
    // Hiding on mobile as grants search refinements not useful on mobile
    /*
    const mobileRefinementListWithPanel = instantsearch.widgets.panel({
      'templates': {
        'header': refinement.label,
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
    */
    
    /* Create desktop refinements */
    search.addWidget(
      refinementListWithPanel({
        'container': `#ais-widget-refinement-list--${refinement.facet}`,
        'attribute': refinement.facet,
        'limit': 8,
        'showMore': true,
        'showMoreLimit': 20,
        'cssClasses': {
          'checkbox': 'filled-in',
          'labelText': 'small',
          'count': ['right', 'small'],
          'showMore': 'btn-flat blue-grey-text small',
          'disabledShowMore': 'hidden',
        },
        'templates': {
          'showMoreText': `{% include search/algolia-refinementList-showMore.html %}`,
        },
      }),
    );

    /* Create mobile refinements */
    /* Hiding on mobile as grants search refinements not useful on mobile
    search.addWidget(
      mobileRefinementListWithPanel({
        'container': `#ais-widget-mobile-refinement-list--${refinement.facet}`,
        'attribute': refinement.facet,
        'limit': 8,
        'showMore': false,
        'cssClasses': {
          'checkbox': 'filled-in',
          'count': ['right', 'small'],
          'selectedItem': ['grantmakers-text'],
        },
      })
    );
    */
  });

  /* ------------------------------- */
  /* Connector - Current Refinements */
  /* ------------------------------- */
  const createDataAttribtues = refinement =>
    Object.keys(refinement)
      .map(key => `data-${key}="${refinement[key]}"`)
      .join(' ');

  const renderListItem = item => `
    ${item.refinements.map(refinement => `
      <li>
        <button class="waves-effect btn blue-grey lighten-3 grey-text text-darken-3 truncate" ${createDataAttribtues(refinement)}><i class="material-icons right">remove_circle</i><small>${getLabel(item.label)}</small> ${formatIfRangeLabel(refinement)} </button>
      </li>
    `).join('')}
  `;

  const renderCurrentRefinements = (renderOptions) => {
    const { items, refine, widgetParams } = renderOptions;

    widgetParams.container.innerHTML = `<ul class="list list-inline">${items.map(renderListItem).join('')}</ul>`;

    [...widgetParams.container.querySelectorAll('button')].forEach(element => {
      element.addEventListener('click', event => {
        const item = Object.keys(event.currentTarget.dataset).reduce(
          (acc, key) => ({
            ...acc,
            [key]: event.currentTarget.dataset[key],
          }),
          {},
        );

        refine(item);
      });
    });
  };

  const customCurrentRefinements = instantsearch.connectors.connectCurrentRefinements(
    renderCurrentRefinements,
  );

  /* ---------------------------- */
  /* Instantiate all Widgets
  /* ---------------------------- */
  search.addWidgets([
    instantsearch.widgets.searchBox({
      'container': '#ais-widget-search-box',
      'placeholder': 'Search by keywords, location, or grantee name',
      'showSubmit': true,
      'showReset': true,
      'showLoadingIndicator': false,
      'queryHook': function(query, searchInstance) {
        const queryCleaned = checkForEIN(query);
        readyToSearchScrollPosition();
        searchInstance(queryCleaned);
        initTooltips();
      },
    }),

    customConfigure({
      'container': document.querySelector('#search-box-dropdown'),
      'searchParameters': {
        'hitsPerPage': 12,
        'restrictSearchableAttributes': [
          'grantee_name',
          'grant_purpose',
          'grantee_city',
          'grantee_state',
          'organization_name',
        ],
      },
    }),

    instantsearch.widgets.poweredBy({
      'container': '#powered-by',
    }),

    instantsearch.widgets.hits({
      'container': '#ais-widget-hits',
      'templates': {
        'item': templateHits,
        'empty': templateHitsEmpty,
      },
      'cssClasses': {
        'root': '',
        'list': 'striped row',
        'item': ['col', 's12', 'li-grants-search'],
      },
      transformItems(items) {
        return items.map(item => ({
          ...item,
          'grant_amount': `$${item.grant_amount.toLocaleString()}`,
        }));
      },
    }),

    instantsearch.widgets.stats({
      'container': '#ais-widget-stats',
      'templates': {
        'text': templateStats,
      },
      'cssClasses': {
        'text': 'text-muted',
      },
    }),

    customRangeInputWithPanel({
      'container': document.querySelector('#ais-widget-range-input'),
      'attribute': 'grant_amount',
    }),

    customCurrentRefinements({
      'container': document.querySelector('#ais-widget-current-refined-values'),
    }),

    instantsearch.widgets.clearRefinements({
      'container': '#ais-widget-clear-all',
      'cssClasses': {
        'button': ['btn blue-grey white-text waves-effect waves-light'],
      },
      'templates': {
        'resetLabel': 'Clear filters',
      },
    }),

    instantsearch.widgets.pagination({
      'container': '#ais-widget-pagination',
      'maxPages': 20,
      'scrollTo': '.nav-search',
      'cssClasses': {
        'root': 'pagination',
        'page': 'waves-effect',
        'selectedItem': 'active',
        'disabledItem': 'disabled',
      },
    }),
  ]);

  /* ---------------------------- */
  /* Render Widgets
  /* ---------------------------- */
  search.once('render', function() {
    // Initialize static Materialize JS components created by Instantsearch widgets
    initSelect();
    // Show range input if initial URL contains an amount refinement
    setInitialAdvancedSearchToggleState();
    // Create advanced search toggle listener
    toggleAdvancedElem.addEventListener('change', toggleAdvancedListener, false);
  });

  search.on('render', function() {
    // Initialize dynamic Materialize JS components created by Instantsearch widgets
    initTooltips();
    initModals();
    initHitsDropdowns();
    // Google Analytics events
    document.querySelectorAll('#no-results-ctas a')
      .forEach(e => e.addEventListener('click', gaEventsNoResults));
  });

  search.on('error', function(e) {
    if (e.statusCode === 429) {
      renderRateLimit();
      console.log('Rate limit reached');
    }
    if (e.statusCode === 403) {
      renderForbidden();
      console.log('Origin forbidden');
    }
    // console.log(e);
  });

  /* ---------------------------- */
  /* Start Search
  /* ---------------------------- */
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

  function initHitsDropdowns() {
    const elems = document.querySelectorAll('.dropdown-trigger-hits');
    const options = {
      'constrainWidth': false,
    };
    M.Dropdown.init(elems, options);
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

  function setInitialAdvancedSearchToggleState() {
    // If any numeric refinements, automatically show ALL advanced tools, not just range input
    const obj = search.helper.state.numericRefinements;
    const check = Object.keys(obj).length;
    if (check > 0) {
      // Show advanced search elements
      document.getElementById('algolia-hits-wrapper').classList.remove('js-hide-advanced-tools');
      // Flip switch to on position
      toggleAdvancedElem.checked = true;
    }
  }

  function toggleAdvancedListener(e) {
    if (e.target.checked) {
      showAdvancedSearchTools();
      gaEventsToggledAdvanced('on');
    } else {
      hideAdvancedSearchTools();
      gaEventsToggledAdvanced('off');
    }
  }

  function showAdvancedSearchTools() {
    document.getElementById('algolia-hits-wrapper').classList.remove('js-hide-advanced-tools');
  }

  function hideAdvancedSearchTools() {
    document.getElementById('algolia-hits-wrapper').classList.add('js-hide-advanced-tools');
  }

  // GOOGLE ANALYTICS EVENTS
  // =======================
  let gaCheck = window[window['GoogleAnalyticsObject'] || 'ga']; // eslint-disable-line dot-notation
  function gaEventsToggledAdvanced(outcome) {
    let gaCount = 0;

    if (typeof gaCheck === 'function' && gaCount === 0) {
      ga('send', 'event', {
        'eventCategory': 'Grants Search Events',
        'eventAction': 'Clicked Toggle Advanced Tools',
        'eventLabel': 'Advanced Tools Toggled ' + outcome,
      });
    }

    gaCount++;
  }

  function gaEventsSearchBoxNarrow() {
    let gaCount = 0;

    if (typeof gaCheck === 'function' && gaCount === 0) {
      ga('send', 'event', {
        'eventCategory': 'Grants Search Events',
        'eventAction': 'Clicked SearchBox Dropdown Trigger',
        'eventLabel': 'SearchBox Dropdown Opened',
      });
    }

    gaCount++;
  }

  function gaEventsNoResults() {
    if (typeof gaCheck === 'function') {
      ga('send', 'event', {
        'eventCategory': 'Grants Search Events',
        'eventAction': 'Grants Search No Results CTA Click',
        'eventLabel': this.dataset.ga,
      });
    }
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

  function renderRateLimit() {
    const message = document.getElementById('rate-limit-message');
    message.classList.remove('hidden');

    const results = document.getElementById('algolia-hits-wrapper');
    results.classList.add('hidden');
  }

  function renderForbidden() {
    const message = document.getElementById('forbidden-message');
    message.classList.remove('hidden');

    const results = document.getElementById('algolia-hits-wrapper');
    results.classList.add('hidden');
  }
  // MISC HELPER FUNCTIONS
  // ==============
  function addOrRemoveSearchableAttributes(array, value) {
    const tmpArr = array;
    let index = array.indexOf(value);

    if (index === -1) {
      array.push(value);
    } else {
      array.splice(index, 1);
    }
    // Ensure at least one item is checked
    if (array.length < 2) { // grantee_state will always be there
      return tmpArr;
    } else {
      return array;
    }
  }

  function getLabel(item) {
    const obj = facets.filter(each => each.facet === item);
    return obj[0].label;
  }

  function formatIfRangeLabel(refinement) {
    if (refinement.attribute !== 'grant_amount') {
      return refinement.label;
    } else {
      return `${refinement.operator} $${numberHuman(refinement.value)}`;
    }
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

  // Lazy Load Iubenda script
  // =======================================================
  function createIubendaObserver() {
    let observer;
    let anchor = document.querySelector('footer');
    let config = {
      'rootMargin': '0px 0px',
      'threshold': 0.01,
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

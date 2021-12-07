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

  const elemsNavMore = document.getElementById('primary-navbar-dropdown-trigger');
  const optionsNavMore = {
    'container': 'primary-navbar',
    'constrainWidth': false,
  };
  M.Dropdown.init(elemsNavMore, optionsNavMore);

  const elemsCollapsible = document.querySelectorAll('.collapsible');
  M.Collapsible.init(elemsCollapsible);

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
    'onCloseEnd': function() {
      forceInputFocus();
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

  const searchClient = algoliasearch('KDWVSZVS1I', '{{ site.algolia_public_key_profiles }}');
  const algoliaIndex = 'grantmakers_io';
  const facets = [
    {
      'facet': 'city',
      'label': 'City',
    },
    {
      'facet': 'state',
      'label': 'State',
    },
    {
      'facet': 'assets',
      'label': 'Assets',
    },
    {
      'facet': 'grants_to_preselected_only',
      'label': 'Part XV Line 2 is Not Checked',
    },
  ];

  // Define toggle helpers
  const toggleParent = document.getElementById('search-toggle');
  const toggleSelect = toggleParent.querySelector('select');

  // Ensure initial toggle state set to grants search
  toggleSelect.value = 'profiles';

  // Toggle search type
  toggleSelect.onchange = function() {
    window.location.href = '/search/grants/';
  };

  /* ---------------------------- */
  /* Algolia configuration        */
  /* ---------------------------- */
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
            /*
            'restrict_to':
              indexUiState.configure &&
              indexUiState.configure.restrictSearchableAttributes &&
              indexUiState.configure.restrictSearchableAttributes.join('~'),
              */
            'city':
              indexUiState.refinementList &&
              indexUiState.refinementList.city &&
              indexUiState.refinementList.city.join('~'),
            'state':
              indexUiState.refinementList &&
              indexUiState.refinementList.state &&
              indexUiState.refinementList.state.join('~'),
            'exclude_grants_to_preselected_only':
              indexUiState.toggle &&
              indexUiState.toggle.grants_to_preselected_only,
            'assets':
              indexUiState.range &&
              indexUiState.range.assets &&
              indexUiState.range.assets.replace(':', '~'),
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
              /*
              'configure': {
                'restrictSearchableAttributes': routeState.restrict_to && routeState.restrict_to.split('~'),
              },
              */
              'refinementList': {
                'city': routeState.city && routeState.city.split('~'),
                'state': routeState.state && routeState.state.split('~'),
              },
              'toggle': {
                'grants_to_preselected_only': routeState.exclude_grants_to_preselected_only,
              },
              'range': {
                'assets': routeState.assets && routeState.assets.replace('~', ':'),
              },
              'page': routeState.page,
            },
          };
        },
      },
    },
  });

  // Define templates
  const templateHits = `{% include search/profiles/algolia-template-hits.html %}`;
  const templateStats = `{% include search/profiles/algolia-template-stats.html %}`;

  // Define default search parameters
  const defaultSearchableAttributes = [
    'organization_name',
    'city',
    'state',
    'ein',
    'people.name',
  ];
  const defaultAttributesToHighlight = [
    'organization_name',
    'city',
    'state',
    'ein',
    'people.name',
    'people.title',
  ];

  /* ---------------------------- */
  /* Connector - Configure Widget */
  /* ---------------------------- */
  const renderConfigure = (renderOptions, isFirstRender) => {
    const { refine, widgetParams } = renderOptions;
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
          refine({
            'restrictSearchableAttributes': addOrRemoveAttributes(true, 'restrictSearchableAttributes', widgetParams.searchParameters.restrictSearchableAttributes, attribute),
            'attributesToHighlight': addOrRemoveAttributes(true, 'attributesToHighlight', widgetParams.searchParameters.attributesToHighlight, attribute),
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
          'attributesToHighlight': defaultAttributesToHighlight,
        });
      });
      
      // Create event listener for individual checkbox selections
      searchDropdownItems.addEventListener('change', (e) => {
        const attribute = e.target.id;
        const isChecked = e.target.checked; // Note: this is the status AFTER the change
  
        // Show message if user checkbox selections result in invalid state
        // Note: EIN will always remain in searchable attributes
        // Thus array.length should at least be 2, not 1
        if (widgetParams.searchParameters.restrictSearchableAttributes.length === 2 && isChecked === false) {
          e.target.checked = !isChecked;
          M.Toast.dismissAll();
          M.toast({'html': 'At least one item must be selected'});
          return;
        }

        // Refine Algolia parameters
        // Note: EIN will always remain in searchable attributes
        // EIN "always searchable" is primarily a UI design decision
        refine({
          'restrictSearchableAttributes': addOrRemoveAttributes(false, 'restrictSearchableAttributes', widgetParams.searchParameters.restrictSearchableAttributes, attribute),
          // Add/remove people from highlighted attributes
          // Effectively hides people matches section from Mustache template
          'attributesToHighlight': addOrRemoveAttributes(false, 'attributesToHighlight', widgetParams.searchParameters.attributesToHighlight, attribute),
        });
        readyToSearchScrollPosition();
      });
    }

    // Adjust UI based on selections
    // Add or remove visual cue implying a customization was made
    // Change input placeholder text => default is somewhat redundant as also declared in searchBox widget
    const inputEl = document.querySelector('input[class="ais-SearchBox-input"]');
    const triggerEl = document.getElementById('search-box-dropdown-trigger').querySelector('.search-box-dropdown-trigger-wrapper');

    if (widgetParams.searchParameters.restrictSearchableAttributes.length === 5) {
      triggerEl.classList.remove('adjusted');
      inputEl.placeholder = 'Search by foundation name, location, trustees, or EIN';
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
        <button class="waves-effect btn blue-grey lighten-3 grey-text text-darken-3 truncate" ${createDataAttribtues(refinement)}><i class="material-icons right">remove_circle</i><small>${getLabel(item.label)}</small> ${formatIfRangeOrToggleLabel(refinement)} </button>
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

  search.addWidget(
    customCurrentRefinements({
      'container': document.querySelector('#ais-widget-current-refined-values'),
    }),
  );

  /* ----------------------- */
  /* Connector - Range Input */
  /* ----------------------- */
  // Create the render function
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
      const helperEl = event.target.nextElementSibling;
      let amount = parseFloat(event.target.value);
      let formattedAmount = `${amount ? '$' + numberHuman(amount) : ''}`;
      helperEl.textContent = formattedAmount;

      // UI reminder to click button
      const button = document.querySelector('.ais-RangeInput-submit');
      button.classList.remove('grey', 'lighten-3');
      button.classList.add('blue-grey', 'white-text');

      // Text reminder to click button
      const reminderEl = document.querySelector('.ais-Panel-footer');
      reminderEl.textContent = 'Don\'t forget to click Go';
    });

    widgetParams.container.querySelector('form').innerHTML = `
      <div id="range-input-min" class="label-wrapper">
        <label class="ais-RangeInput-label valign-wrapper">
          <input
            class="ais-RangeInput-input ais-RangeInput-input--min"
            type="number"
            name="min"
            placeholder="$0"
            value="${Number.isFinite(min) ? min : ''}"
          />
          <span class="label-helper">${Number.isFinite(min) ? '$' + numberHuman(min) : 'Min'}</span>
        </label>
      </div>
      <div id="range-input-max" class="label-wrapper">
        <label class="ais-RangeInput-label valign-wrapper">
          <input
            class="ais-RangeInput-input ais-RangeInput-input--max"
            type="number"
            name="max"
            placeholder="$0"
            value="${Number.isFinite(max) ? max : ''}"
          />
          <span class="label-helper">${Number.isFinite(max) ? '$' + numberHuman(max) : 'Max'}</span>
        </label>
      </div>
      <button class="ais-RangeInput-submit btn grey lighten-3" type="submit">Go</button>
    `;
  };

  // Create the custom range input widget
  const customRangeInput = instantsearch.connectors.connectRange(
    renderRangeInput,
  );

  // Create the panel widget wrapper
  const customRangeInputWithPanel = instantsearch.widgets.panel({
    'templates': {
      'header': 'Assets',
      'footer': '&nbsp;',
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
    // Assets handled via its own widget
    if (refinement.facet === 'assets') {
      return;
    }
    // Exclusionary handled via their own widget
    if (refinement.facet === 'grants_to_preselected_only') {
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
          'grey',
          'lighten-2',
        ],
        'body': 'card-content',
      },
    })(instantsearch.widgets.refinementList);
    
    /* Create desktop refinements */
    search.addWidget(
      refinementListWithPanel({
        'container': `#ais-widget-refinement-list--${refinement.facet}`,
        'attribute': refinement.facet,
        'limit': 8,
        'showMore': true,
        'showMoreLimit': 20,
        // 'searchable': true,
        'cssClasses': {
          'checkbox': 'filled-in',
          'labelText': 'small',
          'count': ['right', 'small'],
          'showMore': 'btn-flat small',
          'disabledShowMore': 'hidden',
          // 'selectedItem': ['grants-search-text'],
          // 'searchableRoot': 'ais-SearchBox-refinements',
          // 'searchableSubmit': 'hidden',
        },
        'templates': {
          'showMoreText': `{% include search/algolia-refinementList-showMore.html %}`,
        },
      }),
    );

    /* Create mobile refinements */
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
      }),
    );
  });

  /* -------------------- */
  /* Exclusionary Toggles */
  /* -------------------- */
  const toggleRefinementWithPanel = instantsearch.widgets.panel({
    'templates': {
      'header': 'Grant Guidelines <i class="material-icons right text-muted-max modal-trigger" href="#modal-grants-to-preselected" title="Click to learn more">info</i>',
    },
    hidden(options) {
      return options.results.nbHits === 0;
    },
    'cssClasses': {
      'root': 'card',
      'header': [
        'card-header',
      ],
      'body': 'card-content',
    },
  })(instantsearch.widgets.toggleRefinement);

  /* ---------------------------- */
  /* Instantiate all Widgets
  /* ---------------------------- */
  search.addWidgets([

    instantsearch.widgets.searchBox({
      'container': '#ais-widget-search-box',
      'placeholder': 'Search by foundation name, location, trustees, or EIN',
      'autofocus': true,
      'showSubmit': true,
      'showReset': true,
      'showLoadingIndicator': false,
      'queryHook': function(query, searchInstance) {
        // Query hook is called just before search is triggered
        const queryCleaned = checkForEIN(query);
        readyToSearchScrollPosition();
        searchInstance(queryCleaned);
      },
    }),

    customConfigure({
      'container': document.querySelector('#search-box-dropdown'),
      'searchParameters': {
        'hitsPerPage': 8,
        'restrictSearchableAttributes': defaultSearchableAttributes,
        'attributesToHighlight': defaultAttributesToHighlight,
      },
    }),

    instantsearch.widgets.poweredBy({
      'container': '#powered-by',
    }),

    instantsearch.widgets.hits({
      'container': '#ais-widget-hits',
      'templates': {
        'item': templateHits,
        empty(results) {
          let params = results._state.restrictSearchableAttributes;
          if (params.length === defaultSearchableAttributes.length) {
            paramsText = `across foundation names, locations, trustees, and EINs`; // eslint-disable-line no-undef
          } else {
            paramsText = `and narrowed Fields to Search`; // eslint-disable-line no-undef
          }
          const templateHitsEmpty = `{% include search/profiles/algolia-template-hits-empty.html %}`;
          return templateHitsEmpty;
        },
      },
      'cssClasses': {
        'list': 'row',
        'item': ['col', 's12'],
      },
      transformItems(items) {
        return items.map(item => ({
          ...item,
          'ein_formatted': item.ein.replace(/(\d{2})(\d{7})/, '$1-$2'),
          'grant_median': `$${item.grant_median.toLocaleString(undefined, {
            'minimumFractionDigits': 0,
            'maximumFractionDigits': 0,
          })}`,
          'grant_min': `$${item.grant_min.toLocaleString()}`,
          'grant_max': `$${item.grant_max.toLocaleString()}`,
          'grant_count': `${item.grant_count.toLocaleString()}`,
          'grant_count_only_one': item.grant_count === 1 ? true : false,
          'assets': `$${numberHuman(item.assets, 0)}`,
          'hits_people': hitsPeople(item._highlightResult.people),
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
      'attribute': 'assets',
    }),

    toggleRefinementWithPanel({
      'container': '#ais-widget-refinement-list--grants_to_preselected_only',
      'attribute': 'grants_to_preselected_only',
      'on': false,
      'templates': {
        'labelText': 'Exclude funders that do not accept unsolicited requests for funds',
      },
      'cssClasses': {
        'checkbox': 'filled-in',
        'labelText': 'small',
      },
    }),

    instantsearch.widgets.clearRefinements({
      'container': '#ais-widget-clear-all',
      'cssClasses': {
        'button': ['btn grantmakers white-text waves-effect waves-light'],
      },
      'templates': {
        'resetLabel': 'Clear filters',
      },
    }),

    instantsearch.widgets.clearRefinements({
      'container': '#ais-widget-mobile-clear-all',
      'cssClasses': {
        'button': ['btn waves-effect waves-light'],
        'disabledButton': 'hidden',
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
    // Search toggle
    initSelect();
  });

  search.on('render', function() {
    // Destory any existing tooltips
    destroyTooltips();
    // Init Materialize items
    initTooltips();
    initModals();
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
    console.log(e);
  });

  /* ---------------------------- */
  /* Start Search
  /* ---------------------------- */
  search.start();

  /* ---------------------------- */
  /* Materialize init helpers
  /* ---------------------------- */
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

  function destroyTooltips() {
    // Note: Cannot use Materialize tooltip destroy() method due to apparent bug in v1.0.0
    // Note: This likely to be brittle if swtiching to Vue due to async
    const elems = document.getElementsByClassName('material-tooltip');
    while (elems.length > 0) {
      elems[0].parentNode.removeChild(elems[0]);
    }
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

  // GOOGLE ANALYTICS EVENTS
  // =======================
  let gaCheck = window[window['GoogleAnalyticsObject'] || 'ga']; // eslint-disable-line dot-notation

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
        'eventCategory': 'Profiles Search Events',
        'eventAction': 'Profiles Search No Results CTA Click',
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
  function addOrRemoveAttributes(isOnly, type, array, attribute) {
    // TODO lots of opportunities to DRY this up
    // If attribute is 'city', need to also add/remove 'state'
    // If attribute is 'people.name', need to add/remove 'people.title from attributes to highlight
    const unchangedArray = array;
    let index = array.indexOf(attribute);

    // Handle "only" link clicks
    // EIN will always be included
    if (isOnly) {
      // City attribute is combined with State
      if (attribute === 'city') {
        return ['ein', 'city', 'state'];
      // People attribute requires special handling
      // Need to add title to highlight attributes, but not search restrictions
      } else if (attribute === 'people.name') {
        if (type === 'attributesToHighlight') {
          return ['ein', 'people.name', 'people.title'];
        } else {
          return ['ein', 'people.name'];
        }
      // Anything else, just return it
      } else if (attribute === 'organization_name') {
        return ['ein', 'organization_name'];
      }
    }

    // If the attribute is not already in the array, add it
    if (index === -1) {
      array.push(attribute);
      // City attribute requires adding State
      if (attribute === 'city') {
        array.push('state');
      }
      // People attribute requires adding Title, but only to highlight attributes
      if (type === 'attributesToHighlight' && attribute === 'people.name') {
        array.push('people.title');
      }
    // If the attribute already exists in the array, remove it
    } else {
      array.splice(index, 1);
      // City requires removing State as well
      if (attribute === 'city') {
        let indexState = array.indexOf('state');
        array.splice(indexState, 1);
      }
      // People attribute requires removing Title, but only from highlight attributes
      if (type === 'attributesToHighlight' && attribute === 'people.name') {
        let indexPeople = array.indexOf('people.title');
        array.splice(indexPeople, 1);
      }
    }

    // Ensure at least one item is checked
    if (array.length < 2) { // ein will always be there
      return unchangedArray;
    } else {
      return array;
    }
  }

  function forceInputFocus() {
    document.querySelector('.ais-SearchBox-input').focus();
  }

  function hitsPeople(people) {
    if (!people) {
      return [];
    }
    
    const arr = [];
    people.map(person => {
      const obj = {};
      if (person.name && person.name.matchLevel === 'partial' || person.name && person.name.matchLevel === 'full') {
        obj.name = person.name.value;
        obj.title = person.title ? person.title.value : '';
        arr.push(obj);
      }
    });
    return arr;
  }

  function getLabel(item) {
    const obj = facets.filter(each => each.facet === item);
    return obj[0].label;
  }

  function formatIfRangeOrToggleLabel(refinement) {
    if (refinement.attribute === 'assets') {
      return `${refinement.operator} $${numberHuman(refinement.value)}`;
    } else if (refinement.attribute === 'grants_to_preselected_only') {
      return '';
    } else {
      return refinement.label;
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

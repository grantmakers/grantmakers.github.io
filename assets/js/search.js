$(document).ready(function() {
  'use strict';

  // INITIALIZATION
  // ==============

  // Replace with your own values
  var APPLICATION_ID = 'KDWVSZVS1I';
  var SEARCH_ONLY_API_KEY = 'ce4d584b0de36ca3f8b4727fdb83c658';
  var INDEX_NAME = 'filings_pf_grouped_by_ein';
  var PARAMS = {
    hitsPerPage: 10,
    maxValuesPerFacet: 8,
    facets: ['GrantMedian'],
    disjunctiveFacets: ['City', 'State'],
    index: INDEX_NAME
  };
  var FACETS_SLIDER = [];
  var FACETS_ORDER_OF_DISPLAY = ['City', 'State', 'isLikelyStaffed', 'hasGrants', 'hasWebsite'];
  var FACETS_LABELS = {'GrantMedian': 'Grant Size', 'City': 'City', 'State': 'State', 'isLikelyStaffed': 'Staff', 'hasGrants': 'Grants', 'hasWebsite': 'Website'};

  // Client + Helper initialization
  var algolia = algoliasearch(APPLICATION_ID, SEARCH_ONLY_API_KEY);
  var algoliaHelper = algoliasearchHelper(algolia, INDEX_NAME, PARAMS);

  // DOM BINDING
  var $searchInput = $('#search-input');
  var $searchInputIcon = $('#search-input-icon');
  var $main = $('main');
  var $sortBySelect = $('#sort-by-select');
  var $hits = $('#hits');
  var $stats = $('#stats');
  var $facets = $('#facets');
  var $clear = $('#clear');
  var $pagination = $('#pagination');

  // Hogan templates binding
  var hitTemplate = Hogan.compile($('#hit-template').text());
  var statsTemplate = Hogan.compile($('#stats-template').text());
  var facetTemplate = Hogan.compile($('#facet-template').text());
  var sliderTemplate = Hogan.compile($('#slider-template').text());
  var clearTemplate = Hogan.compile($('#clear-template').text());
  var paginationTemplate = Hogan.compile($('#pagination-template').text());
  var noResultsTemplate = Hogan.compile($('#no-results-template').text());



  // SEARCH BINDING
  // ==============

  // Input binding
  $searchInput
  .on('input propertychange', function(e) {
    //var query = e.currentTarget.value;
    var query = e.currentTarget.value.replace('-',''); //Handle EINs entered with a hyphen
    if ($('#search-input').val().length > 0) {
      $searchInputIcon.removeClass('empty');
    } else {
      $searchInputIcon.addClass('empty');
    }
    
    //toggleIconEmptyInput(query);
    algoliaHelper.setQuery(query).search();
  })
  .focus();

  // Search errors
  algoliaHelper.on('error', function(error) {
    console.log(error);
  });

  // Update URL
  algoliaHelper.on('change', function(state) {
    setURLParams();
  });

  // Search results
  algoliaHelper.on('result', function(content, state) {
    renderStats(content);
    renderHits(content);
    renderFacets(content, state);
    bindSearchObjects(state);
    renderPagination(content);
    handleNoResults(content);
    $.material.init(); //Initialize Material Design ripples
    $('[data-toggle="tooltip"], [rel="tooltip"]').tooltip(); //Enable tooltips
  });

  // Initial search
  initFromURLParams();
  algoliaHelper.search();



  // RENDER SEARCH COMPONENTS
  // ========================

  function renderStats(content) {
    var stats = {
      nbHits: content.nbHits,
      nbHits_plural: content.nbHits !== 1,
      processingTimeMS: content.processingTimeMS
    };
    $stats.html(statsTemplate.render(stats));

    $('.format-number').each(function(){
      var n = $(this).text();
      var formattedNumber = formatter.format(n);
      $(this).text(formattedNumber);
    });
    

  }

  function renderHits(content) {
    $hits.html(hitTemplate.render(content));

    //Format EIN results
    $('.hit-ein').each(function(){
      var string = $(this).text();
      $(this).text(string.substring(0,2) + '-' + string.substring(2,9));
    });

    //Format Website results to provide proper href
    $('.hit-website').each(function(){

      var site = $(this).data('website');
           
      //Check if properly formatted url
      if (site && site.match(/(?:(?:https?):\/\/)/i)) {
        site = site;
        $(this).attr('href', site);
      } else { 
        //Alert if malformed url
        $(this).removeAttr('href');
        $(this).bind('click', function(){
          alert(
            'Hmm, looks like the website url is not properly formatted.' + 
            '\n\n' + site + '\n\n'
          );
        });
      }
    });

    //Format dollar amounts and currency figures
    $('.hit-format-currency').each(function(){
      var n = $(this).text();
      var formattedNumber = '$' + formatter.format(n);
      $(this).text(formattedNumber);
    });

    //Format numbers
    $('.hit-format-number').each(function(){
      var n = $(this).text();
      var formattedNumber = formatter.format(n);
      $(this).text(formattedNumber);
    });

    //Progress Bars
    $('.progress-bar-assets').each(function(){
      var assets = $(this).attr('data-assets');
      var width = 0;
      width = assets / 100000000 * 100;
      $(this).css('width', width + '%');
      $(this).children('.sr-only').text('Total Assets = ' + assets);
    });

    $('.progress-bar-grants').each(function(){
      var grants = $(this).attr('data-grants');
      var barMax = 100000;
      var width = 0;

      width = grants / barMax * 100;
      $(this).css('width', width + '%');
      $(this).children('.sr-only').text('Total Grants = ' + grants);
    });

    //Filings
    $('.js-filings').each(function () {
      if (window.localStorage && window.localStorage.tax_filings_preference){
        addFilingURL($(this));
      } else {
        $(this).attr('data-toggle', 'modal');
        $(this).attr('data-target', '.modal-tax-filings');
      }
    });
    
  }


  function renderFacets(content, state) {
    var facetsHtml = '';
    for (var facetIndex = 0; facetIndex < FACETS_ORDER_OF_DISPLAY.length; ++facetIndex) {
      var facetName = FACETS_ORDER_OF_DISPLAY[facetIndex];
      var facetResult = content.getFacetByName(facetName);
      if (!facetResult) continue;
      var facetContent = {};

      // Slider facets
      if ($.inArray(facetName, FACETS_SLIDER) !== -1) {
        facetContent = {
          facet: facetName,
          title: FACETS_LABELS[facetName] || facetName 
        };
        facetContent.min = facetResult.stats.min;
        facetContent.max = facetResult.stats.max;
        facetContent.min = 0;
        facetContent.max = 1000000;
        var from = state.getNumericRefinement(facetName, '>=') || facetContent.min;
        var to = state.getNumericRefinement(facetName, '<=') || facetContent.max;
        facetContent.from = Math.min(facetContent.max, Math.max(facetContent.min, from));
        facetContent.to = Math.min(facetContent.max, Math.max(facetContent.min, to));
        facetsHtml += sliderTemplate.render(facetContent);
      }

      // Conjunctive + Disjunctive facets
      else {
        facetContent = {
          facet: facetName,
          title: FACETS_LABELS[facetName] || facetName,
          values: content.getFacetValues(facetName, {sortBy: ['isRefined:desc', 'count:desc']}),
          disjunctive: $.inArray(facetName, PARAMS.disjunctiveFacets) !== -1
        };
        facetsHtml += facetTemplate.render(facetContent);
        $clear.html(clearTemplate.render());
      }
    }
    $facets.html(facetsHtml);
    $('[data-facet="Filings.TaxPeriod"] .facet-value').each(function(){
      var string = $.trim($(this).text());
      $(this).html(string.substring(0,4) + '-' + string.substring(4,6));
    });

    $('.format-number-facet').each(function(){
      var n = $(this).text();
      var formattedNumber = formatter.format(n);
      $(this).text(formattedNumber);
    });

    //Adjust 'Staffed' label
    $('[data-facet="isLikelyStaffed"][data-value="true"] .facet-value').text('Full-Time');
    $('[data-facet="isLikelyStaffed"][data-value="false"] .facet-value').text('Part-Time | None');
    //$('[data-facet="isLikelyStaffed"][data-value="false"]').hide();

    //Add tooltips
    $('[data-facet-tooltip="isLikelyStaffed"]').
      attr('data-toggle', 'tooltip').
      attr('data-placement', 'top').
      attr('data-html', 'true').
      attr('title', '<b>Full-Time</b><br>One staff member working 35+ hours with $50k+ salary').
      tooltip();
    $('[data-facet-tooltip="GrantMedian"]').
      attr('data-toggle', 'tooltip').
      attr('title', '').
      attr('data-original-title', 'Median grant size for latest tax year').
      attr('data-placement', 'top').
      tooltip();
  }

  function bindSearchObjects(state) {
    function createOnFinish(facetName) {
      return function onFinish(data) {
          var lowerBound = state.getNumericRefinement(facetName, '>=');
          lowerBound = lowerBound && lowerBound[0] || data.min;
          if (data.from !== lowerBound) {
            algoliaHelper.removeNumericRefinement(facetName, '>=');
            algoliaHelper.addNumericRefinement(facetName, '>=', data.from).search();
          }
          var upperBound = state.getNumericRefinement(facetName, '<=');
          upperBound = upperBound && upperBound[0] || data.max;
          if (data.to !== upperBound) {
            algoliaHelper.removeNumericRefinement(facetName, '<=');
            algoliaHelper.addNumericRefinement(facetName, '<=', data.to).search();
          }
        };
    }
    
    // Bind Sliders
    for (var facetIndex = 0; facetIndex < FACETS_SLIDER.length; ++facetIndex) {
      var facetName = FACETS_SLIDER[facetIndex];
      var slider = $('#' + facetName + '-slider');
      var sliderOptions = {
        type: 'double',
        //values: [0, 1000000, 100000000, 1000000000, 50000000000],
        grid: true,
        min: slider.data('min'),
        max: slider.data('max'),
        from: slider.data('from'),
        to: slider.data('to'),
        keyboard: true,
        keyboard_step: 0.5,
        prettify_enabled: true,
        prettify_separator: ",",
        force_edges: true,
        prefix: "$",
        onFinish: createOnFinish(facetName)
      };
      slider.ionRangeSlider(sliderOptions);
    }
  }

  function renderPagination(content) {
    var pages = [];
    if (content.page > 3) {
      pages.push({current: false, number: 1});
      pages.push({current: false, number: '...', disabled: true});
    }
    for (var p = content.page - 3; p < content.page + 3; ++p) {
      if (p < 0 || p >= content.nbPages) continue;
      pages.push({current: content.page === p, number: p + 1});
    }
    if (content.page + 3 < content.nbPages) {
      pages.push({current: false, number: '...', disabled: true});
      pages.push({current: false, number: content.nbPages});
    }
    var pagination = {
      pages: pages,
      prev_page: content.page > 0 ? content.page : false,
      next_page: content.page + 1 < content.nbPages ? content.page + 2 : false
    };
    $pagination.html(paginationTemplate.render(pagination));
  }



  // NO RESULTS
  // ==========

  function handleNoResults(content) {
    if (content.nbHits > 0) {
      $main.removeClass('no-results');
      return;
    }
    $main.addClass('no-results');

    var filters = [];
    var i;
    var j;
    for (i in algoliaHelper.state.facetsRefinements) {
      filters.push({
        class: 'toggle-refine',
        facet: i, facet_value: algoliaHelper.state.facetsRefinements[i],
        label: FACETS_LABELS[i] + ': ',
        label_value: algoliaHelper.state.facetsRefinements[i]
      });
    }
    for (i in algoliaHelper.state.disjunctiveFacetsRefinements) {
      for (j in algoliaHelper.state.disjunctiveFacetsRefinements[i]) {
        filters.push({
          class: 'toggle-refine',
          facet: i,
          facet_value: algoliaHelper.state.disjunctiveFacetsRefinements[i][j],
          label: FACETS_LABELS[i] + ': ',
          label_value: algoliaHelper.state.disjunctiveFacetsRefinements[i][j]
        });
      }
    }
    for (i in algoliaHelper.state.numericRefinements) {
      for (j in algoliaHelper.state.numericRefinements[i]) {
        filters.push({
          class: 'remove-numeric-refine',
          facet: i,
          facet_value: j,
          label: FACETS_LABELS[i] + ' ',
          label_value: j + ' ' + algoliaHelper.state.numericRefinements[i][j]
        });
      }
    }
    $hits.html(noResultsTemplate.render({query: content.query, filters: filters}));
  }



  // EVENTS BINDING
  // ==============

  var scrollAnchor = $('.section-results').offset().top - 50;
  var isMobile = window.matchMedia('only screen and (max-width: 768px)');

  $searchInput.on('focusin', function(e) { //HACK Mobile Safari
    if (isMobile.matches) {
      e.preventDefault();
      e.stopPropagation();
      $('html, body').animate({scrollTop: scrollAnchor}, '500', 'swing');
      $('.navbar-search').addClass('safari-scroll-hack');
    }
  });
  $searchInput.on('focusout', function(e) { //HACK Mobile Safari
    if (isMobile.matches) {
      e.preventDefault();
      e.stopPropagation();
      $('html, body').animate({scrollTop: scrollAnchor}, '500', 'swing');
      $('.navbar-search').removeClass('safari-scroll-hack');
    }
  });
  $(document).on('input', $searchInput, function(e) {
    if (!isMobile.matches) {
      $('html, body').animate({scrollTop: scrollAnchor}, '500', 'swing');
    }
  });
  $(document).on('click', '.toggle-refine', function(e) {
    e.preventDefault();
    algoliaHelper.toggleRefine($(this).data('facet'), $(this).data('value')).search();
  });
  $(document).on('click', '.go-to-page', function(e) {
    e.preventDefault();
    $('html, body').animate({scrollTop: scrollAnchor}, '500', 'swing');
    algoliaHelper.setCurrentPage(+$(this).data('page') - 1).search();
  });
  $sortBySelect.on('change', function(e) {
    e.preventDefault();
    algoliaHelper.setIndex(INDEX_NAME + $(this).val()).search();
  });
  $searchInputIcon.on('click', function(e) {
    e.preventDefault();
    $searchInput.val('').keyup().focus();
    algoliaHelper.setQuery('').search();
    $searchInputIcon.addClass('empty');
  });
  $(document).on('click', '.remove-numeric-refine', function(e) {
    e.preventDefault();
    algoliaHelper.removeNumericRefinement($(this).data('facet'), $(this).data('value')).search();
  });
  $(document).on('click', '.clear-all', function(e) {
    e.preventDefault();
    $searchInput.val('').focus();
    algoliaHelper.setQuery('').clearRefinements().search();
  });
  $(document).on('click', '.clear-search', function(e) {
    e.preventDefault();
    $searchInput.val('').focus();
    algoliaHelper.setQuery('').search();
  });
  $(document).on('click', '.clear-refinements', function(e) {
    e.preventDefault();
    $searchInput.focus();
    algoliaHelper.setQuery('').clearRefinements().search();
  });
  $(document).on('click', '.try-it li a', function(e) {
    e.preventDefault();
    var target = $(this).text();
    $searchInput.val(target.replace('-','')); //Handle hyphen in EIN
    algoliaHelper.setQuery(target.replace('-','')).search();
    $('html, body').animate({scrollTop: scrollAnchor}, '500', 'swing');
  });
  $(document).on('click', '#tab-detail a', function(e) {
    $('[data-pane="detail"]').addClass('active').css('display', 'block');
  });
  $(document).on('click', '#tab-summary a', function(e) {
    $('[data-pane="detail"]').removeClass('active').css('display', 'none');
  });



  // URL MANAGEMENT
  // ==============

  function initFromURLParams() {
    var URLString = window.location.search.slice(1);
    var URLParams = algoliasearchHelper.url.getStateFromQueryString(URLString);
    var stateFromURL = Object.assign({}, PARAMS, URLParams);
    $searchInput.val(stateFromURL.query);
    $sortBySelect.val(stateFromURL.index.replace(INDEX_NAME, ''));
    algoliaHelper.overrideStateWithoutTriggeringChangeEvent(stateFromURL);
  }

  var URLHistoryTimer = Date.now();
  var URLHistoryThreshold = 700;
  function setURLParams() {
    var trackedParameters = ['attribute:*'];
    if (algoliaHelper.state.query.trim() !== '')  trackedParameters.push('query');
    if (algoliaHelper.state.page !== 0)           trackedParameters.push('page');
    if (algoliaHelper.state.index !== INDEX_NAME) trackedParameters.push('index');

    var URLParams = window.location.search.slice(1);
    var nonAlgoliaURLParams = algoliasearchHelper.url.getUnrecognizedParametersInQueryString(URLParams);
    var nonAlgoliaURLHash = window.location.hash;
    var helperParams = algoliaHelper.getStateAsQueryString({filters: trackedParameters, moreAttributes: nonAlgoliaURLParams});
    if (URLParams === helperParams) return;

    var now = Date.now();
    if (URLHistoryTimer > now) {
      window.history.replaceState(null, '', '?' + helperParams + nonAlgoliaURLHash);
    } else {
      window.history.pushState(null, '', '?' + helperParams + nonAlgoliaURLHash);
    }
    URLHistoryTimer = now+URLHistoryThreshold;
  }

  window.addEventListener('popstate', function() {
    initFromURLParams();
    algoliaHelper.search();
  });



  // HELPER METHODS
  // ==============

  function toggleIconEmptyInput(query) {
    $searchInputIcon.toggleClass('empty', query.trim() !== '');
  }

  function addFilingURL(el){
    var ein = el.data('ein');
    var einShort = ein.toString().substring(0, 3);
    var taxPeriod = el.data('tax-period');
    var url;
    var urlXML = el.data('url-xml');
    // Foundation Center: http://990s.foundationcenter.org/990pf_pdf_archive/272/272624875/272624875_201412_990PF.pdf
    var urlPDF = 'http://990s.foundationcenter.org/990pf_pdf_archive/' + 
                 einShort + '/' + 
                 ein + '/' +
                 ein + '_' +
                 taxPeriod + '_990PF.pdf';
    el.attr('data-url-pdf', urlPDF);

    var preference = localStorage.getItem('tax_filings_preference');
    if (preference == 'pdf') {
      url = urlPDF;
    } else if (preference == 'xml') {
      url = urlXML;
    }
    el.attr('href', url);
  }

  function removeModalsIfFilingsPreferenceSet() {
    $('.js-filings').each(function(){
      $(this).removeAttr('data-toggle');
      $(this).removeAttr('data-target');
    });
  }

  //Abbreviate large numbers and currency
  function abbreviateNumber(num, fixed) {
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

  // FORMATTING
  // ==========

  //Format numbers and currency
  var formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
  });

  //Hide footer tip on scroll
  $(window).scroll(function() {
    if ($(this).scrollTop()>0) {
      $('#footer-alert').fadeOut();
     } else {
      $('#footer-alert').fadeIn();
     }
  });

});

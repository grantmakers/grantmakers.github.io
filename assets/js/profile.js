$(document).ready(function() {
  'use strict';

  // Enable Material Design ripples and Bootstrap components
  // =======================================================

  $.material.init(); //Initialize Material Design ripples
  $('[data-toggle="tooltip"], [rel="tooltip"]').tooltip(); //Enable tooltips

  // SMOOTH SCROLL
  // =============
  // simple smooth scrolling for bootstrap scroll spy nav
  // credit http://stackoverflow.com/questions/14804941/how-to-add-smooth-scrolling-to-bootstraps-scroll-spy-function

  $('.navbar-nav li a[href^="#"], .scrolly').on('click', function(e) {
     // prevent default anchor click behavior
     e.preventDefault();

     // store hash
     var hash = this.hash;

     // animate
     $('html, body').animate({
         scrollTop: $(this.hash).offset().top - 120
       }, 300, function(){

         // when done, add hash to url
         // (default click behaviour)
         window.location.hash = hash;
       });

  });

  // FORMATTING
  // ==========

  //Format numbers and currency
  var formatCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 0
  });

  //Format numbers and currency
  var formatCurrencyList = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    currency: 'USD',
    //currencyDisplay: 'symbol',
    minimumFractionDigits: 0
  });

  //Format numbers and currency
  var formatNumber = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }); 

  //Format dollar amounts and currency figures
  $('.format-currency').each(function(){
    var n = $(this).text();
    var formattedNumber = formatCurrency.format(n);
    $(this).text(formattedNumber);
  });

  //Format dollar amounts and currency figures
  $('.format-currency-list').each(function(){
    var n = $(this).text();
    var formattedNumber = formatCurrencyList.format(n);
    $(this).text(formattedNumber);
  });

  //Format numbers
  $('.format-number').each(function(){
    var n = $(this).text();
    var formattedNumber = formatNumber.format(n);
    $(this).text(formattedNumber);
  });

  /*
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
  */


  //Filings
  $('.js-filings-pdf').each(function () {
      addFilingURL($(this));
    });
  
  function addFilingURL(el){
    var ein = el.data('ein');
    var einShort = ein.toString().substring(0, 3);
    var taxPeriod = el.data('tax-period');
    // Foundation Center: http://990s.foundationcenter.org/990pf_pdf_archive/272/272624875/272624875_201412_990PF.pdf
    var urlPDF = 'http://990s.foundationcenter.org/990pf_pdf_archive/' + 
                 einShort + '/' + 
                 ein + '/' +
                 ein + '_' +
                 taxPeriod + '_990PF.pdf';
    el.attr('data-url-pdf', urlPDF);
    el.attr('href', urlPDF);
  }

  /*
  function removeModalsIfFilingsPreferenceSet() {
    $('.js-filings').each(function(){
      $(this).removeAttr('data-toggle');
      $(this).removeAttr('data-target');
    });
  }
  */

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

});

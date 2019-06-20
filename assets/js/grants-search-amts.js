// Stashing these here
// Will integrate in future update

/* Helpers */
const rangeMinInput = document.getElementsByClassName('ais-RangeInput-input--min')[0];
const rangeMaxInput = document.getElementsByClassName('ais-RangeInput-input--max')[0];

const rangeMinTarget = document.getElementById('range-input-helper-min');
const rangeMaxTarget = document.getElementById('range-input-helper-max');

rangeMinInput.addEventListener('input', function() {
  const num = parseFloat(this.value);
  // const num = numberHuman(this.value);
  if (num > 999) {
    rangeMinTarget.innerHTML = numberHuman(num);
  } else {
    rangeMinTarget.innerHTML = '';
  }
});
// TODO Dry it up
rangeMaxInput.addEventListener('input', function() {
  const num = parseFloat(this.value);
  // const num = numberHuman(this.value);
  if (num > 999) {
    rangeMaxTarget.innerHTML = numberHuman(num);
  } else {
    rangeMaxTarget.innerHTML = '';
  }
});

/* Create grant amount refinement :: Range Input */
const rangeInputWithPanel = instantsearch.widgets.panel({
  'templates': {
    'header': 'Grant Size',
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
})(instantsearch.widgets.rangeInput);

search.addWidget(
  rangeInputWithPanel({
    'container': '#ais-widget-range-input',
    'attribute': 'grant_amount',
    'min': 0,
    'cssClasses': {
      'input': 'input-algolia',
    },
  })
);

/* Create grant amount refinement :: Range Slider */
const rangeSliderWithPanel = instantsearch.widgets.panel({
  'templates': {
    'header': 'Grant Size',
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
})(instantsearch.widgets.rangeSlider);

search.addWidget(
  rangeSliderWithPanel({
    'container': '#ais-widget-range-slider',
    'attribute': 'grant_amount',
    // Optional parameters
    'min': 0,
    'tooltips': {
      'format': function(rawValue) {
        return '$' + Math.round(rawValue).toLocaleString();
      },
    },
    'step': 1000,
    'pips': false,
  })
);

/* Create grant amount refinement :: Range Slider */
const numericMenuWithPanel = instantsearch.widgets.panel({
  'templates': {
    'header': 'Grant Size',
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
})(instantsearch.widgets.numericMenu);

search.addWidget(
  numericMenuWithPanel({
    'container': '#ais-widget-numeric-menu',
    'attribute': 'grant_amount',
    // 'items': object[],
    'items': [
      { 'label': 'All' },
      { 'label': 'Less than $1K', 'end': 1000 },
      { 'label': 'Between $1K - $10K', 'start': 1000, 'end': 10000 },
      { 'label': 'Between $10K - $100K', 'start': 10000, 'end': 100000 },
      { 'label': 'Between $100K - $1M', 'start': 10000, 'end': 100000 },
      { 'label': 'More than $1M', 'start': 1000000 },
    ],
  })
);

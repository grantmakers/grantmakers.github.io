// Splits the main algolia.json to allow manual upload of file via Algolia GUI
const fs = require('fs');
const async = require('async');
const _ = require('lodash');

fs.readFile('algolia.json', 'utf8', function(err, json) {
  if (err) {
    return console.log(err);
  }
  const data = _.chunk(JSON.parse(json), [size = 20000]);
  let id = 0;
  return async.each(data, function(batch) {
    id ++;
    const doc = JSON.stringify(batch, null, 4);
    fs.writeFileSync('algolia' + id + '.json', doc, 'utf-8');
  }, function(error) {
    console.log(error);
  });
});

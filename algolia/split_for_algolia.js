// Splits the main algolia.json to allow manual upload of file via Algolia GUI
var fs = require('fs');
var async = require('async');
var _ = require('lodash');

fs.readFile('algolia.json', 'utf8', function (err, json) {
  if (err) {
    return console.log(err);
  } 
  var data = _.chunk(JSON.parse(json), [size=20000]);
  var id = 0;
  async.each(data, function(batch, callback) {
    id ++;
    var doc = JSON.stringify(batch, null, 4);
    fs.writeFileSync('algolia' + id + '.json', doc, 'utf-8');
  }, function(err){
        console.log(err);
  });
});
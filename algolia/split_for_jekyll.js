// Splits the Algolia JSON file into individual JSON files per EIN
var fs = require('fs');

fs.readFile('algolia_all_fields.json', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var array = JSON.parse(data);
  array.forEach(function(item, index) {
    var ein = item.EIN;

    var doc = JSON.stringify(item, null, 4);

    fs.writeFileSync('../_json/' + ein + '.json', doc, 'utf-8');
    console.log('File saved for ' + ein);
  });
  
});
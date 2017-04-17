// Splits the aggregated JSON file into individual JSON files per EIN
// Files are then available to Jekyll in the _data folder
var fs = require('fs');

fs.readFile('aggregated.json', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var array = JSON.parse(data);
  array.forEach(function(item, index) {
    var ein = item.EIN;

    var doc = JSON.stringify(item, null, 4);

    fs.writeFileSync('EIN/' + ein + '.json', doc, 'utf-8');
    console.log('File saved for ' + ein);
  });
  
});
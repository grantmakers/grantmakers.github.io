// Splits the Algolia JSON file into individual markdown files
// Files are then accessible to Jekyll via a profiles collection
var fs = require('fs');

fs.readFile('algolia.json', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var array = JSON.parse(data);
  array.forEach(function(item, index) {
    var ein = item.EIN;

    var doc = '---\n ' + 
    JSON.stringify(item, null, 4)  + '\n' +
    '---';

    fs.writeFileSync('../_profiles/' + ein + '.md', doc, 'utf-8');
    console.log('File saved for ' + ein);
  });
  
});
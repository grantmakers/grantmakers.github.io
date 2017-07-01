// Splits the aggregated JSON file into individual JSON files per EIN
// Files are then available to Jekyll in the _data folder
const fs = require('fs');

fs.readFile('aggregated.json', 'utf8', function(err, data) {
  if (err) {
    console.log(err);
  }
  const array = JSON.parse(data);
  array.forEach(function(item) {
    const ein = item.EIN;

    const doc = JSON.stringify(item, null, 4);

    fs.writeFileSync('EIN/' + ein + '.json', doc, 'utf-8');
    console.log('File saved for ' + ein);
  });
});

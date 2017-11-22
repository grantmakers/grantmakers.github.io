// Make a duplicate of the 'aggregated' collection and name it 'algolia'
// mongo irs reduce_for_algolia.js
db.aggregated.aggregate([ { '$match': {} }, { '$out': 'algolia' } ]);

// Remove grants
let count = 0;
db.algolia.find().forEach(function(obj) {
  ++count;

  // Convert dates strings to timestamps
  const convertDateGrantmakers = Date.parse(obj.last_updated_grantmakers) / 1000;
  const convertDateIrs = Date.parse(obj.last_updated_irs) / 1000;

  // Update documents
  db.algolia.update(
    obj,
    {
      // Remove grants
      '$unset': { 'grants': '' },
      '$set': {
         // Add Algolia objectID
        'objectID': obj.ein,
        // Insert converted dates
        'last_updated_grantmakers': convertDateGrantmakers,
        'last_updated_irs': convertDateIrs,
      },
    },
    function(err, result) {
      if (err) {
        console.log(err);
        print('*****MongoDB update error*****');
        print('EIN: ' + ein);
        return;
      }
      if (result) {
        print('EIN ' + ein + ' updated');
      } else {
        print('*****MongoDB update error*****');
        print('EIN: ' + ein);
      }
    }
  );
});

// TODO Sync with Algolia here

print('Count: ' + count);

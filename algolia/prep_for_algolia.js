// Make a duplicate of the 'aggregated' collection and name it 'algolia'
// mongo irs reduce_for_algolia.js
db.aggregated.aggregate([ { '$match': {} }, { '$out': 'algolia' } ]);

// Remove grants
let count = 0;
db.algolia.find().forEach(function(obj) {
  ++count;

  // Convert dates to strings
  const convertDate = parseInt((new Date(obj.last_updated).getTime() / 1000).toFixed(0), 10);
  const convertDateIrs = parseInt((new Date(obj.last_updated_irs).getTime() / 1000).toFixed(0), 10);

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
        'last_updated': convertDate,
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

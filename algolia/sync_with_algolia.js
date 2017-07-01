const algoliasearch = require('algoliasearch');
const secrets = require('./secrets');

// Algolia
const appID = secrets.algolia.appID;
const apiKey = secrets.algolia.apiKey;
const indexName = secrets.algolia.indexName;
const client = algoliasearch(appID, apiKey);
const index = client.initIndex(indexName);

// MongoDB
const Db = require('mongodb').Db;
const Server = require('mongodb').Server;
const db = new Db('irs', new Server('127.0.0.1', 27017));

// Open a db connection
db.open(function(e) {
  if (e) throw new Error(e);

  // Get the collection
  db.collection('algolia', function(err, collection) {
    if (err) throw new Error(err);

    // Get the collection count
    collection.count()
      .then(function(count) {
        const collectionCount = count;
        let processedCount = 0;
        let batch = [];

        // Iterate over the whole collection using a cursor
        collection.find().forEach(function(doc) {
          // Remove unnecessary fields
          delete doc._id;
          
          batch.push(doc);
          ++processedCount;

          // Send documents by batch of 5000 to Algolia
          if (batch.length >= 5000) {
            sendToAlgolia(batch);
            batch = [];
          }

          // Send remaining documents
          if (processedCount === collectionCount) {
            sendToAlgolia(batch);
          }
        });
      });
  });
});

function sendToAlgolia(batch) {
  index.partialUpdateObjects(batch, function(err, content) {
    if (err) throw new Error(err);
    let recordsCount = batch.length;
    index.waitTask(content.taskID, function() {
      console.log('Indexed ' + recordsCount + ' records in ' + content.taskID);
      db.close();
    });
  });
}

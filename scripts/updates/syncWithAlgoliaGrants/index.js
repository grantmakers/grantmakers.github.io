// node -e 'require("./index").syncWithAlgolia()'
const algoliasearch = require('algoliasearch');
const secrets = require('./secrets');

// Algolia
const appID = secrets.algolia.appID;
const apiKey = secrets.algolia.apiKey;
const indexName = secrets.algolia.indexName;
const client = algoliasearch(appID, apiKey);
const index = client.initIndex(indexName);

// Mongo
const MongoClient = require('mongodb').MongoClient;
const f = require('util').format;
/*
const user = encodeURIComponent(secrets.gce.user);
const password = encodeURIComponent(secrets.gce.password);
const host = encodeURIComponent(secrets.gce.host);
const database = encodeURIComponent(secrets.gce.database);
const authSource = encodeURIComponent(secrets.gce.authDatabase);
const url = f('mongodb://%s:%s@%s:27017/%s?authSource=%s',
  user, password, host, database, authSource);
  */
// Sync local db 
const url = f('mongodb://localhost:27017/irs');

exports.syncWithAlgolia = function syncWithAlgolia(req, res) {
  // Open a db connection
  MongoClient.connect(url)
    .then(db => {
      const query = {};
      const batchSize = 1000;
    
      const collection = db.collection('grants_updates');
      const cursor = collection.find(query);
      let currentBatch = [];
      
      // Kickstart the processing.
      cursor.next(process);
  
      function process(err, doc) {
        // Indicates whether there are more documents to process after the current one.
        let hasMore = doc !== null ? true : false;
    
        if (doc === null) {
          if (currentBatch.length > 0) {
            processBatch(currentBatch)
              .then(function() {
                return db.close(function(e, r) {
                  if (r) {
                    res.send('Algolia sync complete \n');
                  }
                  return;
                });
              });
          }
          console.log('Finished processing documents');
          return;
        } else {
          setTimeout(function() {
            currentBatch.push(doc);
            if (currentBatch.length % batchSize === 0) {
              processBatch(currentBatch)
                .then(function() {
                  currentBatch = [];
                  return cursor.next(process);
                });
            } else if (hasMore) {
              cursor.next(process);
            } else {
              return;
            }
          });
        }
      }
    })
    .catch(function(cErr) {
      throw new Error(cErr);
    });

  function processBatch(batch) {
    console.log('Batch sent to Algolia');
    return index.addObjects(batch);
  }
};

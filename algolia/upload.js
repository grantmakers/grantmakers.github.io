var algoliasearch = require('algoliasearch');
var fs = require('fs');
var async = require('async');
var _ = require('lodash');
var secrets = require('./secrets');

var appID = secrets.algolia.appID;
var apiKey = secrets.algolia.apiKey;
var indexName = 'filings_pf_grouped_by_ein';

var client = algoliasearch(appID, apiKey);
var index = client.initIndex(indexName);

//var Db = require('mongodb').Db;
//var Server = require('mongodb').Server;


fs.readFile('algolia.json', 'utf8', function (err, json) {
  if (err) {
    return console.log(err);
  }
  var data = _.chunk(JSON.parse(json), [size=10000]);
  // TODO - change to update
  return index.clearIndex(function(err, content) {
    index.waitTask(content.taskID, function() {
      async.each(data, function(batch, callback) {
        // TODO - change to update
        index.addObjects(batch, function gotTaskID(error, content) {
          console.log('write operation received: ' + content.taskID);
          index.waitTask(content.taskID, function contentIndexed() {
            console.log('batch ' + content.taskID + ' indexed');
          });
        });
      }, function(err){
        console.log(err);
      });
    });
  });
});

// init connection to MongoDB
/*
var db = new Db('irs', new Server('localhost', 27017));
db.open(function(err, db) {
  // get the collection
  db.collection('algolia', function(err, collection) {
    // iterate over the whole collection using a cursor
    var batch = [];
    collection.find().forEach(function(doc) {
      batch.push(doc);
      if (batch.length > 1000) {
        // send documents by batch of 10000 to Algolia
        index.addObjects(batch, function(err, content){
          index.waitTask(content.taskID, function() {
            console.log('Indexed '+ batch.length + ' records');
            //callback();
          });
        });
        batch = [];
      }
    });
    // last batch
    if (batch.length > 0) {
      index.addObjects(batch, function(err, content){
        index.waitTask(content.taskID, function() {
          console.log('Indexed '+ batch.length + ' records');
          //callback();
        });
      });
    }
  });
});
*/
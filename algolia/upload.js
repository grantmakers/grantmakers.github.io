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
fs.readFile('algolia.json', 'utf8', function (err, json) {
  if (err) {
    return console.log(err);
  }
  var data = _.chunk(JSON.parse(json), [size=10000]);
  return index.clearIndex(function(err, content) {
    index.waitTask(content.taskID, function() {
      async.each(data, function(batch, callback) {
        index.addObjects(batch, function(err, result){
          //index.waitTask(result.taskID, function() {
            console.log('Indexed '+ batch.length + ' records');
            callback();
          //});
        });
      }, function(err){
        console.log(err);
      });
    });
  });
});
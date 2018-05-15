const AWS = require('aws-sdk');
const MongoClient = require('mongodb').MongoClient;
const request = require('request');
const es = require('event-stream');
const JSONStream = require('JSONStream');
const moment = require('moment');
const secrets = require('./secrets');
const Slack = require('node-slackr');

// IRS Index Year
const year = 2018;
const yearString = year.toString();

// AWS Config
AWS.config.update({'region': 'us-east-1'});
AWS.config.httpOptions.timeout = 0; // Default is 2 minutes
const s3 = new AWS.S3();

// AWS Params
const bucket = 'irs-form-990';
const indexFileName = 'index_' + yearString + '.json';
const indexPath = 'https://s3.amazonaws.com/' + bucket + '/' + indexFileName;

// Slack
const slackURI = secrets.slack.webhook_uri;
const slack = new Slack(slackURI, {'channel': '990updates'});

// Main function
exports.checkForUpdates = function checkForUpdates(req, res) {
  // Define global variables
  let lastModifiedAws = new Date(0).toISOString();
  let lastModifiedGrantmakers = new Date(0).toISOString();
  let count = 0;

  // Define AWS arams
  const params = {
    'Bucket': bucket,
    'Key': indexFileName,
  };

  // Define Mongo params
  const uri = secrets.atlas.uri;
  const dbName = 'grantmakers';
  const dbCollection = 'updates';

  // Fetch Mongo update info
  MongoClient.connect(uri, function(errConnect, client) {
    if (errConnect) throw errConnect;

    const db = client.db(dbName);
    const collection = db.collection(dbCollection);

    collection.find({'year': year}).sort({'lastModified': -1}).limit(1).toArray(function(errFind, docs) {
      if (errFind) throw errFind;
      if (docs && docs.length) {
        lastModifiedGrantmakers = docs[0].lastModified;
        fetchAwsObject();
      } else if (docs) {
        fetchAwsObject();
      }
      client.close();
    });
  });

  function fetchAwsObject() {
    // Fetch AWS Metadata
    s3.makeUnauthenticatedRequest('headObject', params, function(errS3, data) {
      if (errS3) throw errS3;

      // Convert AWS date to UTC
      lastModifiedAws = moment(data.LastModified, 'ddd, DD MMM YYYY HH:mm:ss ZZ').toISOString();

      if (lastModifiedAws > lastModifiedGrantmakers) {
        countPfObjects();
      } else {
        // slack.notify('No updates available');
        res.send('No updates available \n ');
        return;
      }
    });
  }

  function countPfObjects() {
    request(indexPath)
      .on('error', function(err) {
        console.error('-----Index Request Error-----');
        console.error(err);
        res.status(500).send('Index Request Error');
      })
      .pipe(JSONStream.parse(['Filings' + year, true]))
      .on('error', function(err) {
        console.error('-----JSONParse Error-----');
        console.error(err);
        res.status(500).send('JSONParse Error');
      })
      .pipe(es.mapSync(function(data) {
        // Filter results to only foundations w/ data available
        if (data.URL && data.URL.length > 0 && data.FormType === '990PF' && data.LastUpdated > lastModifiedGrantmakers) {
          ++count;
        }
      })
        .on('end', function() {
          let message = undefined;
          if (count === 0) {
            message = 'File updated by IRS,' + '\n' +
                      'but no new 990-PF filings found' + '\n';
          } else {
            message = 'Updates available' + '\n' +
                      'New PF Filings: ' + count + '\n';
          }
          slack.notify(message);
          res.send(message);
          count = 0;
          return;
        })
        .on('error', function(err) {
          console.error('-----mapSync Error-----');
          console.error(err);
          res.status(500).send('mapSync Error');
        })
      );
  }
};

// USAGE: node fetch-with-throttle.js 2015  (with year parameter)
//        node fetch-with-throttle.js (withouth year paramter; defaults to 2017)
// If javascript heap error occurs, run with the following:
//  node --max-old-space-size=4096 fetch-with-throttle.js
//
const eventStream = require('event-stream');
const Promise = require('bluebird');
const JSONStream = require('JSONStream');
const xml2jsParser = require('xml2js').parseString;
const when = require('when');
const guard = require('when/guard');

// IRS Index
const targetYear = process.argv[2] || '2018'; // The year to fetch

// Dates & Timestamps
const dateObj = new Date();
const month = (dateObj.getUTCMonth() + 1 < 10 ? '0' : '') + (dateObj.getUTCMonth() + 1);
const day = (dateObj.getUTCDate() < 10 ? '0' : '') + dateObj.getUTCDate();
const year = dateObj.getFullYear().toString().substr(2, 2);
const previousUpdate = new Date('2018-02-13T16:02:11.854Z'); // Used for incremental updates

// AWS
const AWS = require('aws-sdk');
AWS.config.update({'region': 'us-east-1'});
AWS.config.httpOptions.timeout = 0; // Default is 2 minutes
const s3 = new AWS.S3();

// MongoDB settings
const dbName  = 'grantmakers';
const dbCollection = 'irs' + targetYear + '_' + month + day + year;
const dbHostPort = '127.0.0.1:27017';
const db = require('mongodb-promises').db(dbHostPort, dbName);
const mycollection = db.collection(dbCollection);

// xml2js
const xmlParserOptions = {
  'explicitArray': false,
  'emptyTag': undefined,
  'attrkey': 'attributes',
};

// Throttling helpers
const limit = 500;
let records = 0;
let skipped = 0;
let matches = 0;
let processed = 0;

// Helper functions
function logMessage(message, messageType) {
  // TODO: add a config setting to turn this off/on
  switch (messageType) {
    case 'error':
      console.error('-----Index Request Error-----');
      console.error(message);
      break;
    case 'parseError':
      console.error('-----JSONParse Error-----');
      console.error(message);
      break;
    case 'mapSync':
      console.error('-----mapSync Error-----');
      console.error(message);
      break;
    case 'mongo':
      console.error('-----Mongo Insertion Error-----');
      console.error(message);
      break;
    case 'xml_request':
      console.error('-----XML Request Error-----');
      console.error(message);
      break;
    default:
      console.error(message);
  }
}

function promisedParseXml(resultXml, parserOptions) {
  return new Promise(function(resolve, reject) {
    xml2jsParser(resultXml.Body, parserOptions, function(err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });
}
// Only let 500
const condition = guard.n(limit);

// We'll guard this method and control how many times it can be used in flight.
// This should suffice for throttle control.
const guardedProcessFiling = guard(condition, function processFiling(data) {
  // TODO - not sure if this should be here now...
  if (data.URL && data.URL.length > 0 && data.FormType === '990PF' && new Date(data.LastUpdated) > previousUpdate) {
    matches++;
    // Fetch XML using AWS SDK
    const targetKey = data.ObjectId + '_public.xml';
    const paramsXml = {'Bucket': 'irs-form-990', 'Key': targetKey};

    return s3.makeUnauthenticatedRequest('getObject', paramsXml).promise()
      .then(function(resultXml) {
        return promisedParseXml(resultXml, xmlParserOptions);
      })
      .then(function(resultJs) {
        // Should save to db be in another method?
        let obj = {};

        obj = {
          '_id': data.ObjectId,
          'last_updated_grantmakers': dateObj.toISOString(),
          'Index': data,
          'Return': resultJs.Return,
        };
         // Write the JS object to Mongo
        mycollection.save(obj)
          .then(function() {
            processed++;
          })
          .catch(function(err) {
            logMessage(err, 'mongo');
          });
      })
      .catch(function(err) {
        logMessage(err, 'xml_request');
      });
  } else {
    return skipped++;
  }
});

// Main function
const paramsJSON = {'Bucket': 'irs-form-990', 'Key': 'index_' + targetYear + '.json'};
const s3Stream = s3.makeUnauthenticatedRequest('getObject', paramsJSON).createReadStream();
s3Stream
  .on('error', function(err) {
    logMessage(err, 'error');
  })
  .pipe(JSONStream.parse(['Filings' + targetYear, true]))
  .on('error', function(err) {
    logMessage(err, 'parseError');
  })
  .pipe(eventStream.mapSync(function(data) {
    records++;
    logMessage('Records: ' + records + ' | Matches: ' + matches + ' | Processed: ' + processed + ' | Skipped: ' + skipped);
    // This is a guarded method...so we can control how many times it's inflight.
    guardedProcessFiling(data);
    return;
  }))
  .on('error', function(err) {
    logMessage(err, 'mapSync');
  })
  .on('end', function() {
    // Readable stream is finished
    logMessage('-----JSON Request is Finished-----');
    // Close down db connection
    db.close();
  });

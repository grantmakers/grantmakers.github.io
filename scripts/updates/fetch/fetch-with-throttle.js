// const request = require('request');
const eventStream = require('event-stream');
const Promise = require('bluebird');
const JSONStream = require('JSONStream');
const xml2jsParser = require('xml2js').parseString;
const when = require('when');
const guard = require("when/guard");

// IRS Indexes
const targetYear = '2017'; // Enter the year to fetch
const index = 'https://s3.amazonaws.com/irs-form-990/index_' + targetYear + '.json';

// Dates & Timestamps
const dateObj = new Date();
const month = (dateObj.getUTCMonth() + 1 < 10 ? '0' : '') + (dateObj.getUTCMonth() + 1);
const day = (dateObj.getUTCDate() < 10 ? '0' : '') + dateObj.getUTCDate();
const year = dateObj.getFullYear().toString().substr(2, 2);
const previousUpdate = new Date('2017-11-21T16:23:38.785Z');

// AWS
const AWS = require('aws-sdk');
AWS.config.update({'region': 'us-east-1'});
AWS.config.httpOptions.timeout = 0; // Default is 2 minutes
const s3 = new AWS.S3();

const dbHostPort = '127.0.0.1:27017';

// const dbHostPort = 'localhost:27017';

// MongoDB settings
const dbName  = 'grantmakers';
const dbCollection = 'irs' + targetYear + '_' + month + day + year;
const db = require('mongodb-promises').db(dbHostPort, dbName);
const mycollection = db.collection(dbCollection);

// xml2js
const parserOptions = {'explicitArray': false,
                       'emptyTag': undefined,
                       'attrkey': 'attributes'};

// Throttling helpers
const limit = 500;
let records = 0;
let skipped = 0;
let matches = 0;
let processed = 0;

// helper functions
var logMessage = function(message, messageType) {
  // TODO: add a config setting to turn this off/on
  switch(messageType) {
    case "error":
      console.error('-----Index Request Error-----');
      console.error(message);
      break;
    case "parseError":
      console.error('-----JSONParse Error-----');
      console.error(message);
      break;
    case "mapSync":
      console.error('-----mapSync Error-----');
      console.error(message);
      break;
     case "mongo":
      console.error('-----Mongo Insertion Error-----');
      console.error(message);
      break;
    case "xml_request":
      console.error('-----XML Request Error-----');
      console.error(message);
      break;
    default:
      console.error(message);
  }

};

logMessage("connected to db");
logMessage(mycollection);

var promisedParseXml = function(resultXML, parserOptions){
  return new Promise(function(resolve, reject) {
    xml2jsParser(resultXML.Body, parserOptions, function(err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });
}
// only let 500
var condition = guard.n(limit);

// we'll guard this method and control how many times it can be used in flight.
// this should suffice for throttle control.
var guardedProcessFiling = guard(condition, function processFiling(data) {
  // TODO - not sure if this should be here now...
  if (data.URL && data.URL.length > 0 && data.FormType === '990PF') {
     matches++;
    // Fetch XML using AWS SDK
    const targetKey = data.ObjectId + '_public.xml';
    const paramsXML = {'Bucket': 'irs-form-990', 'Key': targetKey};

     s3.makeUnauthenticatedRequest('getObject', paramsXML).promise()
      .then(function(resultXML) {
        return promisedParseXml(resultXML, parserOptions);
      })
      .then(function(resultJS) {
        // should save to db be in another method?
        let obj = {};

        obj = {
          '_id': data.ObjectId,
          'last_updated_grantmakers': dateObj.toISOString(),
          'Index': data,
          'Return': resultJS.Return,
        };
         // Write the JS object to Mongo
        mycollection.save(obj)
        .then(function(resultArr) {
          logMessage("saved to db");
          processed++;
        })
        .catch(function(err) {
          logMessage(err, "mongo");
        });
      })
      .catch(function(err) {
        logMessage(err, "xml_request");
      });
  } else {
     skipped++;
  }
});

// Main function
const paramsJSON = {'Bucket': 'irs-form-990', 'Key': 'index_2017.json'};
const s3Stream = s3.makeUnauthenticatedRequest('getObject', paramsJSON).createReadStream();
s3Stream
  .on('error', function(err) {
    logMessage(err, "error");
  })
  .pipe(JSONStream.parse(['Filings' + targetYear, true]))
  .on('error', function(err) {
    logMessage(err, "parseError");
  })
  .pipe(eventStream.mapSync(function(data) {
    records++;
    logMessage('Records: ' + records + ' | Matches: ' + matches + ' | Processed: ' + processed + ' | Skipped: ' + skipped);
    // no need to manual pause and stop the stream - i hope.
    // this is a guarded method...so we can control how many times its inflight.
    guardedProcessFiling(data);
    return;
  }))
  .on('error', function(err) {
    logMessage(err, "mapSync");
  })
  .on('end', function() {
    // Readable stream is finished
    logMessage('-----JSON Request is Finished-----')
    // Close down db connection
    db.close();
  });

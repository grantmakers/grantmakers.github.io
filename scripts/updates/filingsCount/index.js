// Running locally
// node -e 'require("./index").filingsCount()'
// node -e 'require("./index").filingsCount({"year": "2015"})'
// Running on GCF
// curl https://us-central1-infinite-badge-163220.cloudfunctions.net/filingsCount --data '{"year":"2017"}'
const request = require('request');
const es = require('event-stream');
const JSONStream = require('JSONStream');

exports.filingsCount = function filingsCount(req, res) {
  let obj = {};
  obj.count = 0;
  obj.nineNinety = 0;
  obj.pf = 0;
  obj.ez = 0;
  obj.unknown = 0;

  // IRS Indexes
  const targetYear = req.body.year || '2017'; // The year to fetch
  const index = 'https://s3.amazonaws.com/irs-form-990/index_' + targetYear + '.json';

  // Main Function
  request(index)
    .on('error', function(err) {
      console.error('-----Index Request Error-----');
      console.error(err);
    })
    .pipe(JSONStream.parse(['Filings' + targetYear, true]))
    .on('error', function(err) {
      console.error('-----JSONParse Error-----');
      console.error(err);
    })
    .pipe(es.mapSync(function(data) {
      obj.count++;
      // Filter results to only foundations w/ data available
      if (data.URL && data.URL.length > 0) {
        if (data.FormType === '990PF') {
          obj.pf++;
        }
        if (data.FormType === '990EZ') {
          obj.ez++;
        }
        if (data.FormType === '990') {
          obj.nineNinety++;
        }
      } else {
        obj.unknown++;
      }

      return;
    })
    .on('error', function(err) {
      console.error('-----mapSync Error-----');
      console.error(err);
    })
    .on('end', function() {
      console.log('Finished processesing for filingsCount');
      console.log(JSON.stringify(obj, null, 2));
      res.send(JSON.stringify(obj, null, 2));
    })
  );
};

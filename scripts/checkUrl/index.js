const urlExists = require('url-exists');
const { serveHttp } = require('webfunc');
const secrets = require('./secrets');

const validDev = secrets.dev;
const validStaging = secrets.staging;
const validProd = secrets.prod;
const validOrigins = [validDev, validStaging, validProd];

exports.checkUrl = serveHttp((req, res) => {
  const origin = req.get('origin');
  const target = req.body.target;
  console.log('Origin: ' + origin);
  console.log('Target: ' + target);
  if (!validOrigins.includes(origin)) {
    console.log('Unauthorized origin');
    res.status(400).send('Unauthorized origin');
    return false;
  }

  return urlExists(target, function(err, exists) {
    console.log('Exists: ' + exists);
    res.status(200).send(exists);
    return exists;
  });
});

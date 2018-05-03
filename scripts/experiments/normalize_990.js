// CamelCase for js
// Underscore for MongoDB keys
// IRS uses PascalCase
db.getCollection('990_combined').aggregate([ { '$match': {} }, { '$out': '990_normalized' } ]);
db.getCollection('990_normalized').find().forEach(function(u) {
  const ein = u.Index.EIN;
  const organizationName = u.Index.OrganizationName;
  const taxPeriod = u.Index.TaxPeriod;
  const url = u.Index.URL;
  const lastUpdatedIrs = u.Index.LastUpdated;
  const lastUpdatedGrantmakers = u.last_updated_grantmakers;
  const irsObjectId = u.Index.ObjectId;
  // TODO Pull directly from MongoDB updates collection
  
  let normalized = {};
  let city = null;
  let state = null;
  let country = 'US';
  let isForeign = false;
  let taxYear = null;

  /** Filing Type **/
  // Due to IRS schema errors, cannot depend on FormType included in Index. Must use Return.
  const filingType = u.Return.ReturnHeader.ReturnTypeCd || u.Return.ReturnHeader.ReturnType;
  let filingPath;
  if (filingType === '990') {
    filingPath = u.Return.ReturnData.IRS990;
  } else if (filingType === '990EZ') {
    filingPath = u.Return.ReturnData.IRS990EZ;
  } else {
    // Handle IRS schema errors
    // Skip process for any file types other than 990 & 990EZ
    console.log('Skipped URL: ' + url);
    return;
  }

  // Handle IRS schema errors
  // Skip process for any file types other than 990 & 990EZ

  /** Mission **/
  let mission = null;
  let missionAlt = null;
  if (filingType === '990') {
    mission = filingPath.MissionDesc || filingPath.MissionDescription || null;
    missionAlt = filingPath.ActivityOrMissionDesc || filingPath.ActivityOrMissionDescription || null;
  } else if (filingType === '990EZ') {
    mission = filingPath.PrimaryExemptPurposeTxt || filingPath.PrimaryExemptPurpose || null;
    missionAlt = null;
  } else {
    console.log('Skipped URL: ' + url);
    return;
  }

  /** Employees */
  // let employeeCount = filingPath.TotalEmployeeCnt || null;

  /** Tax Year **/
  taxYear = u.Return.ReturnHeader.TaxYr || u.Return.ReturnHeader.TaxYear || null;

  /** US or Foreign Address **/
  const us = u.Return.ReturnHeader.Filer.USAddress;
  const foreign = u.Return.ReturnHeader.Filer.ForeignAddress;

  if (us) {
    city = us.CityNm || us.City;
    state = us.StateAbbreviationCd || us.State;
  } else if (foreign) {
    city = foreign.CityNm || foreign.City || 'Foreign';
    state = foreign.ProvinceOrStateNm || foreign.ProvinceOrState || 'Foreign';
    country = foreign.CountryCd || foreign.Country || 'Foreign';
    isForeign = true;
  } else {
    city = 'N/A';
    state = 'N/A';
  }
  
  /** Website **/
  let website = filingPath.WebsiteAddressTxt || filingPath.WebsiteAddress || null;

           
  if (website && website.match(/(?:(?:https?):\/\/)/i)) { // Check if properly formatted url
    website = website;
  } else if (website && website.match(/(^www.)/i)) {  // Check if www.
    website = 'http://' + website;
  } else if (website && website.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/i)) { // Check if apex domain (e.g. example.com)
    website = 'http://' + website;
  } else if (website && website.match(/^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/i)) { // Check if email address
    website = 'mailto:' + website;
  } else { // Malformed website
    website = null;
  }
  // TODO Handle edge cases like https://s3.amazonaws.com/irs-form-990/201533179349100823_public.xml (e.g. no domain)

  let hasWebsite = false;

  if (website) {
    website = website.toLowerCase();
    hasWebsite = true;
  }

  /** Construct object **/
  normalized = {
    'object_id_irs': irsObjectId,
    'last_updated_irs': lastUpdatedIrs,
    'last_updated_grantmakers': lastUpdatedGrantmakers,
    'ein': ein,
    'organization_name': organizationName,
    'website': website,
    'is_foreign': isForeign,
    'city': toTitleCase(city),
    'state': state,
    'country': country,
    'tax_period': Number(taxPeriod),
    'tax_year': Number(taxYear),
    'url': url,
    'has_website': hasWebsite,
    'mission': mission,
    'mission_alt': missionAlt,
  };

  /** Helper functions **/
  function toTitleCase(str) {
    if (typeof str === 'string') {
      return str.replace(/\w\S*/g, function(txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    } else {
      return str;
    }
  }

  /** Update documents **/
  db.getCollection('990_normalized').update(
    {'_id': u._id},
    {
      '$unset': {'Index': 1, 'Return': 1, 'last_updated_grantmakers': 1},
      '$set': { 'normalized': normalized },
    },
    { 'upsert': true }
  );
});

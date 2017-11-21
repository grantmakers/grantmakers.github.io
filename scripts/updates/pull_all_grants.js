db.normalized.aggregate(
  [
    {
      '$match': {
        // 'normalized.ein': '521798711'
        // 'normalized.ein': { $in: ['050509502', '521798711', '131684331'] }
      },
    },
    {
      '$unwind': {
        'path': '$normalized.grants',
        'includeArrayIndex': 'index_for_objectID',
        'preserveNullAndEmptyArrays': false,
      },
    },
    {
      '$project': {
        '_id': 0,
        'objectID': {'$concat': [{'$substr': ['$normalized.ein', 0, -1]}, '_', {'$substr': ['$normalized.tax_year', 0, -1]}, '_', {'$substr': ['$index_for_objectID', 0, -1]}] },
        'ein': '$normalized.ein',
        'organization_name': '$normalized.organization_name',
        'city': '$normalized.city',
        'state': '$normalized.state',
        'tax_year': '$normalized.tax_year',
        'last_updated_grantmakers': '$normalized.last_updated_grantmakers',
        'last_updated_irs': '$normalized.last_updated_irs',
        'grant_amount': '$normalized.grants.amount',
        'grant_purpose': '$normalized.grants.purpose',
        'grantee_name': '$normalized.grants.name',
        'grantee_city': '$normalized.grants.city',
        'grantee_state': '$normalized.grants.state',
        'grantee_state_displayed': {
          '$cond': {
            'if': { '$eq': ['$normalized.grants.is_foreign', true]},
            'then': { '$concat': ['$normalized.grants.country', '*']},
            'else': '$normalized.grants.state',
          },
        },
        'grantee_country': '$normalized.grants.country',
        'grantee_is_foreign': '$normalized.grants.is_foreign',
        'grant_number': {'$sum': ['$index_for_objectID', 1]},
      },
    },
    {
      '$group': {
        '_id': '$objectID',
        'objectID': {'$first': '$objectID'},
        'ein': {'$first': '$ein'},
        'organization_name': {'$first': '$organization_name'},
        'city': {'$first': '$city'},
        'state': {'$first': '$state'},
        'tax_year': {'$first': '$tax_year'},
        'last_updated_grantmakers': {'$first': '$last_updated_grantmakers'},
        'last_updated_irs': {'$first': '$last_updated_irs'},
        'grant_amount': {'$first': '$grant_amount'},
        'grant_purpose': {'$first': '$grant_purpose'},
        'grantee_name': {'$first': '$grantee_name'},
        'grantee_city': {'$first': '$grantee_city'},
        'grantee_state': {'$first': '$grantee_state'},
        'grantee_state_displayed': {'$first': '$grantee_state_displayed'},
        'grantee_country': {'$first': '$grantee_country'},
        'grantee_is_foreign': {'$first': '$grantee_is_foreign'},
        'grant_number': {'$first': '$grant_number'},
      },
    },
    { '$out': 'grants' },
  ],
  { 'allowDiskUse': true}
);

// mongoexport --db irs --collection grants --out grants.json --jsonArray

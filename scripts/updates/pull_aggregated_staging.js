db.aggregated.aggregate(
  [
      { '$sample': { size: 1000 } },
      { '$out': 'aggregated_staging'},
  ],
  { 'allowDiskUse': true}
);
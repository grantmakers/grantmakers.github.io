db.aggregated.aggregate(
  [
      { '$sample': { size: 100 } },
      { '$out': 'aggregated_dev'},
  ],
  { 'allowDiskUse': true}
);

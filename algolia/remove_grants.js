var count = 0;
db.algolia.find().forEach(function(obj){

  count ++;
  
  /** Update documents **/
  db.algolia.update(
    obj, 
    { 
      $unset: { 'Grants': '' }
    },
    function(err, result) {
      if (err) {
        console.log(err);
        print('*****MongoDB update error*****');
        print('EIN: ' + ein);
        return;
      }
      if (result) {
        
      } else {
        print('*****MongoDB update error*****');
        print('EIN: ' + ein);
      }
    }
  );
  
});
print('Count: ' + count);
module.exports = {
  generateShortURL: function(lng){
    let result = '';
    for (let i = 0; i < lng; i++)
      result += String.fromCharCode(Math.floor(Math.random() * 26 + 97));
    return result;
  },

  storeURL: function(client, host, givenURL, callback) {
    // check that it is not already stored
    let docs = client.db(dbName).collection('urls');
    let shortURL = generateShortURL(4);
    docs.findOne({ "base_url": givenURL },
      (err, result) => {
        if (err) throw callback(err);
        if (result !== null) { // if it's already stored, return it
          console.log('There is already a record in the db with this url');
          let message = {
            "original_URL": result.base_url,
            "short_URL": 'http://' + host + '/' + result.shortened_url
          }
          callback(message);
        } else {  // givenURN is not in our database yet.
          console.log("I'm going to call the checkShortURLIsUnique function");
          checkShortURLIsUnique(client, shortURL, (err, data) => {
            if (err) throw err;
            docs.insertOne({
              base_url: givenURL,
              short_url: data
            }, (err, result) => {
              if (err) throw err;
              // successfully inserted. Now return the data
              let message = {
                "original_URL": givenURL,
                "short_URL": 'http://' + host + '/' + data
              }
              callback(message);
            })
          });
        } // end FindOne shortURL
      });// end FindOne givenURL
  },

  checkShortURLIsUnique: function(client, shortURL, callback) {
    console.log("I'm in the checking function");
    client.db(dbName).collection('urls')
      .findOne({
        short_url: shortURL
      }, (err, result) => {
        if (err) throw (err);
        if (result !== null) {
          console.log('The generated short url IS NOT unique');
          checkShortURLIsUnique(client, generateShortURL(4), callback);
        } else {
          console.log('The generated short url IS unique');
          callback(null, shortURL);
        }
      });
  }
}
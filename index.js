const path = require('path');
const express = require('express');
const app = express();
const port = 3000;
// const request = require('request');

// DB connection
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
// dbName
const dbName = "shortenUrls";


/*
  MIDDLEWARES
*/
// reach the public library
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req,res) => {
  // show the app description
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


app.get('/shorten/:url(*+)', (req, res) => {
  // check the url. if the format is invalid, return error
  let regex = /^http(s)?:\/\/([\w\d\D]+\.)?[\w\d\D]+\.[\w\d]{2,6}$/; // my own regex, can be buggy
  // let givenURL = req.params.protocol + '//' + req.params.url
  let givenURL = req.params.url
  
  let possiblyUnique;

  if (regex.test(givenURL))    
    // url syntax okay, generate a random string as short url
    // check that the shorten url is unique in the db
    // if not valid, generate a new one it again.
    MongoClient.connect(url, (err, client) => {
      if (err) throw('Something went wrong while trying to connect to the database: ' + err);

      console.log('Successfully connected to the db');
      const db = client.db(dbName);

      storeURL(client, req.hostname, givenURL, (err, data) =>{
        if (err){
          console.log(err);
          return res.json(err);
        } else {
          console.log(data);
          return res.json(message);
        }    
      });
    });
  else
    res.json({ "error": "You have entered an invalid url. Please check it once again." })
});




app.listen(port, (err, data) => {
  if (err) throw(err);
  console.log('Server is running on port ' + port);
})


function generateShortURL(lng){
  let result = '';
  for (let i = 0; i < lng; i++)
    result += String.fromCharCode(Math.floor(Math.random() * 26 + 97));
  return result;
}


function storeURL(client, host, givenURL, callback){
  // check that it is not already stored
  let docs = client.db(dbName).collection('urls');
  let shortURL = generateShortURL(4);
  docs.findOne({"base_url": givenURL}, 
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
          checkShortURLIsUnique(client, shortURL, (err, data) =>{
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
}



function checkShortURLIsUnique(client, shortURL, callback){
  console.log("I'm in the checking function");
  client.db(dbName).collection('urls') 
    .findOne({ 
      short_url: shortURL 
    }, (err, result) => {
        if (err) throw (err);
        if (result !== null){
          console.log('The generated short url IS NOT unique');
          checkShortURLIsUnique(client, generateShortURL(4), callback);
        } else {
          console.log('The generated short url IS unique');
          callback(null, shortURL);
        }
    });
}
const path = require('path');
const express = require('express');
const dbhelpers = require('./db-functions');
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


// show the app description
app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// shorten the valid url
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

      dbhelpers.storeURL(client, req.hostname, givenURL, (err, data) =>{
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

// retrieve the shorten urls
app.get('/:short(*+)', (req, res) => {
  MongoClient.connect(url, (err, client) =>{
    if (err) throw ('Something went wrong while trying to connect to the database: ' + err);
    const db = client.db(dbName);

    db.collection('urls').findOne({'short_url': req.params.short}, (err, result) => {
      if (err) throw ('Somenthing went wrong while trying to read from the database. ' +err);

      if (result === null){
        res.json({'error': 'You have entered an invalid short url.'});
      } else {
        res.redirect(result.base_url);
      }
    });
  });
  // res.send('ok');
});




app.listen(port, (err, data) => {
  if (err) throw(err);
  console.log('Server is running on port ' + port);
})
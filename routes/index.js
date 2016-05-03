'use strict';
var express = require('express');
var router = express.Router();
// var tweetBank = require('../tweetBank');
var Promise = require('bluebird');

module.exports = function makeRouterWithSockets (io, client) {

  // document.getElementById('deleteButton').onclick = function() {
  //   alert('hi');
  // }

  function createUser(name) {

    var userCreate = new Promise (function(resolve, reject) {
      client.query('INSERT INTO Users (name, pictureurl) VALUES ($1,$2)', [name, "http://lorempixel.com/48/48"], function (err, data) {
        if (err) reject(err);
        console.log('user created');
        resolve('weeecrazy'); 
      });
    })

    return userCreate.then(function () {
      return new Promise (function (resolve, reject) {
        console.log('getting id');
        client.query('SELECT ID FROM users', function (err, data) {
          if (err) reject(err);
          
            var userid = data.rows.slice(-1)[0].id;
            console.log('resolving userid', userid);
            resolve(userid);            
        });          
      })

    }).catch(function (err) {
      console.error(err);
    })
  }

  var createTweet = function (userid, content) {
    var tweetCreate = new Promise( function (resolve, reject) {
      console.log('here is content', content);
      console.log('here is the userid', userid);
      client.query('INSERT INTO Tweets (userId, content) VALUES ($1, $2)', [userid, content], function (err, data) {
        if (err) Promise.reject (err);
        console.log('please show us the data here', data);
        io.sockets.emit('new_tweet', data);
        return Promise.resolve()
      });
    })
  }

  // a reusable function
  function respondWithAllTweets (req, res, next){

    client.query('SELECT * FROM tweets, users WHERE users.id=tweets.userid', function (err, result) {
      var tweets = result.rows;
      res.render('index', { 
        title: 'Twitter.js', 
        tweets: tweets, 
        showForm: true 
      }); 
    });
  };

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    var name = req.params.username;
    client.query('SELECT * FROM users, tweets WHERE name=$1 AND users.id=tweets.userid', [name], function (err, data) {
      var tweetsForName = data.rows; 
        res.render('index', {
          title: 'Twitter.js',
          tweets: tweetsForName,
          showForm: true,
          username: name
       });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var id = req.params.id;
    client.query('SELECT * FROM users, tweets WHERE tweets.id=$1 AND users.id=tweets.userid', [id], function (err, data) {
      var tweetsForName = data.rows; 
        res.render('index', {
          title: 'Twitter.js',
          tweets: tweetsForName,
          showDelete: true
       });
    });    
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    console.log("Tweet posted for creation");
    var name = req.body.name;
    var content = req.body.text; 
    var existingUser = new Promise (function(resolve, reject) {
      console.log("checking for existing user")
       client.query('SELECT id FROM users WHERE name=$1', [name], function(err, data){
          if (err) return Promise.reject(err);
          console.log("done the check")
          return resolve(data);
       })

    })
    existingUser.then( function (data) {
      console.log("processing the user") 
      var userid;
      if (data.rows[0]){
        console.log(name,"already exists");
        userid =data.rows[0].id; //userid
      } else {
          console.log(name, "does not exist, creating with promises:");
          userid = createUser(name); //userid
        }
      // userid = data.rows[0].id||createUser(name);


        console.log("userid determined:", userid);

        return userid;

    }).then(function (userid){
      console.log("adding tweet for userid", userid);
      return Promise.resolve(createTweet(userid,content));
    })
      .then(function(){
            // console.log('userid in post', userid)
            console.log("(user and) tweet created")
            // res.send('done');
            res.redirect('/');
       }).catch(function (error) {
         // body...
         console.log("oopsies:", error);
       });
  });
  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });
  return router;
}
'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var Promise = require('bluebird');

module.exports = function makeRouterWithSockets (io, client) {

    // function getUserById(userid) {
    //   client.query('SELECT name FROM Users WHERE (id =$1)', [userid], function(err,data){
    //       console.log(`Selecting usernames for ${userid}: `, data.rows);
    //         // return elem['name']= data.rows[0].name; 
    //         return data.rows[0].name;
    //       });
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


      // client.query('INSERT INTO Users (name, pic) VALUES ($1,$2)', [name, "http://lorempixel.com/48/48"], function (err, data) {
      //   client.query('SELECT ID FROM users', function (err, data) {
      //     var userid= data.rows.slice(-1).id;
          // body...
          // client.query('INSERT INTO Tweets (userId, content) VALUES ($1, $2)', [userid, content], function (err, data) {
      // if (err) throw err;
      // console.log(data);
      // io.sockets.emit('new_tweet', data);
      // res.redirect('/');
      //   });
      //   });

      // });
    }

    var createTweet = function (userid, content) {
      // body...
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
    // var allTheTweets = tweetBank.list();
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: allTheTweets,
    //   showForm: true
    // });
    client.query('SELECT * FROM tweets, users WHERE users.id=tweets.userid', function (err, result) {
      var tweets = result.rows;
      
      // tweets.forEach(function(elem){
      //   console.log("Tweet", elem);
      //   var userid = elem.userid;
      //   getUserById(userid);  
      // })
      // console.log(tweets);
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true }); 
    });

    // client.on('row', function(row) {
    //   console.log(row.name);
    // })

  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    // var tweetsForName = tweetBank.find({ name: req.params.username });
    var name = req.params.username;
    client.query('SELECT name, tweets.id, content FROM users, tweets WHERE name=$1 AND users.id=tweets.userid', [name], function (err, data) {
      // console.log(data);
      var tweetsForName=  data.rows; 
      
        res.render('index', {
          title: 'Twitter.js',
          tweets: tweetsForName,
          showForm: true,
          username: name
       })
       // res.send('done');
     
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    res.render('index', {
      title: 'Twitter.js',
      tweets: tweetsWithThatId // an array of only one element ;-)
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
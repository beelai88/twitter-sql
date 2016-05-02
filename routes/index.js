'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');

module.exports = function makeRouterWithSockets (io, client) {

    // function getUserById(userid) {
    //   client.query('SELECT name FROM Users WHERE (id =$1)', [userid], function(err,data){
    //       console.log(`Selecting usernames for ${userid}: `, data.rows);
    //         // return elem['name']= data.rows[0].name; 
    //         return data.rows[0].name;
    //       });
    // }

    function createUser(name, content, res) {

      client.query('INSERT INTO Users (name, pic) VALUES ($1,$2)', [name, "http://lorempixel.com/48/48"], function (err, data) {
        client.query('SELECT ID FROM users', function (err, data) {
          var userid= data.rows.slice(-1).id;
          // body...
          client.query('INSERT INTO Tweets (userId, content) VALUES ($1, $2)', [userid, content], function (err, data) {
      // if (err) throw err;
      console.log(data);
      io.sockets.emit('new_tweet', data);
      res.redirect('/');
        });
        });

      });
     
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
    console.log(req.body);
    var name = req.body.name;
    client.query('SELECT id FROM users WHERE name=$1', [name], function(err, data) {
      // if () throw err; 
      // if ()
      console.log(data);
      var content = req.body.text; 
      if(data.rows[0]){
        var userid = data.rows[0].id;
        
      }else{
        client.query('SELECT ID FROM users', function (err, data) {
          console.log(data.rows);
          var userid= createUser(name, content,res);
          console.log(userid)

      
      // res.send('done');

        // });  
    });
          
       

      }

    

    });


'INSERT INTO Users (name, pic) VALUES ("Oprah Winfrey","http://lorempixel.com/48/48")'


  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
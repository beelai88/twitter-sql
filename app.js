
'use strict';
var express = require('express');
var app = express();
var morgan = require('morgan');
var swig = require('swig');
var makesRouter = require('./routes');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var bodyParser = require('body-parser');
var socketio = require('socket.io');
var pg = require('pg');
var conString = 'postgres://localhost:5432/twitterdb';
var client = new pg.Client(conString);

// connect to postgres
client.connect();



swig.renderFile(__dirname + '/views/index.html', {
  tweets: [
    { name: 'Joe', text: 'Hello!' }
  ]
}, function (err, output) {
  // console.log(output);
});


// templating boilerplate setup
app.set('views', path.join(__dirname, '/views')); // where to find the views
app.set('view engine', 'html'); // what file extension do our templates have
app.set('view cache', false);
app.engine('html', swig.renderFile); // how to render html templates
swig.setDefaults({ cache: false });

// logging middleware
app.use(morgan('dev'));

// body parsing middleware
app.use(bodyParser.urlencoded({ extended: true })); // for HTML form submits
app.use(bodyParser.json()); // would be for AJAX requests


// start the server
var server = app.listen(1337, function(){
  console.log('listening on port 1337');
});
var io = socketio.listen(server);



// Pass the client down to the routes
app.use('/', makesRouter(io, client));


// the typical way to use express static middleware.
var publicDir = path.join(__dirname, '/public')
var staticMiddleware = express.static(publicDir);
app.use(staticMiddleware);

// // manually-written static file middleware
// app.use(function(req, res, next){
//   var mimeType = mime.lookup(req.path);
//   fs.readFile('./public' + req.path, function(err, fileBuffer){
//     if (err) return next();
//     res.header('Content-Type', mimeType);
//     res.send(fileBuffer);
//   });
// });
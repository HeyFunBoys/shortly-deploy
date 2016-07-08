var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var Links = require('../app/models/link');
var Users = require('../app/models/user');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/mongodb');
// MongoClient.connect('mongodb://localhost:27017/mongodb', function(err, db) {
//   db.createCollection('users', {
//     autoIndexId: true
//   });
//   db.createCollection('urls', {
//     autoIndexId: true
//   });
// });
// var users = mongoose.model('users', {
//   username: String,
//   password: String
// });

// var urls = mongoose.model('urls', {
//   id: Number,
//   url: String,
//   baseUrl: String,
//   code: String,
//   title: String,
//   visits: Number
// });

// var newUrl = new urls({url: 'www.google.com'});
// newUrl.save(function() {});

var shortenUrl = function(url) {
  var shasum = crypto.createHash('sha1');
  shasum.update(url);
  return shasum.digest('hex').slice(0, 5);
};

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Links.find({}, function(err, data) {
    if (err) {
      return res.sendStatus(404);
    }
    res.status(200).send(data);
  });

};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  Links.findOne({url: uri}).exec(function(err, data) {
    if (err) {
      return res.sendStatus(404);
    }
    if ( data ) {
      res.status(200).send(data);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        console.log('this is the uri ' + uri);
        console.log(`this is the headers ${req.headers.origin}`);
        var newUrl = new Links({
          url: uri,
          title: title,
          baseUrl: req.headers.origin,
          code: `${req.headers.origin}/${shortenUrl(uri)}`
        });
        newUrl.save(function(err, data) {
          if (err) {
            console.log('Error Creating URL: ', err);
            return res.sendStatus(302);
          }
          res.status(200).send(data);
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  Users.findOne({ username: username })
    .exec(function(err, user) {
      if (!user) {
        res.redirect('/login');
      } else {
        user.comparePassword(password, function(err, match) {
          if (match) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/');
          }
        });
      }
    });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  Users.findOne({ username: username })
    .exec(function(err, user) {
      if (!user) {
        var newUser = new Users({
          username: username,
          password: password
        });
        newUser.save(function(err, newUser) {
          util.createSession(req, res, newUser);
        });        
      } else {
        console.log('Account already exists');
        res.redirect('/signup');
      }
    });
};

exports.navToLink = function(req, res) {
  Links.findOne({ code: req.params[0] })
    .exec(function(err, link) {
      if (!link) {
        res.redirect('/');
      } else {
        link.visit++;
        link.save(function(err, data) {
          return res.redirect(data.code);
        });
      }
    });
};
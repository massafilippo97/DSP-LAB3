'use strict';
var path = require('path');
var LoginService = require(path.join(__dirname, '../service/LoginService')); 

/*** Set up Passport ***/
const passport = require('passport'); // auth middleware
//const LocalStrategy = require('passport-local').Strategy; // username and password for login
const JwtStrategy = require('passport-jwt').Strategy; 
const LocalStrategy = require('passport-local').Strategy; // username and password for login

const cookieExtractor = (req) => {
  var token = null;
  if (req && req.cookies)
    token = req.cookies['jwt'];
  
  return token;
};

var opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = "05970414ee49bba340b4cc45cd5b34196716ee10caf5350c78c779cfc3a901f8"; // 64 bytes [credo sia una private key]

/*
when a user requests an operation that requires authentication, an authentication
middleware should check the JWT in the cookies of the request. 
To do so, first you should define a JwtStrategy (see below the corresponding piece
of code). Second, you must use the authentication middle in the route methods that
require it. 

The middleware is specified as: passport.authenticate('jwt', { session: false }). 

If you have used the  pieces of code shown here, and if the verification is
successful, then the field req.user of the request will contain the id of the user
taken from the JWT. 

You can use this information for internal operations (e.g., if the user is trying to
update a task, you check if she is the real owner).
*/

//utile per eseguire la procedura di verifica di autenticazione (quando si prova ad accedere a chiamte API esclusive ad utenti registrati)
passport.use(new JwtStrategy(opts, function(jwt_payload, done){
    return done(null, jwt_payload.user);
  })
);

//utile per eseguire la procedura di autenticazione
passport.use(new LocalStrategy(
  function(username, password, done) {
    LoginService.checkUserInfo(username, password).then((user) => {
        if (!user)
          return done(null, false, { message: 'Incorrect username and/or password.' });
      
        return done(null, user);
    })
  }
));

module.exports = {"passport": passport, "jwtstrategy": JwtStrategy, "opts": opts};
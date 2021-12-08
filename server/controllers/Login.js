'use strict';

var Users = require('../service/UsersService.js');
const { passport, opts, jwtstrategy } = require('../components/passport.js');
var WebSocket = require('../components/websocket');
const jsonwebtoken = require('jsonwebtoken');
 
module.exports.loginPOST = function loginPOST (req, res, next) { 
    //https://medium.com/front-end-weekly/learn-using-jwt-with-passport-authentication-9761539c4314

    passport.authenticate('local', {session: false}, (err, user, info) => { //evoca l'authN locale definita in index.js e al suo termine passa alla callback (successiva)
      if (err || !user) {
        return res.status(400).json({
          message: 'Something is not right',
          user   : user,
          info: info
        });
      }
      req.login(user, {session: false}, (err) => {
        if (err) {
            res.send(err);
        }

          //notify all the clients that a user has logged in the service  
          Users.getUserActiveTask(user.id)
          .then((task) => {
            var loginMessage;
            if(task == undefined) 
              loginMessage = { typeMessage: 'login', userId: user.id, userName: user.name, taskId: undefined, taskName: undefined };
            else 
              loginMessage = { typeMessage: 'login', userId: user.id, userName: user.name, taskId: task.id, taskName: task.description }; 

            WebSocket.sendAllClients(loginMessage);
            WebSocket.saveMessage(user.id, loginMessage);

            // generate a signed son web token with the contents of user object and return it in the response
            //const token = jwt.sign(user, 'your_jwt_secret');
            //return res.json({user, token});
            const token = jsonwebtoken.sign({ user: {id : user.id, name: user.name} }, opts.secretOrKey );
            res.cookie('jwt', token, { httpOnly: true, sameSite: true});
            return res.json({ id: user.id, name: user.name});
          });
    });
  })(req, res);
};


module.exports.logoutPOST = function loginPOST (req, res, next) {   
  //const email = req.body.email;
  //Login.checkUserInfo(email)
    //  .then((user) => {
      //    if (user === undefined) {
        //      utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': 'Invalid e-mail' }],}, 404);
          //} else {
            //notify all clients that a user has logged out from the service
            var logoutMessage = { typeMessage: 'logout', userId: req.user.id, userName: req.user.name, taskId: undefined, taskName: undefined };
            WebSocket.sendAllClients(logoutMessage);
            WebSocket.deleteMessage(req.user.id);
            //clear the cookie
            req.logout();
            res.clearCookie('jwt').end();
            //}
          //});
};



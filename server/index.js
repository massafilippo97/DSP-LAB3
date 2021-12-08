'use strict';

var path = require('path');
var http = require('http');
var oas3Tools = require('oas3-tools');
var serverPort = 3000;

//declaration of the server controllers
var LoginController = require(path.join(__dirname, 'controllers/Login')); 
var TasksController = require(path.join(__dirname, 'controllers/Tasks'));
var AssignedTasksController = require(path.join(__dirname, 'controllers/AssignedTasks'));
var TaskImagesController = require(path.join(__dirname, 'controllers/TaskImages'));
var UsersController = require(path.join(__dirname, 'controllers/Users'));

// swaggerRouter + express + passport configurations
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);

var app = expressAppConfig.getApp();

const { passport, opts, jwtstrategy } = require('./components/passport.js');  
app.use(passport.initialize());


//declaration of the used schema validations
var fs = require('fs');
var { Validator, ValidationError } = require('express-json-validator-middleware');
var taskSchema= JSON.parse(fs.readFileSync('./schemas/TaskSchema_v3.json'));
var validator = new Validator({ allErrors: true });
validator.ajv.addSchema(taskSchema);
var validate = validator.validate;

//middleware / error handler for validation errors [non funziona e da 500 per un qualche motivo]
app.use(function(err, req, res, next) {
  if (err instanceof ValidationError) {
    res.status(400).send('The submitted object does not correspond to the required schema. Try again.');
    next();
  }  
  else 
    next(err);
});

const multer  = require('multer'); //declaration of the middleware useful to handle multipart/form-data type POST requests
const storage = multer.diskStorage({
  destination: function(req,file,cb){
    cb(null,'./task_images');
  },
  filename: function (req, file, cb) {
    let format = file.mimetype.substring(6);
    if(format === 'jpeg') format = "jpg";
    const uniqueSuffix = Date.now() + '-' + (Math.round(Math.random() * 1E9) + "." + format )
    cb(null, 'image-' + uniqueSuffix)
  }
});

const upload = multer({storage : storage}); 


app.get('/api/tasks',passport.authenticate('jwt', {session: false}), TasksController.tasksGET);
app.get('/api/tasks/public', TasksController.tasksPublicGET); //unica chiamata get publica
app.get('/api/tasks/assignedToMe',passport.authenticate('jwt', {session: false}), TasksController.tasksAssignedToMeGET);
app.get('/api/tasks/createdByMe',passport.authenticate('jwt', {session: false}), TasksController.tasksCreatedByMeGET);

app.post('/api/tasks', passport.authenticate('jwt', {session: false}), validate({ body: taskSchema }), TasksController.tasksPOST);
app.get('/api/tasks/:taskId', passport.authenticate('jwt', {session: false}), TasksController.tasksTaskIdGET);
app.put('/api/tasks/:taskId', passport.authenticate('jwt', {session: false}), validate({ body: taskSchema }), TasksController.tasksTaskIdPUT);
app.delete('/api/tasks/:taskId', passport.authenticate('jwt', {session: false}), TasksController.tasksTaskIdDELETE);
app.put('/api/tasks/:taskId/markTask', passport.authenticate('jwt', {session: false}), TasksController.tasksTaskIdMarkTaskPUT);

app.get('/api/tasks/:taskId/assignedTo', passport.authenticate('jwt', {session: false}), AssignedTasksController.tasksTaskIdAssignedToGET);
app.put('/api/tasks/:taskId/assignedTo/:userId', passport.authenticate('jwt', {session: false}), AssignedTasksController.tasksTaskIdAssignedToUserIdPUT);
app.delete('/api/tasks/:taskId/assignedTo/:userId', passport.authenticate('jwt', {session: false}), AssignedTasksController.tasksTaskIdAssignedToUserIdDELETE);

// req.file is the name of your file in the form above, here 'uploaded_file'
// req.body will hold the text fields, if there were any
//app.get('/api/tasks/:taskId/images', passport.authenticate('jwt', {session: false}), TaskImagesController.tasksTaskIdImagesGET);
app.get('/api/tasks/:taskId/images/:imageId', passport.authenticate('jwt', {session: false}), TaskImagesController.tasksTaskIdImagesImageIdGET);
app.post('/api/tasks/:taskId/images', passport.authenticate('jwt', {session: false}), upload.single('uploadedImage'), TaskImagesController.tasksTaskIdImagesPOST);
app.delete('/api/tasks/:taskId/images/:imageId', passport.authenticate('jwt', {session: false}), TaskImagesController.tasksTaskIdImagesImageIdDELETE);

app.post('/api/login', LoginController.loginPOST);
app.post('/api/logout',passport.authenticate('jwt', {session: false}), LoginController.logoutPOST); 

app.get('/api/users', passport.authenticate('jwt', { session: false }), UsersController.usersGET);
app.get('/api/users/:userId', passport.authenticate('jwt', {session: false}), UsersController.usersIdGET);
app.put('/api/users/:userId/selection', passport.authenticate('jwt', { session: false }), AssignedTasksController.selectTask);

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});


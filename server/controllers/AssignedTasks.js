'use strict';

var utils = require('../utils/writer.js');
var AssignedTasks = require('../service/AssignedTasksService');
var Tasks = require('../service/TasksService');

module.exports.tasksTaskIdAssignedToGET = function tasksTaskIdAssignedToGET (req, res, next) {
  AssignedTasks.tasksTaskIdAssignedToGET(req.params.taskId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      if(response === "taskId not found")
        res.status(404).json({ error: "Task not found: can't update because the inserted task id does not exists"}); 
      else
        res.status(503).json({ error: response.message}); //riporta l'errore sql generico
    });
};
 
module.exports.tasksTaskIdAssignedToUserIdDELETE = async function tasksTaskIdAssignedToUserIdDELETE (req, res, next) {
  try {
    const checkOwner = await Tasks.checkTaskOwner(req.params.taskId, req.user.id); //req.user.id 
    if(checkOwner) {
      const checkUser = await AssignedTasks.checkIfUserExists(req.params.userId);;
      if(checkUser) {
        await AssignedTasks.tasksTaskIdAssignedToUserIdDELETE(req.params.taskId, req.params.userId);
        res.status(201).end();
      }
      else {
        throw new Error('404');
      }
    }
    else { 
      throw new Error('403');
    }
  } catch(err) {
    if(err.message === '403')
      res.status(403).json({ error: "Forbidden: can't update because the user is not the task's owner"});
    else if(err.message === '404')
      res.status(404).json({ error: "User not found: can't update because the inserted user id does not exist"});
    else if(err === "taskId not found")
      res.status(404).json({ error: "Task not found: can't update because the inserted task id does not exists"}); 
    else
      res.status(503).json({ error: err}); //riporta l'errore sql generico
  }
};


module.exports.tasksTaskIdAssignedToUserIdPUT = async function tasksTaskIdAssignedToUserIdPUT (req, res, next) {
  try {
    const checkOwner = await Tasks.checkTaskOwner(req.params.taskId, req.user.id); //req.user.id, 1
    if(checkOwner) {
      const checkUser = await AssignedTasks.checkIfUserExists(req.params.userId);;
      if(checkUser) {
        await AssignedTasks.tasksTaskIdAssignedToUserIdPUT(req.params.taskId, req.params.userId);
        res.status(201).end();
      }
      else {
        throw new Error('404');
      }
    }
    else { 
      throw new Error('403');
    }
  } catch(err) {
    if(err.message === '403')
      res.status(403).json({ error: "Forbidden: can't update because the user is not the task's owner"});
    else if(err.message === '404')
      res.status(404).json({ error: "User not found: can't update because the inserted user id does not exist"});
    else if(err === "taskId not found")
      res.status(404).json({ error: "Task not found: can't update because the inserted task id does not exists"}); 
    else
      res.status(503).json({ error: err}); //riporta l'errore sql generico
  }
};

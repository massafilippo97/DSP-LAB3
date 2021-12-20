'use strict';

var utils = require('../utils/writer.js');
var Tasks = require('../service/TasksService');

module.exports.tasksGET = function tasksGET (req, res, next) {
  Tasks.tasksGET( req.user.id, //req.user.id
                  req.query.pageNo > 0 ? req.query.pageNo: 1, 
                  req.query.size > 0 ? req.query.size: -1) 
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      res.status(503).json({ error: response.message});
    });
};

module.exports.tasksPublicGET = function tasksPublicGET (req, res, next) { //chiamata api pubblica
  Tasks.tasksPublicGET( req.query.pageNo > 0 ? req.query.pageNo: 1, 
                        req.query.size > 0 ? req.query.size: -1) 
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      res.status(503).json({ error: response.message});
    });
};

module.exports.tasksAssignedToMeGET = function tasksAssignedToMeGET (req, res, next) {
  Tasks.tasksAssignedToMeGET( req.user.id, //req.user.id
                              req.query.pageNo > 0 ? req.query.pageNo: 1, 
                              req.query.size > 0 ? req.query.size: -1) 
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      res.status(503).json({ error: response.message});
    });
};

module.exports.tasksCreatedByMeGET = function tasksCreatedByMeGET (req, res, next) {
  Tasks.tasksCreatedByMeGET( req.user.id, //req.user.id
                             req.query.pageNo > 0 ? req.query.pageNo: 1, 
                             req.query.size > 0 ? req.query.size: -1) 
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      res.status(503).json({ error: response.message});
    });
};

module.exports.tasksPOST = function tasksPOST (req, res, next) {
  Tasks.searchMaxID()
    .then(function (max_id) {
      Tasks.tasksPOST(req.body, req.user.id, max_id+1) //req.user.id, 1
    })
    .then(function (response) {
      res.status(201).json(response).end(); //response == oggetto appena creato
    })
    .catch(function (response) {
      res.status(503).json({ error: response.message});
    });
};

module.exports.tasksTaskIdDELETE = function tasksTaskIdDELETE (req, res, next) {
  Tasks.checkTaskOwner(req.params.taskId, req.user.id) //req.user.id , 3
    .then(function (response) {
      if(response)
        Tasks.tasksTaskIdDELETE(req.params.taskId);
      else
        res.status(403).json({ error: "Forbidden: can't delete because you are not the task's owner"});
      //aggiungere qui un altro if per 404 task id not found
    })
    .then(response => res.status(204).end())
    .catch(function (response) {
      if(response === "taskId not found")
        res.status(404).json({ error: "Task Not found: can't delete because the inserted task id does not exists"}); 
      else
        res.status(503).json({ error: response.message}); //riporta l'errore sql generico
    });
};

module.exports.tasksTaskIdGET = async function tasksTaskIdGET (req, res, next) {
  try {
    const checkOwner = await Tasks.checkTaskOwner(req.params.taskId, req.user.id); //req.user.id, 1
    if(checkOwner) { 
      const response = await Tasks.tasksTaskIdGET(req.params.taskId, req.user.id);
      res.status(200).json(response).end();
    }
    else { 
      throw new Error('403'); //Forbidden
    }
  } catch(err) {
    if(err.message === '403')
      res.status(403).json({ error: "Forbidden: can't fetch because you are not the task's owner"});
    else if(err === "taskId not found")
      res.status(404).json({ error: "Task Not found: can't fetch because the inserted task id does not exists"}); 
    else
      res.status(503).json({ error: response.message});
  }
};

module.exports.tasksTaskIdMarkTaskPUT = async function tasksTaskIdMarkTaskPUT (req, res, next) {
  Tasks.tasksTaskIdMarkTaskPUT(req.params.taskId, req.user.id)
  .then(function(response) {
      utils.writeJson(res, response, 201);
  })
  .catch(function(response) {
      if(response == 403){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not an assignee of the task' }], }, 403);
      }
      else if (response == 404){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The task does not exist.' }], }, 404);
      }
      else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 503);
      }
  });
};

module.exports.tasksTaskIdPUT = function tasksTaskIdPUT (req, res, next) {
  Tasks.checkTaskOwner(req.params.taskId, req.user.id) //req.user.id , 1
    .then(function (response) {
      if(response)
        Tasks.tasksTaskIdPUT(req.body, req.params.taskId);
      else
        res.status(403).json({ error: "Forbidden: can't update because you are not the task's owner"}); 
    })
    .then(response => res.status(204).end())
    .catch(function (response) {
      if(response === "taskId not found")
        res.status(404).json({ error: "Task Not found: can't update because the inserted task id does not exists"}); 
      else
        res.status(503).json({ error: response.message}); //riporta l'errore sql generico
    });
};

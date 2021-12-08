'use strict';

const db = require('../components/db.js');

const links = { 
  tasks: {href: "http://localhost:8080/tasks", methods: ["GET", "POST"]},
  publicTasks: {href: "http://localhost:8080/tasks/public", methods: ["GET"]},
  createdByMeTasks: {href: "http://localhost:8080/tasks/createdByMe", methods: ["GET"]},
  assignedToMeTasks: {href: "http://localhost:8080/tasks/assignedToMe", methods: ["GET"]},
  task: {href: "http://localhost:8080/tasks/{taskId}", methods: ["GET", "DELETE"]},
  assignedTo: {href: "http://localhost:8080/tasks/{taskId}/assignedTo[/{userId}]", methods: ["GET", "POST", "DELETE"]},
  markTask: {href: "http://localhost:8080/tasks/{taskId}/markTask", methods: ["PUT"]},
  users: {href: "http://localhost:8080/users/", methods: ["GET" ]},
  user: {href: "http://localhost:8080/users/{userId}", methods: ["GET"]},
  login: {href: "http://localhost:8080/login", methods: ["POST"]},
  logout: {href: "http://localhost:8080/logout", methods: ["POST"]}
};

/**
 * Retrieve the list of all the assignes of that task
 *
 * taskId Long Task id to delete
 * returns List
 **/
exports.tasksTaskIdAssignedToGET = function(taskId) {
  return new Promise(function(resolve, reject) {
    var sql_query = "select u.id, u.email, u.name from users u, assignments a where a.user = u.id AND a.task = ?;";

    db.all(sql_query, [taskId], (err, rows) =>{ 
      if(err) {
        reject(err);
        return;
      }
      if(rows.length === 0) {
        reject("taskId not found");
        return;
      }
      let users = rows.map((row) => ({ 
        id: row.id, 
        email: row.email, 
        name: row.name
      }));

      let linksList = Object.assign({}, links);
      delete linksList.assignedTo; 

      resolve({
        users: users,
        _links: { linksList }
      });
    });
  }); 
}

exports.checkIfUserExists = function(taskId) {
  return new Promise(function(resolve, reject) {
    var sql_query = "select * from users u where id = ?";

    db.all(sql_query, [taskId], (err, rows) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(rows.length !== 0);
    })
  }); 
}



/**
 * Remove an user from the assignees user list of that task
 *
 * taskId Long Task id
 * userId Long User id to remove inside the assignees user list
 * no response value expected for this operation
 **/
exports.tasksTaskIdAssignedToUserIdDELETE = function(taskId,userId) {
  return new Promise(function(resolve, reject) {
    const sql_query = 'DELETE from assignments where task = ? and user = ?';
    db.run(sql_query, [taskId, userId], (err, rows)=>{
      if(err) {
        reject(err);
        return;
      }
      resolve(null);
    });
  });
}


/**
 * Assign an [already existing] user to the assignees user list of that task
 *
 * taskId Long Task id
 * userId Long User id to update inside the assigned user list
 * no response value expected for this operation
 **/
exports.tasksTaskIdAssignedToUserIdPUT = function(taskId,userId) {
  return new Promise(function(resolve, reject) {
    const sql_query = "INSERT INTO assignments(task, user) values (?,?)";
    db.run(sql_query, [taskId, userId], (err, rows)=>{
      if(err) {
        reject(err);
        return;
      }
      resolve(null);
    });
  });
}


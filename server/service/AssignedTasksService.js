'use strict';

const db = require('../components/db.js');
var WebSocket = require('../components/websocket');

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



/**
 * Select a task as the active task
 *
 * Input: 
 * - userId: id of the user who wants to select the task
 * - taskId: ID of the task to be selected
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.selectTask = function selectTask(userId, taskId) {
  return new Promise((resolve, reject) => {

    db.serialize(function() {  

      db.run('BEGIN TRANSACTION;');
      const sql1 = 'SELECT t.id FROM tasks as t WHERE t.id = ?';
      db.all(sql1, [taskId], function(err, check) {
          if (err) {
            db.run('ROLLBACK;')
            reject(err);
          } 
          else if (check.length == 0){
            db.run('ROLLBACK;')
            reject(404);
          } 
          else {
            const sql2 = 'SELECT u.name, t.description FROM assignments as a, users as u, tasks as t WHERE a.user = ? AND a.task = ? AND a.user = u.id AND a.task = t.id';
            db.all(sql2, [userId, taskId], function(err, rows) {
              if (err) {
                  db.run('ROLLBACK;')
                  reject(err);
              } else {
                const sql3 = 'UPDATE assignments SET active = 0 WHERE user = ?';
                db.run(sql3, [userId], function(err) {
                  if (err) {
                    db.run('ROLLBACK;')
                    reject(err);
                  } else {
                    const sql4 = 'UPDATE assignments SET active = 1 WHERE user = ? AND task = ?';
                    db.run(sql4, [userId, taskId], function(err) {
                      if (err) {
                        db.run('ROLLBACK;')
                        reject(err);
                      } else if (this.changes == 0) {
                        db.run('ROLLBACK;')
                        reject(403);
                      } else {
                        db.run('COMMIT TRANSACTION');
                        //inform the clients that the user selected a different task where they are working on
                        var updateMessage = { typeMessage: 'update', userId: parseInt(userId), userName: rows[0].name, taskId: parseInt(taskId), taskName: rows[0].description };
                        WebSocket.sendAllClients(updateMessage);
                        WebSocket.saveMessage(userId, { typeMessage: 'login', userId: parseInt(userId), userName: rows[0].name, taskId: parseInt(taskId), taskName: rows[0].description });
            
                        resolve();
                      }
                    })
                  }
                })
              }
          })
        }
      })
    });
  });
}

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
exports.usersIdGET = function(userId) {
  return new Promise(function(resolve, reject) {
    var sql_query = "select u.id, u.email, u.name from users u where u.id = ?";

    db.all(sql_query, [userId], (err, rows) =>{ 
      if(err) {
        reject(err);
        return;
      }
      if(rows.length === 0) {
        reject("userId not found");
        return;
      }

      let linksList = Object.assign({}, links);
      delete linksList.user;
      linksList.self = {href: "http://localhost:8080/users/"+row.id};

      resolve(rows.map((row) => ({ 
        user: {
          id: row.id, 
          email: row.email, 
          name: row.name
        },  
        _links: { linksList }
      })));
    });
  }); 
}



exports.usersGET = function() {
  return new Promise((resolve, reject) => {
      const sql = "SELECT id, name, email FROM users";
      db.all(sql, [], (err, rows) => {
          if (err) {
              reject(err);
          } else {
              if (rows.length === 0)
                   resolve(undefined);
              else {
                  let users = rows.map(((row) => ({ 
                    id: row.id, 
                    email: row.email, 
                    name: row.name
                  })));

                  let linksList = Object.assign({}, links);
                  delete linksList.users; 

                  resolve({
                    users: users,
                    _links: { linksList }
                  });
              }
          }
      });
    });
}


exports.getUserActiveTask = function(user_id) {
  return new Promise((resolve, reject) => {
      const sql = "SELECT t.id, t.description from assignments a , tasks t where a.user = ? and a.active = 1 and a.task = t.id";
      db.all(sql, [user_id], (err, rows) => {
          if (err) {
              reject(err);
          } else {
              if (rows.length === 0)
                   resolve(undefined);
              else { 
                  resolve(rows[0]);
              }
          }
      });
    });
}

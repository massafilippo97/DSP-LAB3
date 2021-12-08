'use strict';

// open the database 
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
 * Retrieve all the tasks
 *
 * filter List Specifies the filter value necessary to filter the list of tasks (optional)
 * returns List
 **/
exports.tasksGET = function(user_id, page, size) {
  return new Promise(function(resolve, reject) {
    //let sql_query = ""; 
    let sql_query = "SELECT t.id, t.description, t.important, t.private, t.project, t.deadline, t.completed, t.owner FROM assignments a, tasks t WHERE t.id = a.task AND a.user = ? UNION SELECT * FROM tasks WHERE owner = ? UNION SELECT * FROM tasks WHERE owner = ?;";
    //https://sqlite.org/lang_datefunc.html

    db.all(sql_query, [user_id, user_id, user_id], (err, rows) =>{ 
      if(err) {
        reject(err);
        return;
      }
 
      if(size === -1){ 
        size = rows.length;
      }

      let totalPages =  Math.ceil(rows.length / size);
      if(page > totalPages) {
        page = totalPages;
      }

      let tasks = rows.map((row) => ({ 
        id: row.id, 
        description: row.description, 
        important: row.important, 
        private: row.private, 
        project: row.project, 
        deadline: row.deadline, 
        completed: row.completed, 
        owner: row.owner
      })).filter((row, index) => index >= (parseInt(page)-1)*parseInt(size) && index < parseInt(page) * parseInt(size));

      let linksList = Object.assign({}, links);
      delete linksList.tasks;

      resolve({
        totalPages: totalPages,
        currentPage: page,
        totalItems: rows.length,
        tasks: tasks,
        _links: { linksList }
      });
    });
  });
};


exports.tasksPublicGET = function(page, size) {
  return new Promise(function(resolve, reject) {
    let sql_query = "SELECT * FROM tasks WHERE private = 0;";
 
    db.all(sql_query, [], (err, rows) =>{ 
      if(err) {
        reject(err);
        return;
      }
 
      if(size === -1){ 
        size = rows.length;
      }

      let totalPages =  Math.ceil(rows.length / size);
      if(page > totalPages) {
        page = totalPages;
      }

      let tasks = rows.map((row) => ({ 
        id: row.id, 
        description: row.description, 
        important: row.important, 
        private: row.private, 
        project: row.project, 
        deadline: row.deadline, 
        completed: row.completed, 
        owner: row.owner
      })).filter((row, index) => index >= (parseInt(page)-1)*parseInt(size) && index < parseInt(page) * parseInt(size));

      let linksList = Object.assign({}, links);
      delete linksList.publicTasks;
      linksList.next = {href:"/api/tasks/public?pageNo=" + (page+1)%totalPages+1},

      resolve({
        totalPages: totalPages,
        currentPage: page,
        totalItems: rows.length,
        tasks: tasks,
        _links: { linksList }
      });

      /*resolve(rows.map((row) => ({ 
        id: row.id, 
        description: row.description, 
        important: row.important, 
        private: row.private, 
        project: row.project, 
        deadline: row.deadline, 
        completed: row.completed, 
        owner: row.owner,
        _links: {
          self: {href: "http://localhost:8080/tasks/"+row.id},
          tasks: {href: "http://localhost:8080/tasks"},
          user: {href: "http://localhost:8080/users/{userId}"},
          assignedTo: {href: "http://localhost:8080/tasks/{taskId}/assignedTo"},
          markTask: {href: "http://localhost:8080/tasks/{taskId}/markTask"},
          logout: {href: "http://localhost:8080/logout"}
        }
      })).filter((row, index) => index >= parseInt(page)*parseInt(size) && index < (parseInt(page)+1) * parseInt(size)));*/
    });
  });
};

exports.tasksAssignedToMeGET = function(user_id, page, size) {
  return new Promise(function(resolve, reject) {
    let sql_query = "SELECT t.id, t.description, t.important, t.private, t.project, t.deadline, t.completed, t.owner FROM assignments a, tasks t WHERE t.id = a.task AND user = ?;"
 
    db.all(sql_query, [user_id], (err, rows) =>{ 
      if(err) {
        reject(err);
        return;
      }
 
      if(size === -1){ 
        size = rows.length;
      }
 
      let totalPages =  Math.ceil(rows.length / size);
      if(page > totalPages) {
        page = totalPages;
      }

      let tasks = rows.map((row) => ({ 
        id: row.id, 
        description: row.description, 
        important: row.important, 
        private: row.private, 
        project: row.project, 
        deadline: row.deadline, 
        completed: row.completed, 
        owner: row.owner,
      })).filter((row, index) => index >= (parseInt(page)-1)*parseInt(size) && index < parseInt(page) * parseInt(size));

      let linksList = Object.assign({}, links);
      delete linksList.assignedToMeTasks;
      linksList.next = {href:"/api/tasks/assignedToMe?pageNo=" + (page+1)%totalPages+1},

      resolve({
        totalPages: totalPages,
        currentPage: page,
        totalItems: rows.length,
        tasks: tasks, 
        _links: { linksList }
      });
    });
  });
};

exports.tasksCreatedByMeGET = function(user_id, page, size) {
  return new Promise(function(resolve, reject) {
    let sql_query = "SELECT * FROM tasks WHERE owner = ?;";  
 
    db.all(sql_query, [user_id], (err, rows) =>{ 
      if(err) {
        reject(err);
        return;
      }
 
      if(size === -1){ 
        size = rows.length;
      }

      let totalPages =  Math.ceil(rows.length / size);
      if(page > totalPages) {
        page = totalPages;
      }

      let tasks = rows.map((row) => ({ 
        id: row.id, 
        description: row.description, 
        important: row.important, 
        private: row.private, 
        project: row.project, 
        deadline: row.deadline, 
        completed: row.completed, 
        owner: row.owner,
      })).filter((row, index) => index >= (parseInt(page)-1)*parseInt(size) && index < parseInt(page) * parseInt(size));

      let linksList = Object.assign({}, links);
      delete linksList.createdByMeTasks;
      linksList.next = {href:"/api/tasks/createdByMe?pageNo=" + (page+1)%totalPages+1},

      resolve({
        totalPages: totalPages,
        currentPage: page,
        totalItems: rows.length,
        tasks: tasks, 
        _links: { linksList }
      });
    });
  });
};


/**
 * Add a new task (ID is automatically generated by the server and the creator becomes its owner [assignees list is left empty])
 *
 * body List It is required a single Task object (optional)
 * no response value expected for this operation
 **/
exports.tasksPOST = function(body, user_id, max_id) { //body == new task
  return new Promise(function(resolve, reject) {
    const sql_query = "INSERT INTO tasks(id,description,important,private,project,deadline,completed,owner) VALUES (?,?,?,?,?,?,?,?)";
    db.run(sql_query, [max_id, body.description, body.important, body.private, body.project, body.deadline, body.completed, user_id], (err, rows)=>{
      if(err) {
        reject(err);
        return;
      }

      let linksList = Object.assign({}, links);
      linksList.self = {href: "http://localhost:8080/tasks/"+max_id};

      resolve({ 
        task: {
          id: max_id, 
          description: body.description, 
          important: body.important, 
          private: body.private, 
          project: body.project, 
          deadline: body.deadline, 
          completed: body.completed, 
          owner: user_id,
         },
        _links: { linksList }
      });
    });
  });
};

//search the max possible id from all registered tasks (useful when automatically assigning a new taskID)
exports.searchMaxID = () => {
  return new Promise((resolve, reject) => {
    const sql_query = "SELECT max(id) AS max_id FROM tasks;";
    db.all(sql_query, [], (err, rows)=>{
      if(err) {
        reject(err);
        return;
      }
      resolve(rows[0].max_id);
    });
  });
}

/**
 * Delete an existing task by ID (if the requester is the owner)
 *
 * taskId Long Task id to delete
 * no response value expected for this operation
 **/
exports.tasksTaskIdDELETE = function(taskId) {
  return new Promise((resolve, reject)=> {
    const sql_query = 'DELETE FROM tasks WHERE id=?';
    db.run(sql_query, [taskId], (err, rows)=>{
      if(err) {
        reject(err);
        return;
      }
      resolve(null);
    });
  });
};

//executed before the delete to check if the requester is the owner of the task
exports.checkTaskOwner = function(taskId, userId) {
  return new Promise((resolve, reject) => {
    const sql_query = 'SELECT owner FROM tasks WHERE id=?';
    db.all(sql_query, [taskId], (err, rows) => {
      if(err) {
        reject(err);
        return;
      }
      if(rows.length === 0) {
        reject("taskId not found");
        return;
      }
      resolve(rows[0].owner === userId) 
      //resolve(rows[0].owner);
    })
  })
}


/**
 * Retrieve the specific tasks by its ID
 *
 * taskId Long Task id to delete
 * returns List
 * 
 * The user can retrieve a single existing task, identified by the specified id, if at least one of the following conditions is satisfied:
 * 1) the task is public;
 * 2) the user is the owner of the task;
 * 3) the user is an assignee of the task.
 **/
exports.tasksTaskIdGET = function(taskId, userId) {
  return new Promise(function(resolve, reject) {
 
      var sql_query = "SELECT t.id, t.description, t.important, t.private, t.project, t.deadline, t.completed, t.owner FROM assignments a, tasks t WHERE t.id = a.task and t.id = ? AND a.user = ? UNION SELECT * FROM tasks WHERE id = ? and owner = ? UNION SELECT * FROM tasks WHERE id = ? and owner = ?;" //union delle assignedToMe e createdByMe queries+ restanti tasks public

    
    db.all(sql_query, [taskId, userId, taskId, userId, taskId, userId], (err, rows) =>{
      if(err){
        reject(err);
        return;
      }
      if(rows.length === 0 && userId !== undefined) {
        reject("taskId not found");
        return;
      } 

      let linksList = Object.assign({}, links);
      delete linksList.task;

      resolve(rows.map((row) => ({ 
        task: {
          id: row.id, 
          description: row.description, 
          important: row.important, 
          private: row.private, 
          project: row.project, 
          deadline: row.deadline, 
          completed: row.completed, 
          owner: row.owner
        },
        _links: { linksList }
      })));
    });
  });
};

/**
 * Change the specified Task's status as completed (or not?)
 *
 * taskId Long Task id
 * no response value expected for this operation
 **/
exports.tasksTaskIdMarkTaskPUT = function(taskId, completed) {
  return new Promise((resolve, reject) => {
    const sql_query =  "UPDATE tasks SET completed=? WHERE id=?";  
    db.run(sql_query, [!JSON.parse(completed),taskId], (err, rows)=>{
      if(err) {
        reject(err);
        return;
      }
      resolve(null);
    });
  });
}

//fetch the current value for the completed attribute of the specific task (useful when marking the task as completed or uncompleted)
exports.checkCompleteValue = (taskId) => {
  return new Promise((resolve, reject) => {
    const sql_query = "SELECT completed FROM tasks WHERE id = ?;";
    db.all(sql_query, [taskId], (err, rows)=>{
      if(err) {
        reject(err);
        return;
      }
      resolve(rows[0].completed);
    });
  });
}



/**
 * Update an existing task, identified by the specified ID (if the requester is the owner) [completed property cannot be changed here]
 *
 * body List It is required a single Task object (optional)
 * taskId Long Task id to update
 * no response value expected for this operation
 **/
exports.tasksTaskIdPUT = function(body,taskId) {
  return new Promise((resolve, reject) => {
    const sql_query = "UPDATE tasks SET description=?,important=?,private=?,project=?,deadline=?,completed=?, owner=? WHERE id=?";
    db.run(sql_query, [body.description, body.important,body.private,body.project, body.deadline,body.completed, body.owner, taskId], (err, rows)=>{
      if(err) {
        reject(err);
        return;
      }
      resolve(null);
    });
  });
}


/**
 * All the API calls
 */

import dayjs from 'dayjs';
import Task from './components/Task';
import User from './components/User';


const BASEURL = '/api';

function getJson(httpResponsePromise) {
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // always return {} from server, never null or non json, otherwise it will fail
         if(response.status !== 201) {
          response.json()
              .then( json => resolve(json) )
              .catch( err => reject({ error: "Cannot parse server response" }))
         }
         else
          resolve();

        } else {
          // analyze the cause of error
          response.json()
            .then(obj => reject(obj)) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err => reject({ error: "Cannot communicate"  })) // connection error
  });
}

const getTasks = async (filter, page) => {
  

let url =  filter === 'owned'
  ? BASEURL + '/tasks/createdByMe' //'/users/'+ localStorage.getItem('userId') + '/tasks/created'
  : BASEURL + '/tasks/assignedToMe' //'/users/'+ localStorage.getItem('userId') + '/tasks/assigned'

if (page) {
  url += "?pageNo=" + page;
}  
  return getJson(
    fetch(url)
  ).then( json => {
    
    localStorage.setItem('totalPages',  json.totalPages);
    localStorage.setItem('currentPage', json.currentPage);
    localStorage.setItem('totalItems',  json.totalItems);
    const tasksJson = json.tasks;
    return tasksJson.map((task) => Object.assign({}, task, { deadline: task.deadline && dayjs(task.deadline) }))
    
  })
}


const getPublicTasks = async (page) => { //ok
  

  let url =  BASEURL + '/tasks/public';
  if (page) {
    url += "?pageNo=" + page;
  } 
 
  return getJson(
      fetch(url)
    ).then( json => {
      
      localStorage.setItem('totalPages',  json.totalPages);
      localStorage.setItem('currentPage', json.currentPage);
      localStorage.setItem('totalItems',  json.totalItems);
      const tasksJson = json.tasks;
      return tasksJson.map((task) => Object.assign({}, task, { deadline: task.deadline && dayjs(task.deadline) }))
    })

  }


async function getAllOwnedTasks() { //ok?

    //let url =  BASEURL + '/users/'+ localStorage.getItem('userId') + '/tasks/created';
    let url =  BASEURL + '/tasks/createdByMe';
    let allTasks = [];
    let finished = false;

    while(!finished){
        const response = await fetch(url);
        const responseJson = await response.json();
        const tasksJson = responseJson.tasks;

        if (response.ok) {
            tasksJson.forEach(
                (t) => {
                    let task = new Task(t.id, t.description, t.important, t.privateTask, t.deadline, t.project, t.completed);
                    allTasks.push(task);
                }
            );
            if(responseJson._links.next == undefined){
                finished = true;
            } else {
                url = responseJson._links.next;
            }

        } else {
            let err = { status: response.status, errObj: tasksJson };
            throw err; // An object with the error coming from the server
        }

    }

    return allTasks;

}

function addTask(task) { //ok 
  return getJson(
    fetch(BASEURL + "/tasks", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      
      body: JSON.stringify({ ...task, completed: 0})
    })
  )
}

function updateTask(task) { //ok
  return fetch(BASEURL + "/tasks/" + task.id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task)
    }
  )
}

async function deleteTask(task) { //ok
  const response = await fetch(BASEURL + "/tasks/" + task.id, {method: 'DELETE'});
  if(!response.ok){
    let err = { status: response.status, errObj: response.json };
    throw err; 
  }
}

async function completeTask(task) { //ok
  //const response = await fetch(BASEURL + "/tasks/" + task.id + '/completion', {method: 'PUT'});
  const response = await fetch(BASEURL + "/tasks/" + task.id + '/markTask', {method: 'PUT'});
  if(!response.ok){
    let err = { status: response.status, errObj: response.json };
    throw err; 
  }
}

async function selectTask(task) { //nuova api server 
  const response = await fetch(BASEURL + "/users/" + localStorage.getItem('userId') + '/selection', {method: 'PUT', headers: {'Content-Type': 'application/json',},
                    body: JSON.stringify(task)});
  if(!response.ok){
    let err = { status: response.status, errObj: response.json };
    throw err; 
  }
}

async function logIn(credentials) { //ok
  //let response = await fetch('/api/users/authenticator?type=login', {
    let response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if(response.ok) {
    const user = await response.json();
    localStorage.setItem('userId', user.id);
    localStorage.setItem('username', user.name);
    localStorage.setItem('email', credentials.email);
    return user;
  }
  else {
    try {
      const errDetail = await response.json();
      throw errDetail.message;
    }
    catch(err) {
      throw err;
    }
  }
}

async function logOut() { //api mancante
  await fetch('/api/logout', { method: 'POST',headers: {'Content-Type': 'application/json',},
          body: JSON.stringify({ email: localStorage.getItem('email'), password:  localStorage.getItem('password') }), });
}

async function getUserInfo() {
  //const response = await fetch(BASEURL + '/sessions/current');
  //const userInfo = await response.json();
  if(localStorage.getItem('userId')){
    return true
  } else {
    return false;
  }
  /*if (response.ok) {
    return userInfo;
  } else {
    throw userInfo;  // an object with the error coming from the server, mostly unauthenticated user
  }*/
}

async function getUsers() { //api mancante

  let url = "/users";

  const response = await fetch(BASEURL + url);
  const responseJson = await response.json();
  if (response.ok) {
      return responseJson.users.map((u) => new User(u.id, u.name, u.email));
  } else {
      let err = { status: response.status, errObj: responseJson };
      throw err; // An object with the error coming from the server
  }

}

async function assignTask(userId,taskId) {
  return new Promise((resolve, reject) => {
      //let userId = Number( localStorage.getItem("user"))
      fetch(BASEURL + "/tasks/"+taskId+"/assignedTo/"+userId, {
          method: 'PUT'
      }).then((response) => {
          if (response.ok) {
             resolve(null)
          } else {
              // analyze the cause of error
              response.json()
                  .then((obj) => { reject(obj); }) // error msg in the response body
                  .catch((err) => { reject({ errors: [{ param: "Application", msg: "Cannot parse server response" }] }) }); // something else
          }
      }).catch((err) => { reject({ errors: [{ param: "Server", msg: "Cannot communicate" }] }) }); // connection errors
  });
}

async function removeAssignTask(userId,taskId) {
  return new Promise((resolve, reject) => {
      //let userId = Number( localStorage.getItem("user"))
      fetch(BASEURL + "/tasks/"+taskId+"/assignedTo/"+userId, {
          method: 'DELETE'
      }).then((response) => {
          if (response.ok) {
             resolve(null)
          } else {
              // analyze the cause of error
              response.json()
                  .then((obj) => { reject(obj); }) // error msg in the response body
                  .catch((err) => { reject({ errors: [{ param: "Application", msg: "Cannot parse server response" }] }) }); // something else
          }
      }).catch((err) => { reject({ errors: [{ param: "Server", msg: "Cannot communicate" }] }) }); // connection errors
  });
}

const API = { addTask, getTasks, getPublicTasks, getAllOwnedTasks, updateTask, deleteTask, selectTask, logIn, logOut, getUserInfo, getUsers, assignTask, removeAssignTask, completeTask }
export default API;


'use strict';

const db = require('../components/db.js');
const bcrypt = require('bcrypt');

/**
 * Perform the logout process
 *
 * no response value expected for this operation
 **/
/*
exports.loginDELETE = function() {
  return new Promise(function(resolve, reject) { //??? come si fa il logout?
    resolve();
  });
}
*/

/**
 * Useful to check user and password validity 
 *
 * no response value expected for this operation
 **/
exports.checkUserInfo = (email, password) => { 
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE email=?';
        db.get(sql, [email], (err, row) => {
            if (err) 
                reject(err);
            else if (row === undefined)   //nessun utente trovato all'interno del db
                resolve(false); 
            else {                        //utente trovato            
                const user = {id: row.id, username: row.email, name: row.name};
                bcrypt.compare(password, row.hash).then(result => { //check if the two hashes match with an async call
                    if(result)
                        resolve(user);      //password corretta --> manda info dell'account
                    else
                        resolve(false);     //rigetta login (password errata)
                });
            }
        });
    });
};

/*exports.loginPOST = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}*/

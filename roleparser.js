exports.loadRoles = function() {
    let roles = require(ROLES_FILES);
    if(roles.hasOwnProperty('roles')) {
        for (var property in roles) {
            setRoles(property, roles)
        }
    }
}

function setRoles(roles, superclass){
    let subroles = null;
    let currentRole = new Object();
    for (var property in roles) {
    }
}

function getDefault() {
    
}

exports.setRole = function() {
    return "Hello";
}

exports.removeRole = function() {
    return "Hello";
}
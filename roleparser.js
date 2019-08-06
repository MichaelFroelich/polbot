require('./constants.js');

const DefaultRole = {
    exclusive: false,
    persistent: false,
    color: 0,
    reaction: null, //moderator assigned or default is true
    channel: null, //moderator assigned or default is true
    default: false,
    roles: {}
};

var Client;

exports.loadRoles = function(CurrentClient) {
    Client = CurrentClient;
    var roles = require(RolesFile);
    var defaultedRoles = Object.assign(DefaultRole, roles); //The root of the roles file forms the current default

    for(let role of Object.entries(roles.roles)) {
        setRoles(roles, role);
    }
}



function setRoles(parentRole, currentRole){
    Client;
    var roleName = currentRole[0];
    var defaultedRole = Object.assign(parentRole, currentRole[1]);
    for (let property in defaultedRole) {
    }
}

exports.setRole = function() {
    return "Hello";
}

exports.removeRole = function() {
    return "Hello";
}


/*
guild.createRole({
  name: 'Super Cool People',
  color: 'BLUE',
})
  .then(role => console.log(`Created new role with name ${role.name} and color ${role.color}`))
  .catch(console.error)
  */
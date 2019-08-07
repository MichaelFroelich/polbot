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
var Guilds;

/**
 * @param {Client} CurrentClient
 */
exports.loadRoles = function(CurrentClient) {
    Client = CurrentClient;
    Guilds = Client.guilds;
    var roles = require(RolesFile);
    var defaultedRoles = Object.assign(DefaultRole, roles); //The root of the roles file forms the current default

    for(let role of Object.entries(roles.roles)) {
        setRoles(roles, role);
    }
}



function setRoles(parentRole, currentRole){
    checkIfRoleExists(currentRole);


    var roleName = currentRole[0];
    var defaultedRole = Object.assign(parentRole, currentRole[1]);
    for (let property in defaultedRole) {
        for(let guild in Guilds.entries()) {
            //guild.createRole();
            console.log('start making roles here');
        }
    }
}

/**
 * TODO: some fuzzy detection here
 */
function checkIfRoleExists(currentRole) {
    let entree = Guilds.entries();
    for(let guild of Guilds.entries()) {
        for(let role of guild[1].roles.entries()) {
            //guild.createRole();
            console.log('start making roles here');
        }
    }
    //czechking
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
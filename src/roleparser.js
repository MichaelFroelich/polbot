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
exports.loadRoles = function (CurrentClient) {
    Client = CurrentClient;
    Guilds = Client.guilds;
    var roles = require(RolesFile);
    var defaultedRoles = Object.assign(DefaultRole, roles); //The root of the roles file forms the current default

    for (let role of Object.entries(defaultedRoles.roles)) {
        setRoles(defaultedRoles, role);
    }
}

function setRoles(parentRole, currentRole) {
    var roleName = currentRole[0];
    var defaultedRole = Object.assign(parentRole, currentRole[1]);
    defaultedRole.roles = currentRole[1].roles;
    if (defaultedRole.roles !== undefined) {
        for (let role of Object.entries(defaultedRole.roles)) {
            setRoles(defaultedRole, role);
        }
    }
    createRole(defaultedRole); 
}

function createRole(defaultedRole, ) {
    var mappedRole = mapRole(defaultedRole);
    /*
    for (let property in defaultedRole) {
        for (let guild in Guilds.values()) {
            let existentRole = checkIfRoleExists(currentRole, guild);
            if (existentRole != null) {
                existentRole.edit();
            }
            else {
                guild.createRole();
            }
            console.log('start making roles here');
        }
    }*/
}

function mapRole(role) {
    return {

    };
}

/**
 * TODO: some fuzzy detection here
 */
function checkIfRoleExists(currentRole) {
    for (let guild of Guilds.values()) {
        for (let role of guild.roles.values()) {
            //guild.createRole();
            console.log('start making roles here');
        }
    }
    //czechking
}

exports.setRole = function () {
    return "Hello";
}

exports.removeRole = function () {
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
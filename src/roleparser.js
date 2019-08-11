require('./constants.js');
const FuzzySet = require('fuzzyset.js');
const EqualityAmount = 0.5;

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
    createRole(defaultedRole, roleName);
}

function createRole(role, roleName) {
    var mappedRole = mapRole(role, roleName);
    for (let guild of Guilds.values()) {
        let existingRole = checkIfRoleExists(roleName);
        if (existingRole == null) {
            guild.createRole(mappedRole);
        }
        else {
            existingRole.edit(mappedRole);
        }
            //TODO: other stuff, like check existing reactors
    }
}

function mapRole(role, roleName) {
    return {
        name: roleName,
        color: role.color,
        hoist: true,
        permissions: 0 //for now
    };
}

/**
 * TODO: some fuzzy detection here
 */
function checkIfRoleExists(roleName, guild) {
    //TODO: Figure out how to populate the fuzzset

    a = FuzzySet.FuzzySet(getAllRolesFromGuild(guild));
    var val = a.get(roleName);
    if (val[0] > EqualityAmount) {
        return val[1];
    }
    return null;
}

exports.setRole = function () {
    return "Hello";
}

exports.removeRole = function () {
    return "Hello";
}
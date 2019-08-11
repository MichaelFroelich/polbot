require('./constants.js');
const FuzzySet = require('fuzzyset.js');
const EqualityAmount = 0.5;

const DefaultRole = {
    exclusive: false,
    persistent: false,
    color: 0,
    reaction: null, //moderator assigned or initial is true
    channel: null, //moderator assigned or initial is true
    initial: false,//a role everyone gets initially
    roles: {}
};

var Client;
var Guilds;
var Sets;

/**
 * @param {Client} CurrentClient
 */
exports.loadRoles = function (CurrentClient) {
    Client = CurrentClient;
    populateGuildSets(Client.guilds);
    var roles = require(RolesFile);
    var defaultedRoles = Object.assign(DefaultRole, roles); //The root of the roles file forms the current default

    for (let role of Object.entries(defaultedRoles.roles)) {
        setRoles(defaultedRoles, role);
    }
}

function populateGuildSets(guilds) {
    Guilds = guilds; //why not
    Sets = new Map();
    
    for (let guild of Guilds.values()) {
        roleSet = FuzzySet();
        for(let role of guild.roles.values()) {
            roleSet.add(role.name);
        }
        Sets.set(guild.name, roleSet);
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
        let existingRole = checkIfRoleExists(roleName, guild);
        if (existingRole == null) {
            guild.createRole(mappedRole);
        }
        else {
            if(existingRole.name === "@everyone") {
                mappedRole.name = "@everyone"; // do not change this name
            }
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

function checkIfRoleExists(roleName, guild) {
    a = Sets.get(guild.name)
    var results = a.get(roleName);
    if(results.length > 0) {
        result = results[0];
        if(result[0] > EqualityAmount) {
            return getRoleFromGuild(result[1], guild);
        }
    }
    return null;
}

function getRoleFromGuild(roleName, guild) {
    for(let role of guild.roles.values()) {
        if(role.name == roleName) {
            return role;
        }
    }
}

exports.setRole = function () {
    return "Hello";
}

exports.removeRole = function () {
    return "Hello";
}
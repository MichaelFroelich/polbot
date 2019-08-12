require('./constants.js');
const FuzzySet = require('fuzzyset.js');
const EqualityAmount = 0.5;
const StartingPosition = 10; //arbitrary number greater than the number of unmanaged roles, like staff
const DefaultRole = {
    exclusive: false,
    persistent: false,
    color: 0,
    reaction: null, //moderator assigned or initial is true
    channel: null, //moderator assigned or initial is true
    initial: false,//a role everyone gets initially
    roles: {}
};

var position;
var Client;
var Guilds;
var GuildSets;
var RoleChannels;
var Roles;

exports.setRole = function (reaction, user) {
    return "Hello";
}

exports.removeRole = function (reaction, user) {
    return "Hello";
}

/**
 * @param {Client} CurrentClient
 */
exports.loadRoles = function (CurrentClient) {
    position = StartingPosition;
    Client = CurrentClient;
    Guilds = Client.guilds;
    var roles = require(RolesFile);
    RoleChannels = new Map();
    Roles = new Map();

    populateGuildSets(Client.guilds);
    var defaultedRoles = Object.assign(DefaultRole, roles); //The root of the roles file forms the current default
    for (let role of Object.entries(defaultedRoles.roles)) {
        setRoles(defaultedRoles, role);
    }

    Roles;
}

function populateGuildSets() {
    GuildSets = new Map();
    for (let guild of Guilds.values()) {
        roleSet = FuzzySet();
        for (let role of guild.roles.values()) {
            roleSet.add(role.name);
        }
        GuildSets.set(guild.name, roleSet);
    }
}

function setRoles(parentRole, currentRole) {
    var roleName = currentRole[0];
    var defaultedRole = Object.assign(parentRole, currentRole[1]);
    defaultedRole.position = position++;
    defaultedRole.roles = currentRole[1].roles;

    //find all the roles in the json structure
    if (defaultedRole.roles !== undefined) {
        for (let role of Object.entries(defaultedRole.roles)) {
            setRoles(defaultedRole, role);
        }
    }

    //finished finding all the roles, now we add them
    var mappedRole = mapRole(defaultedRole, roleName);
    addRoleChannel(defaultedRole.channel);
    for (let guild of Guilds.values()) {
        let existingRole = checkIfRoleExists(roleName, guild);
        if (existingRole == null) {
            guild.createRole(mappedRole);
        }
        else {
            if (existingRole.name === "@everyone") {
                mappedRole.name = "@everyone"; // do not change this name
            }
            if (!rolesEqual(existingRole, mappedRole)) { //save some time and skip this if they're equal
                existingRole.edit(mappedRole);
            }
        }
    }
    Roles.set(roleName, defaultedRole);
}

/**
 * Itterates all role channels associated to this role
 * @param {*} roleChannels 
 */
function addRoleChannel(roleChannels) {
    for (let roleChannel of roleChannels) {
        if (RoleChannels.has(roleChannel)) {
            return; //nothing to do here
        }
        for (let guild of Guilds.values()) {
            for (let channel of guild.channels.entries()) {
                if (roleChannel === channel[0]) {
                    RoleChannels.set(channel[0], channel[1]);
                }
            }
        }
    }
}

function mapRole(role, roleName) {
    return {
        name: roleName,
        color: role.color,
        hoist: false
        //permissions: 0 //for now
    };
}

function checkIfRoleExists(roleName, guild) {
    a = GuildSets.get(guild.name)
    var results = a.get(roleName);
    if (results !== null && results.length > 0) {
        result = results[0];
        if (result[0] > EqualityAmount) {
            return getRoleFromGuild(result[1], guild);
        }
    }
    return null;
}

function getRoleFromGuild(roleName, guild) {
    for (let role of guild.roles.values()) {
        if (role.name == roleName) {
            return role;
        }
    }
}

//Todo: remember to add any new fields here or do reflection
function rolesEqual(first, second) {
    if (first.name === second.name && first.color === second.color) {
        return true;
    }
    else {
        return false
    }
}

//let myRole = message.guild.roles.find(role => role.name === "Moderators");
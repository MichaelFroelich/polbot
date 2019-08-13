require('./constants.js');
const Log = require('./log.js');
const FuzzySet = require('fuzzyset.js');
const EqualityAmount = 0.5;
const StartingPosition = 10; //arbitrary number greater than the number of unmanaged roles, like staff
const DefaultRole = {
    exclusive: false,
    persistent: false,
    color: 0,
    reaction: null, //moderator assigned or initial is true
    channels: [], //moderator assigned or initial is true
    initial: false,//a role everyone gets initially
    permissions: [],
    roles: {}
};

var position;
var Client;
var Guilds;
var GuildSets;
var Roles;
var InitialRoles;

exports.guildMemberAdd = function (member) {
    if (!member.user.bot) {
        for (let role of InitialRoles.keys()) {
            member.addRole(getRoleFromGuild(role, member.guild));
        }
    }
}

exports.setRole = function (reaction, user) {
    var id = reaction.message.channel.id;
    var guild = reaction.message.guild;
    for (let RoleChannels of Roles.values()) {
        if (RoleChannels.has(id)) {
            for (let role of Roles.entries()) {
                if (role.channels.includes(id) && reactionEquals(reaction.emoji, role.reaction)) {
                    roleId = getRoleFromGuild(role.name, guild).id;
                    guild.members.get(user.id).addRole(roleId);
                }
            }
        }
    }
}

exports.removeRole = function (reaction, user) {
    var id = reaction.message.channel.id;
    var guild = reaction.message.guild;
    for (let RoleChannels of Roles.values()) {
        if (RoleChannels.has(id)) {
            for (let role of Roles.entries()) {
                if (role.channels.includes(id) && reactionEquals(reaction.emoji, role.reaction)) {
                    roleId = getRoleFromGuild(role.name, guild).id;
                    guild.members.get(user.id).removeRole(roleId);
                }
            }
        }
    }
}

function reactionEquals(discordReaction, ourReaction) {
    var unicode = discordReaction.identifier.replace(new RegExp('%', 'g'),'');
    if (discordReaction.identifier == ourReaction ||
        discordReaction.id == ourReaction ||
        discordReaction.name == ourReaction ||
        discordReaction.identifier.endsWith(unicode) ||
        discordReaction == ourReaction) {
        return true;
    }
    else
        return false
}

/**
 * @param {Client} CurrentClient
 */
exports.loadRoles = function (CurrentClient) {
    position = StartingPosition;
    Client = CurrentClient;
    Guilds = Client.guilds;
    var roles = require(RolesFile);
    Roles = new Map();
    InitialRoles = new Map();
    populateGuildSets(Client.guilds);
    var defaultedRoles = AssignUndefined(roles, DefaultRole); //The root of the roles file forms the current default
    for (let role of Object.entries(defaultedRoles.roles)) {
        setRoles(defaultedRoles, role);
    }
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
    var defaultedRole = AssignUndefined(currentRole[1], parentRole);
    defaultedRole.position = position++;
    defaultedRole.roles = currentRole[1].roles;
    defaultedRole.parent = parentRole; //used later for finding mutually exclusive roles
    Roles.set(roleName, defaultedRole);
    if (defaultedRole.initial) {
        InitialRoles.set(roleName, defaultedRole);
    }

    //find all the roles in the json structure
    if (defaultedRole.roles !== undefined) {
        for (let role of Object.entries(defaultedRole.roles)) {
            setRoles(defaultedRole, role);
        }
    }

    //finished finding all the roles, now we add them
    var mappedRole = mapRole(defaultedRole, roleName);
    defaultedRole.channels = addRoleChannel(defaultedRole.channels);
    for (let guild of Guilds.values()) {
        let existingRole = checkIfRoleExists(roleName, guild);
        if (existingRole == null) {
            guild.createRole(mappedRole).then(
                value => Log.LogSuccess("create role", value),
                reason => LogFail("create role", reason));
        }
        else {
            if (existingRole.name === "@everyone") {
                mappedRole.name = "@everyone"; // do not change this name
            }
            if (!rolesEqual(existingRole, mappedRole)) { //save some time and skip this if they're equal
                existingRole.edit(mappedRole).then(
                    value => Log.LogSuccess("edit role", value),
                    reason => LogFail("edit role", reason));
            }
        }
    }
    processReactions(defaultedRole); //check the role channels
    //processVacancies(defaultedRole); //check the role channels
}

function addRoleChannel(roleChannels) {
    var channels = new Map();
    for (let roleChannel of roleChannels) {
        for (let guild of Guilds.values()) {
            for (let channel of guild.channels.entries()) {
                if (channelsEqual(channel, roleChannel)) {
                    channels.set(channel[0], channel[1]);
                }
            }
        }
    }
    return channels;
}

function channelsEqual(discordsChannel, ourChannel) {
    if(ourChannel == discordsChannel.id || ourChannel == discordsChannel.name) {
        return true;
    } else {
        return false;
    }
}

function mapRole(role, roleName) {
    return {
        name: roleName,
        color: role.color,
        hoist: false,
        permissions: role.permissions
    };
}

function checkIfRoleExists(roleName, guild) {
    a = GuildSets.get(guild.name)
    var results = a.get(roleName);
    if (results !== null && results.length > 0) {
        for (i = 0; i < results.length; i++) {
            result = results[i];
            if (Roles.has(result[1]) && result[0] < 1)
                continue;
            if (result[0] > EqualityAmount) {
                return getRoleFromGuild(result[1], guild);
            }
        }
    }
    return null;
}

function processReactions(role) {
    if(debug) {
        mychan = "513321055645859855";
        myguild = Guilds.values().next().value;
        realchan = myguild.channels.get(mychan);
        mychan = myguild.channels.get(mychan);
        role.channels.set("whatveve", mychan);
    }
    for (let channel of role.channels.values()) {
        channel.fetchMessages().then(
            value => {
                Log.LogSuccess("fetch messages", channel);
                for(let message of value.values()) {
                    var reactions  = message.reactions;
                    for(let reaction of reactions.values()) {
                        if(reactionEquals(reaction.emoji,role.reaction)) {
                            user = message.member.addRole(getRoleFromGuild(role.name,channel.guild));
                        }
                    }
                }
            },
            reason => LogFail("fetch messages", reason));
    }
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

function AssignUndefined(destination, source) {
    var toreturn = new Object();
    for (let property of Object.keys(source)) {
        if (!destination.hasOwnProperty(property)) {
            toreturn[property] = source[property];
        } else {
            toreturn[property] = destination[property];
        }
    }
    return toreturn;
}
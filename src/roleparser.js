require('./constants.js');
const Log = require('./log.js');
const FuzzySet = require('fuzzyset.js');
const Util = require('./util.js');
const Long = require('long');
const EqualityAmount = 0.5;
const FetchSize = 100;
const StartingPosition = 10; //arbitrary number greater than the number of unmanaged roles, like staff
const DefaultRole = {
    exclusive: false,
    persistent: false,
    color: 0,
    reaction: "this would never be a valid reaction", //moderator assigned or initial is true
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
            member.addRole(getRoleFromGuild(role, member.guild)).then(
                value => Log.LogSuccess("add role", value),
                reason => Log.LogFail("add role", reason));;
        }
    }
}

exports.setRole = function (reaction, user) {
    var id = reaction.message.channel.id;
    var guild = reaction.message.guild;
    for (let role of Roles.values()) {
        if (role.channels.has(id) && reactionEquals(reaction.emoji, role.reaction)) {
            var realrole = getRoleFromGuild(role.name, guild);
            var roleid = realrole.id;
            guild.members.get(user.id).addRole(roleid).then(
                value => Log.LogSuccess("add role", value),
                reason => Log.LogFail("add role", reason));
        }
    }
}

exports.removeRole = function (reaction, user) {
    var id = reaction.message.channel.id;
    var guild = reaction.message.guild;
    for (let role of Roles.values()) {
        if(role.channels.has(id) && reactionEquals(reaction.emoji, role.reaction)) {
            var realrole = getRoleFromGuild(role.name, guild);
            var roleid = realrole.id;
            var userid = null;
            if(user === null)  {
                for (let member of guild.members.values()) {
                    if(member.roles.has(roleid)) {
                        member.removeRole(roleid).then(
                            value => Log.LogSuccess("remove role", value),
                            reason => Log.LogFail("remove role", reason));
                    }
                }
            } else {
                userid = user.id;
                guild.members.get(userid).removeRole(roleid).then(
                    value => Log.LogSuccess("remove role", value),
                    reason => Log.LogFail("remove role", reason));
            }
        }
    }
}

function reactionEquals(discordReaction, ourReaction) {
    var unicode = discordReaction.identifier.replace(new RegExp('%', 'g'),'');
    if (discordReaction.identifier == ourReaction ||
        discordReaction.id == ourReaction ||
        discordReaction.name == ourReaction ||
        ourReaction.endsWith(unicode) ||
        discordReaction == ourReaction) {
        return true;
    }
    else
        return false
}

exports.refreshRoles = function () {

}

/**
 * @param {Client} CurrentClient
 */
exports.construct = function (CurrentClient) {
    position = StartingPosition;
    Client = CurrentClient;
    Guilds = Client.guilds;
    for (let guild of Guilds.values()) {
        if(guild.memberCount > FetchSize)
            guild.fetchMembers('', guild.memberCount).then(
                value => Log.LogSuccess("fetch members", value),
                reason => Log.LogFail("fetch members", reason));
    }
    loadRoals();
}


function loadRoals() {
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
    defaultedRole.name = roleName;
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
    defaultedRole.channels  = addRoleChannel(defaultedRole.channels);
    for (let guild of Guilds.values()) {
        let existingRole = checkIfRoleExists(roleName, guild);
        if (existingRole == null) {
            guild.createRole(mappedRole).then(
                value => Log.LogSuccess("create role", value),
                reason => Log.LogFail("create role", reason));
        }
        else {
            if (existingRole.name === "@everyone") {
                mappedRole.name = "@everyone"; // do not change this name
            }
            if (!rolesEqual(existingRole, mappedRole)) { //save some time and skip this if they're equal
                existingRole.edit(mappedRole).then(
                    value => Log.LogSuccess("edit role", value),
                    reason => Log.LogFail("edit role", reason));
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
            realChannel = guild.channels.get(roleChannel);
            if(realChannel)
                channels.set(realChannel.id, realChannel);
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
    var color = role.color;
    //color = Discord.Util.resolveColor(role.color);
    return {
        name: roleName,
        color: color,
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

var currentReactingUsers = new Map();;

function processReactions(role) {
    for (let channel of role.channels.values()) {
        channel.fetchMessages().then(
            value => {
                Log.LogSuccess("fetch messages", channel);
                for(let message of value.values()) {
                    var reactions  = message.reactions;
                    for(let reaction of reactions.values()) {
                        if(reactionEquals(reaction.emoji,role.reaction)) {
                            currentReactingUsers = new Map();
                            reaction.fetchUsers().then(
                                value =>  {
                                    getAllReactingMembers(value, reaction, 0)
                                },
                                reason => Log.LogFail("fetch reacting users", reason));
                        }
                    }
                }
            },
            reason => Log.LogFail("fetch messages", reason));
    }
}

function getAllReactingMembers(value, reaction, oldsize) {
    currentsize = reaction.users.size;
    if(currentsize >= reaction.count) { //got all the users, it's go time
        giveUsersRole(value, reaction, role);
        cleanUsersRole(value, reaction, role);
    }
    else if(currentsize > oldsize) {
        //set bounds
        var middlestring = Util.getMedian(value);

        //get lower
        reaction.fetchUsers(FetchSize, {before: middlestring}).then(
            value => getAllReactingMembers(value, reaction, currentsize),
            reason => Log.LogFail("lower bounds guild caching", reason));

        //get upper
        reaction.fetchUsers(FetchSize, {after: middlestring }).then(
            value => getAllReactingMembers(value, reaction, currentsize),
            reason => Log.LogFail("upper bounds guild caching", reason));
    } 

}

function giveUsersRole(users, reaction, role){
    var guild = reaction.message.guild;
    roleId = getRoleFromGuild(role.name, guild).id;
    for(let user of users.keys()) {
        member = guild.members.get(user);

        member.addRole(roleId).then(
            value => Log.LogSuccess("add role", value),
            reason => Log.LogFail("add role", reason));
    }
}

function cleanUsersRole(users, reaction, role){
    var guild = reaction.message.guild;
    var role = getRoleFromGuild(role.name, guild);
    var members = role.members;
    for(let user of role.members.values()) {
        if(!users.has(user.id)) {
            user.removeRole(role.id).then(
                value => Log.LogSuccess("remove role", value),
                reason => Log.LogFail("remove role", reason));
        }
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
    var firstcolor = Util.resolveColor(first.color);
    var secondcolor = Util.resolveColor(second.color);
    if (first.name === second.name && firstcolor === secondcolor) {
        return true;
    }
    else {
        return false;
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
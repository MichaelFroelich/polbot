require('./constants.js');
const Log = require('./log.js');
const FuzzySet = require('fuzzyset.js');
const Util = require('./util.js');
const PolUsers = require('./polusers.js')
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

var Permissions = null;
function getPermissions() {
    if(Permissions === null) {
        Permissions = 0;
        Permissions &= 1 << 16; //read channel
        Permissions &= 1 << 10; //view channel
    }
    return Permissions
}

exports.guildMemberAdd = async function (member) {
    if (!member.user.bot) {
        currentMember = await PolUsers.read(member.id);
        if (currentMember) {
            currentRoles = currentMember.roles;
            member.setRoles(currentRoles);
        } else {
            for (let role of InitialRoles.values()) {
                addRole(role, member, true);
            }
        }
    }
}

exports.setRole = function (reaction, user) {
    var id = reaction.message.channel.id;
    var guild = reaction.message.guild;
    for (let role of Roles.values()) {
        if (role.channels.has(id) && reactionEquals(reaction.emoji, role.reaction)) {
            addRole(role, guild.members.get(user.id));
        }
    }
}

exports.removeRole = async function (reaction, user) {
    var id = reaction.message.channel.id;
    var guild = reaction.message.guild;
    for (let role of Roles.values()) {
        if (role.channels.has(id) && reactionEquals(reaction.emoji, role.reaction)) {
            if (role.persistent) {
                return; //do nothing, this role can't be removed
            }
            var realrole = getRoleFromGuild(role.name, guild);
            var roleid = realrole.id;
            if (user === null) {
                for (let member of guild.members.values()) {
                    if (member.roles.has(roleid)) {
                        member.removeRole(roleid).then(
                            value => Log.LogSuccess("remove role", value),
                            reason => Log.LogFail("remove role", reason));
                    }
                }
            } else {
                member = guild.members.get(user.id);
                await member.removeRole(roleid).then(
                    value => Log.LogSuccess("remove role", value),
                    reason => Log.LogFail("remove role", reason));
                PolUsers.create(member);
            }
        }
    }
}

function reactionEquals(discordReaction, ourReaction) {
    if (Util.resolveReaction(discordReaction) === Util.resolveReaction(ourReaction))
        return true;
    else return false;
}

/**
 * @param {Client} CurrentClient
 */
exports.construct = async function (CurrentClient) {
    position = StartingPosition;
    Client = CurrentClient;
    Guilds = Client.guilds;
    for (let guild of Guilds.values()) {
        if (guild.memberCount > FetchSize) {
            guild.fetchMembers('', guild.memberCount).then(
                value => loadUsers(value.members),
                reason => Log.LogFail("fetch members", reason));
        }
    }
    loadRoals();
}

function loadUsers(users) {
    Log.LogSuccess("fetch members", users);
    try {
        for (let user of users.values())
            PolUsers.create(user);
        Log.LogSuccess("loaded users", "users");
    } catch (err) {
        Log.LogFail("loaded users", err);
    }
}

function loadRoals() {
    var roles = require(RolesFile);
    Roles = new Map();
    InitialRoles = new Map();
    populateGuildSets(Client.guilds);
    var defaultedRoles = AssignUndefined(roles, DefaultRole); //The root of the roles file forms the current default
    for (let role of Object.entries(defaultedRoles.roles)) {
        createRoles(defaultedRoles, role);
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

async function createRoles(parentRole, currentRole) {
    var roleName = currentRole[0];
    var defaultedRole = AssignUndefined(currentRole[1], parentRole);
    defaultedRole.position = position++;
    defaultedRole.roles = currentRole[1].roles;
    defaultedRole.name = roleName;
    defaultedRole.parent = parentRole; //used later for finding mutually exclusive roles
    defaultedRole.parent.roles[defaultedRole.name] = defaultedRole;
    Roles.set(roleName, defaultedRole);
    if (defaultedRole.initial) {
        InitialRoles.set(roleName, defaultedRole);
    }

    //find all the roles in the json structure
    if (defaultedRole.roles !== undefined) {
        for (let role of Object.entries(defaultedRole.roles)) {
            await createRoles(defaultedRole, role);
        }
    }

    //finished finding all the roles, now we add them
    var mappedRole = mapRole(defaultedRole, roleName);
    defaultedRole.channels = addRoleChannel(defaultedRole.parent.channels); //in json, the channel the role uses exists on the parent
    for (let guild of Guilds.values()) {
        let existingRole = checkIfRoleExists(roleName, guild);
        if (existingRole == null) {
            existingRole = await guild.createRole(mappedRole).then(
                value => Log.LogSuccess("create role", value),
                reason => Log.LogFail("create role", reason));
            applyChannelPermissions(existingRole, defaultedRole, guild);
        }
        else {
            if (existingRole.name === "@everyone") {
                mappedRole.name = "@everyone"; // do not change this name
            }
            if (!rolesEqual(existingRole, mappedRole)) { //save some time and skip this if they're equal
                existingRole.edit(mappedRole).then(
                    value => Log.LogSuccess("edit role", value),
                    reason => Log.LogFail("edit role", reason));
                applyChannelPermissions(existingRole, defaultedRole, guild);
            }
        }
    }
    processReactions(defaultedRole); //check the role channels
    //processVacancies(defaultedRole); //check the role channels
}

function applyChannelPermissions(existingRole, defaultedRole, guild) {
    if(!ManageChannelPermissions)
        return;
    for (var itteratingRole = defaultedRole; itteratingRole.parent !== undefined; itteratingRole = itteratingRole.parent) {
        for (let channel of itteratingRole.channels.values()) {
            var realchannel = Util.resolveChannel(guild, channel);
            if(realchannel !== null)
                realchannel.overwritePermissions(existingRole, getPermissions());
        }
        for (let channel of itteratingRole.starboards.values()) {
            var realchannel = Util.resolveChannel(guild, channel);
            if(realchannel !== null)
                realchannel.overwritePermissions(existingRole, getPermissions());
        }
    }
}

function addRoleChannel(roleChannels) {
    var channels = new Map();
    for (let roleChannel of roleChannels) {
        for (let guild of Guilds.values()) {
            realChannel = Util.resolveChannel(guild, roleChannel);
            if (realChannel)
                channels.set(realChannel.id, realChannel);
        }
    }
    return channels;
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

function processReactions(role) {
    for (let channel of role.channels.values()) {
        channel.fetchMessages().then(
            value => {
                Log.LogSuccess("fetch messages", channel);
                for (let message of value.values()) {
                    var reactions = message.reactions;
                    for (let reaction of reactions.values()) {
                        if (reactionEquals(reaction.emoji, role.reaction)) {
                            currentReactingUsers = new Map();
                            reaction.fetchUsers().then(
                                value => {
                                    getAllReactingMembers(role, value, reaction, 0)
                                },
                                reason => Log.LogFail("fetch reacting users", reason));
                        }
                    }
                }
            },
            reason => Log.LogFail("fetch messages", reason));
    }
}

function getAllReactingMembers(role, value, reaction, oldsize) {
    currentsize = reaction.users.size;
    if (currentsize >= reaction.count) { //got all the users, it's go time
        giveUsersRole(reaction, role);
        //cleanUsersRole(reaction, role);
    }
    else if (currentsize > oldsize) {
        //set bounds
        var middlestring = Util.getMedian(value);

        //get lower
        reaction.fetchUsers(FetchSize, { before: middlestring }).then(
            value => getAllReactingMembers(role, value, reaction, currentsize),
            reason => Log.LogFail("lower bounds guild caching", reason));

        //get upper
        reaction.fetchUsers(FetchSize, { after: middlestring }).then(
            value => getAllReactingMembers(role, value, reaction, currentsize),
            reason => Log.LogFail("upper bounds guild caching", reason));
    }

}

function giveUsersRole(reaction, role) {
    var guild = reaction.message.guild;
    var users = reaction.users;
    roleId = getRoleFromGuild(role.name, guild).id;
    for (let user of users.keys()) {
        member = guild.members.get(user);
        if (member !== undefined && !member.roles.has(roleId)) {
            addRole(role, member);
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

async function addRole(role, member, override = false) {
    realrole = getRoleFromGuild(role.name, member.guild);
    if (member.roles.has(realrole.id)) {
        return;
    }
    if (role.persistent === true) {
        override = true;
    }

    member.party = getParty(role); //A party is not quite a role
    var currentRoles = member.roles;
    var toRemove = new Map();
    getAllExclusiveRoles(role, toRemove);
    for (let currentRole of currentRoles.values()) {
        if (toRemove.has(currentRole.name)) {
            currentRole.id = getRoleFromGuild(currentRole.name, member.guild).id;
            if (override === true)
                currentRoles.delete(currentRole.id);
            else
                return;
        }
    }

    currentRoles.set(realrole.id, realrole); //finally, add the role we actually want
    await member.setRoles(currentRoles).then(
        value => Log.LogSuccess("add role", value),
        reason => Log.LogFail("add role", reason));
    PolUsers.create(member);
}

function getParty(role) {
    if(role.starboards === undefined) {
        if(role.parent === undefined) {
            return null;
        } else {
            return getParty(role.parent);
        }
    } else {
        return role;
    }
}

function getAllExclusiveRoles(role, roles) {
    if (role.exclusive) {
        for (let sibling of Object.values(role.parent.roles)) {
            if (sibling.exclusive && !sibling.persistent) {
                roles.set(sibling.name, sibling);
            }
        }
    }
    if (role.parent.parent !== undefined && role.parent.exclusive) {
        getAllExclusiveRoles(role.parent, roles);
    }
}

function AssignUndefined(destination, source) {
    var toreturn = new Object();
    for (let property of Object.keys(source)) {
        if (!destination.hasOwnProperty(property) && property !== "persistent") {
            toreturn[property] = source[property];
        } else {
            toreturn[property] = destination[property];
        }
    }
    return toreturn;
}
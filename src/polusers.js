const Users = require('node-persist');
Users.init();

exports.create = async function (member, data = null) {
    var memberid;
    if(member.id !== undefined)
        memberid = member.id;
    else
        memberid = member;

    if (await Users.getItem(memberid) === undefined) {
        if (data === null)
            Users.setItem(memberid, new PolUser(member));
        else {
            Users.setItem(memberid, data);
        }
    }
    else {
        if (data === null)
            Users.updateItem(memberid, new PolUser(member));
        else {
            Users.updateItem(memberid, data);
        }
    }
}

exports.addPoint = async function (memberid) {
    var user = this.read(memberid);
    user.points++;
    this.create(user);
}

exports.removePoint = async function (memberid, points) {
    var user = this.read(memberid);
    user.points -= points;
    this.create(user);
}

exports.stripPoint = async function (memberid) {
    var user = this.read(memberid);
    user.points = 0;
    this.create(user);
}

exports.read = async function (memberid) {
    return Users.getItem(memberid);
}

class PolUser {
    constructor(member) {
        this.roles = Array.from(member.roles.keys());
        this.status = 0;
        this.points = new Map();
        this.party = member.party;
    }
}
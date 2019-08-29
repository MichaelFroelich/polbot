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

exports.read = async function (memberid) {
    return await Users.getItem(memberid);
}

class PolUser {
    constructor(member) {
        this.roles = Array.from(member.roles.keys());
        this.status = 0;
    }
}
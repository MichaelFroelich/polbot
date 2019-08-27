const Users = require('node-persist');
Users.init();

exports.create = async function(member) {
    if(await Users.getItem(member.id) === undefined)
        Users.setItem(member.id, new PolUser(member));
    else {
        Users.updateItem(member.id, new PolUser(member));
    }
}

exports.read = async function(memberid) {
    return await Users.getItem(memberid);
}

class PolUser {
    constructor(member) {
        this._roles = Array.from(member.roles.keys());
        this._status = Status.ACTIVE;
    }

    get roles() { return this._roles;}
    set roles(roles) { this._roles = Array.from(roles.keys());}

    get roles() { return this._status;}
    set roles(roles) { this._status = Array.from(roles.keys());}
}

const Status = {
    BANNED: 1,
    MUTE: 2,
    ACTIVE: 3
}
const Long = require('long');
const Emojis = require('./emojis.json')
const HexRegex = '^[a-fA-F0-9\-]+$';
const Colors = {
    DEFAULT: 0x000000,
    WHITE: 0xFFFFFF,
    AQUA: 0x1ABC9C,
    GREEN: 0x2ECC71,
    BLUE: 0x3498DB,
    PURPLE: 0x9B59B6,
    LUMINOUS_VIVID_PINK: 0xE91E63,
    GOLD: 0xF1C40F,
    ORANGE: 0xE67E22,
    RED: 0xE74C3C,
    GREY: 0x95A5A6,
    NAVY: 0x34495E,
    DARK_AQUA: 0x11806A,
    DARK_GREEN: 0x1F8B4C,
    DARK_BLUE: 0x206694,
    DARK_PURPLE: 0x71368A,
    DARK_VIVID_PINK: 0xAD1457,
    DARK_GOLD: 0xC27C0E,
    DARK_ORANGE: 0xA84300,
    DARK_RED: 0x992D22,
    DARK_GREY: 0x979C9F,
    DARKER_GREY: 0x7F8C8D,
    LIGHT_GREY: 0xBCC0C0,
    DARK_NAVY: 0x2C3E50,
    BLURPLE: 0x7289DA,
    GREYPLE: 0x99AAB5,
    DARK_BUT_NOT_BLACK: 0x2C2F33,
    NOT_QUITE_BLACK: 0x23272A,
};

exports.LongMax = "18446744073709551615";

exports.validate = function (message, permission) {
    try {
        toeffect = message.mentions.members.first() || this.getMember(message.guild, args[0]);
      } catch (error) {
        throw error;
      }
    if (!toeffect) {
        throw "Couldn't find that user.";
    }
    if(!message.member.hasPermission(permission)){
        throw "You don't have the permissions to use this command.";
    }
    if(tomute.hasPermission(permission)) {
        throw "Cannot perform this command on this user.";
    }
    return toeffect;
}

exports.resolveColor = function (color) {
    if (typeof color === 'string') {
        if (color === 'RANDOM') return Math.floor(Math.random() * (0xFFFFFF + 1));
        if (color === 'DEFAULT') return 0;
        color = Colors[color] || parseInt(color.replace('#', ''), 16);
    } else if (color instanceof Array) {
        color = (color[0] << 16) + (color[1] << 8) + color[2];
    }

    if (color < 0 || color > 0xFFFFFF) {
        throw new RangeError('Color must be within the range 0 - 16777215 (0xFFFFFF).');
    } else if (color && isNaN(color)) {
        throw new TypeError('Unable to convert color to a number.');
    }

    return color;
}

exports.getMedian = function (map) {
    let keys = Array.from(map.keys()).sort(function (a, b) {
        a = Long.fromString(a);
        b = Long.fromString(b);
        if (a.lessThan(b)) {
            return -1;
        }
        else if (a.greaterThan(b)) {
            return 1;
        }
        else {
            return 0;
        }
    });
    return keys[keys.length / 2];
}

exports.getMember = function (guild, member) {
    var toReturn = new Array();
    if (guild.memberCount < guild.members.length)
        guild.fetchMembers('', guild.memberCount);

    if (member.match(/^\d+$/) != null) {
        toReturn.push(guild.members.get(args[0]));
    }
    else {
        if (member.charAt(0) === '@') {
            member = member.substr(1);
        }
        if (member.match(/#\d{2,4}$/) != null) {
            for (let realMember of guild.members.values()) {
                if (realMember.user.tag === member) {
                    toReturn.push(realMember);
                }
            }
        }
        else {
            for (let realMember of guild.members.values()) {
                if (realMember.user.username === member || realMember.displayName === member) {
                    toReturn.push(realMember);
                }
            }
        }
    }

    if(toReturn.length > 1) {
        var error = "Found multiple users with that name, specify one:\n";
        for(member of toReturn) {
            error += member.user.tag + '\n';
        }
        throw error;
    } else if (toReturn.length == 1) {
        return toReturn[0];
    } else {
        return null;
    }
}

exports.resolveReaction = function (reaction) {
    if (reaction.name !== undefined) {
        var emoji = Emojis[getUnicode(reaction.name.toString())];
        return emoji;
    } else if (getUnicodeLength(reaction.toString()) === 1) {
        var emoji = Emojis[getUnicode(reaction.toString())]
        return emoji;
    } else if (reaction.match(new RegExp(HexRegex, 'g'))) {
        var emoji = Emojis[reaction.toLowerCase()];
        return emoji;
    }
    else
        return reaction;
}

function getUnicode(char) {
    const split = char.split(/[\u200c|\u200d|\u034f|\u035d|\u20e3]/);

    var hexout = "";
    for (const s of split) {
        if (s.length === 0)
            continue;
        hexout += pad(s.toString().codePointAt(0).toString(16), 4) + "-";
    }
    return hexout.substring(0, hexout.length - 1);
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function getUnicodeLength(str) {
    const split = str.split(/[\u200c|\u200d|\u034f|\u035d|\u20e3]/);
    let count = 0;

    for (const s of split) {
        if (s.length === 0) {
            count += 1;
        } else {
            //removing the variation selectors
            const num = Array.from(s.split(/[\ufe00-\ufe0f]/).join("")).length;
            count += num;
        }
    }

    //assuming the joiners are used appropriately
    return count / split.length;
}
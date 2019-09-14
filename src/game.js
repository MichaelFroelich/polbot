const Util = require('./util.js');
const PolUsers = require('./polusers.js')

exports.reacted = async function (reaction, user) {
    if (collectedMessage(reaction.message) === false) {


        filter = (reaction, user) => {
            emoji = getParty(message.author.id).emoji;

            return Util.resolveReaction(reaction.emoji) === Util.resolveReaction(emoji)
                && getParty(user.id).name === getParty(message.author.id).name;
        };

        message = reaction.message;
        var size = PolUsers.getPartySize(reaction.emoji);
        message.awaitReactions(filter, { max: size, time: 86400000, errors: ['time'] })
            .then(collected => console.log(collected.size))
            .catch(collected => { });
    }
}

var collected;
function collectedMessage(message) {
    if (collected === null) {
        collected = new Array();
    }
    if (collected.includes(message.id)) {
        return true;
    } else {
        collected.push(message.id);
        return false;
    }
}
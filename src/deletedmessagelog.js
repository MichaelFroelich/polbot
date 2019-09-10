require('./constants.js');
const Channel = "message-deleteedit-log";

var channel = null;
function getChannel(guild) {
    if (channel === null) {
        channel = guild.channels.find('name', Channel);
    }
    return channel;
}

exports.deletedMessage = async function (message) {
    let serverembed = new Discord.RichEmbed()
        .title(`Message deleted in ${message.channel.name}`)
        .addField(`Content`, message.cleanContent, true)
        .addField(`Id`, message.id, true)
        .addField(`User`, message.member.displayName, true)
        .setFooter(`Time: ${new Date()}`);

    getChannel(guild).send(serverembed);
}

exports.modifiedMessage = async function (oldmessage, newmessage) {
    let serverembed = new Discord.RichEmbed()
        .title(`Message edited in ${newmessage.channel.name}`)
        .addField(`Old content`, oldmessage.cleanContent, true)
        .addField(`New content`, newmessage.cleanContent, true)
        .addField(`New Id`, newmessage.id, true)
        .addField(`User`, newmessage.member.displayName, true)
        .setFooter(`Time: ${new Date()}`);

    getChannel(guild).send(serverembed);
}

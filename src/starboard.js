/*
 * Starboard discord bot written in nodejs: react to posts and have it post to a pin
 * channel after a configurable threshhold. originally meant for moonmoon_ow discord server.
 * Developed by Rushnett and Keiaxx.
 * Simplified for PolBot by Michael Froelich (BlueAndBlack)
 */


// discord init
const Discord = require('discord.js');
const Log = require('./log.js');
const Util = require('./util.js');
const PolUsers = require('./polusers.js')

// emoji that goes in the post title
const tt = '⭐';
let messagePosted = {};

exports.reacted = async function (reaction, user) {
    const message = reaction.message;
    var author = message.author;
    var party = PolUsers.read(author.id).party;
    var emoji = party.emoji;
    var size = PolUsers.getPartySize(party) / 3;

    if (message.author.id === user.id || message.author.bot)
        return;
    if (Util.resolveReaction(reaction.emoji) === Util.resolveReaction(emoji)
        && PolUsers.read(user.id).party.name === PolUsers.read(author.id).party.name) {
            return;
    }

    const guild = reaction.message.guild;
    const guildID = reaction.message.guild.id;
    const msg = reaction.message;
    const msgID = msg.id;
    const msgChannelID = msg.channel.id;
    const msgChannel = client.guilds.get(guildID).channels.get(msgChannelID);
    const msgLink = `https://discordapp.com/channels/${guildID}/${msgChannelID}/${msgID}`;
    var channel = null;

    for(let somechannel of party.starboards.values()) {
        channel = Util.resolveChannel(guild, somechannel);
        if (channel !== null)
            break;
    }
    if(channel === null) {
        break; //nothing to do here
    }
    
    // if message doesnt exist yet in memory, create it
    if (!messagePosted.hasOwnProperty(msgID)) {
        // p: boolean: has been posted to channel,
        // lc: int: number of stars
        messagePosted[msgID] = {
            p: false,
            lc: 0
        };
    } else {
        if (messagePosted[msgID].legacy) {
            Log.write(`Legacy message ${emoji}'d, ignoring`)
            return;
        }
    }

    msgChannel.messages.fetch(msg.id).then((msg) => {

        //We need to do this because the reaction count seems to be 1 if an old cached
        //message is starred. This is to get the 'actual' count
        msg.reactions.forEach((reaction) => {

            if (reaction.emoji.name == emoji) { 
                Log.write(`message ${emoji}'d! (${msgID}) in #${msgChannel.name} total: ${reaction.count}`);
                // did message reach threshold
                if (reaction.count >= size) {
                    PolUsers.addPoint(msg.author.id);
                    messagePosted[msgID].lc = reaction.count;
                    // if message is already posted
                    if (messagePosted[msgID].hasOwnProperty('psm')) {

                        const editableMessageID = messagePosted[msgID].psm;
                        Log.write(`updating count of message with ID ${editableMessageID}. reaction count: ${reaction.count}`);
                        const messageFooter = `${reaction.count} ${tt} (${msgID})`
                        channel.messages.fetch(editableMessageID).then((message) => {
                            message.embeds[0].setFooter(messageFooter)
                            message.edit(message.embeds[0])
                        });

                    } else {
                        // if message has already been created
                        if (messagePosted[msgID].p) return;

                        Log.write(`posting message with content ID ${msgID}. reaction count: ${reaction.count}`);
                        // add message to ongoing object in memory
                        messagePosted[msgID].p = true;

                        // create content message
                        const contentMsg = `${msg.content}\n\n→ [original message](${msgLink}) in <#${msgChannelID}>`;
                        const avatarURL = `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.jpg`;
                        const embeds = msg.embeds;
                        const attachments = msg.attachments;
                        const messageFooter = `${reaction.count} ${tt} (${msgID})`; 
                        let eURL = '';

                        if (embeds.length > 0) {

                            // attempt to resolve image url; if none exist, ignore it
                            if (embeds[0].thumbnail && embeds[0].thumbnail.url)
                                eURL = embeds[0].thumbnail.url;
                            else if (embeds[0].image && embeds[0].image.url)
                                eURL = embeds[0].image.url;
                            else
                                eURL = embeds[0].url;

                        } else if (attachments.array().length > 0) {
                            const attARR = attachments.array();
                            eURL = attARR[0].url;
                            // no attachments or embeds
                        }

                        const embed = new Discord.MessageEmbed()
                            .setAuthor(msg.author.username, avatarURL)
                            .setDescription(contentMsg)
                            .setImage(eURL)
                            .setTimestamp(new Date())
                            .setFooter(messageFooter);
                        channel.send({
                            embed
                        }).then((starMessage) => {
                            messagePosted[msgID].psm = starMessage.id;
                        });
                    }
                }
            }
        });
    });
}

exports.run = (client, message, args) => {

    var member = null;
    try {
        member = Util.validate(message, "MANAGE_ROLES_OR_PERMISSIONS", true);
    } catch (error) {
        return message.channel.send(error);
    }

    let role = args.join(" ").slice(22);
    if (!role)
        return message.channel.send("Specify a role!");

    let gRole = message.guild.roles.find('name', role);
    if (!gRole)
        return message.channel.send("Couldn't find that role.");


    if (member.roles.has(gRole.id))
        return message.channel.send("They already have that role.");

    else {
        member.addRole(gRole.id).catch(console.error);

        try {
            member.send(`Congrats, you have been given the role ${gRole.name}`);
            message.channel.send(`The user ${member} has a new role ${gRole.name}`);
        }
        catch (e) {
            console.log(e.stack);
            message.channel.send(`Congrats to <@${member.id}>, they have been given the role ${gRole.name}.`)
        }
    }
}
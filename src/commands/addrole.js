exports.run = (client, message, args) =>{
    //Pay attention in order to assign a role of a user, the bot needs to be above that role, that means you can't assign an equal or highest role than bot's role
    var member = null;
    try {
        member = message.mentions.members.first() || Util.getMember(message.guild, args[0]);
    } catch(error) {
        return message.channel.send(error);
    }
    if(!message.member.hasPermission("MANAGE_ROLES_OR_PERMISSIONS")){
        message.channel.send("You don't have the permissions to use this command!");
    }

    else{

        if(!member) 
            return message.channel.send("Couldn't find that user, yo.");

        let role = args.join(" ").slice(22);
        if(!role) 
            return message.channel.send("Specify a role!");

        let gRole = message.guild.roles.find('name', role);
        if(!gRole) 
            return message.channel.send("Couldn't find that role.");


        if(member.roles.has(gRole.id)) 
            return message.channel.send("They already have that role.");

        else{
            member.addRole(gRole.id).catch(console.error);
            
            try{
                member.send(`Congrats, you have been given the role ${gRole.name}`);
                message.channel.send(`The user ${member} has a new role ${gRole.name}`);
            }
            catch(e){
                console.log(e.stack);
                message.channel.send(`Congrats to <@${member.id}>, they have been given the role ${gRole.name}.`)
            }
        }
    }
}
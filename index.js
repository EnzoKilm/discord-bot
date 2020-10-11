const Discord = require("discord.js");
const mysql = require('mysql');
const config = require("./config.json");

// Database connection
const connection = mysql.createConnection({
    host     : config.DATABASE.HOST,
    user     : config.DATABASE.USER,
    password : config.DATABASE.PASSWORD,
    database : config.DATABASE.DATABASE
  });
connection.connect();

const client = new Discord.Client();

const prefix = "!";

client.on("message", function(message) {
    // Prevent the case of the bot responding to itself
    if (message.author.bot) return;
    // Prevent the case of the user's message starts with something different than the bot prefix
    if (!message.content.startsWith(prefix)) return;

    // Deleting the prefix from the message
    const commandBody = message.content.slice(prefix.length);
    // Splitting the message into a series of substrings
    const args = commandBody.split(' ');
    // Separating the command from the args array
    const command = args.shift().toLowerCase();

    // Detecting differents commands
    if (command === "ping") {
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
    }

    if (command === "actus") {
        const author = message.author;
        const embed = new Discord.MessageEmbed()
            .setColor('#ffffff')
            .setTitle('Un nouveau bot arrive sur le discord !')
            .setURL('https://i.giphy.com/media/xThuWhoaNyNBjTGERa/giphy.webp')
            .setAuthor('Campus Academy', 'https://i.imgur.com/JvgbYON.png', 'https://campus.academy/')
            .setThumbnail('https://i.imgur.com/pShRI7I.png')
            .addFields(
                { name: 'Plein de fonctionnalités sont à venir...', value: 'N\'hésite pas à soumettre tes idées dans le channel <#764834554783334460> !' },
            )
            .setImage('https://media1.tenor.com/images/915bd1719d2dee1adfc04d1a87a83810/tenor.gif')
            .setTimestamp()
            .setFooter(`Requested by ${author.tag}`, `${author.avatarURL()}`);
        
        // Sending the embed to the channel where the message was posted
        message.channel.send(embed);
        // Deleting the message
        message.delete();
    }

    // if (command == "pkca") {
    //     const author = message.author;
    // }

    if (command === "img") {
        let user = message.guild.members.resolve(args[0]).user;
        message.reply(`${user.avatarURL()}`);
    }

    // Command : !add USER_ID
    if (command === "add") {
        let user = message.guild.members.resolve(args[0]).user;
        connection.query(`INSERT INTO users (discord_id, avatar_url) VALUES ('${args[0]}', '${user.avatarURL()}')`, function (error, results, fields) { if (error) throw error });
        message.reply('User successfully added to the database.');
    }
});

client.login(config.BOT_TOKEN);
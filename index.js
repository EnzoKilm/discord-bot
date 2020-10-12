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
const adminID = "223095215970451456";
const botID = "764181647632891965";

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
    // We get the bot object
    const bot = message.guild.members.resolve(botID).user;

    // Detecting differents commands
    if (command === "ping") {
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
    }

    // Command : actus
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

    // Command : add USER_ID
    if (command === "add") {
        if (message.author.id === adminID) {
            if (args != "") {
                let user = message.guild.members.resolve(args[0]).user;
                connection.query(`INSERT INTO users (discord_id, name, avatar_url) VALUES ('${args[0]}', "${user.username}", '${user.avatarURL()}')`, function (error, results, fields) { if (error) throw error });
                message.reply(`User successfully added ${user.username} to the database.`);
            } else {
                message.reply('The command must contain the argument "USER_ID".');
            }
        } else {
            message.reply('Access denied.');
        }
    }
    
    // Command : pkca
    if (command === "pkca") {
        connection.query(`SELECT * FROM users`, function (error, results, fields) {
            if (error) {
                throw error;
            } else if (results) {
                let allUsers = [];
                for (let i=0; i < results.length; i++) {
                    allUsers.push(results[i]);
                }
                let randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];

                let author = message.author;
                let userNameChanged = randomUser.name.replace("'", '').replace(/\s/g, '');
                let emoji = message.guild.emojis.cache.find(emoji => emoji.name === userNameChanged);
                let embed = new Discord.MessageEmbed()
                    .setColor('#0870F0')
                    .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                    .setThumbnail(`${randomUser.avatar_url}`)
                    .addFields(
                        { name: `You get`, value: `${emoji} **__${randomUser.name}__**` }
                    )
                    .setTimestamp()
                    .setFooter(`Commande : ${prefix}pkca`, `${bot.avatarURL()}`);
                
                // Sending the embed to the channel where the message was posted
                message.channel.send(embed);
                // Deleting the message
                message.delete();
            }
        });
    }
    
    // Command : inv
    if (command === "inv") {
        let author = message.author;
        let userID;
        connection.query(`SELECT id FROM users WHERE name = '${author.username}'`, function (error, results, fields) {
            if (error) {
                throw error;
            } else if (results) {
                userID = results[0].id;
            }
        });
        connection.query(`SELECT * FROM pokemon WHERE user_id = '${userID}'`, function (error, results, fields) {
            if (error) {
                throw error;
            } else if (results) {
                console.log(results);
            }
        });
    }
});

client.login(config.BOT_TOKEN);
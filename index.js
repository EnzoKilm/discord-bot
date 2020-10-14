const Discord = require("discord.js");
const mysql = require('mysql');
const async = require('async');
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
                connection.query(`INSERT INTO users (discord_id, name, avatar_url, pokemon_cooldown) VALUES ('${args[0]}', "${user.username}", '${user.avatarURL()}', null)`, function (error, results, fields) { if (error) throw error });
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
        connection.query(`SELECT * FROM users`, function (error, results_users, fields) {
            if (error) {
                throw error;
            } else if (results_users) {
                let author = message.author;
                // Checking the user command cooldown
                connection.query(`SELECT pokemon_cooldown FROM users WHERE name = "${author.username}"`, function (error, results_cooldown, fields) {
                    if (error) {
                        throw error;
                    } else if (results_cooldown) {
                        let userCooldown = parseInt(results_cooldown[0].pokemon_cooldown);
                        if (userCooldown+43200 >= parseInt(new Date().getTime() / 1000)) {
                            let secondsDiff = (userCooldown+43200)-(parseInt(new Date().getTime() / 1000));
                            let hours = 0; // 1 = 3600
                            let minutes = 0; // 1 = 60
                            let seconds = 0; // 1 = 1
                            while (secondsDiff >= 3600) {
                                hours += 1;
                                secondsDiff -= 3600;
                            }
                            while (secondsDiff >= 60) {
                                minutes += 1;
                                secondsDiff -= 60;
                            }
                            while (secondsDiff >= 1) {
                                seconds += 1;
                                secondsDiff -= 1;
                            }
                            let sentence = "";
                            if (hours > 0) {
                                sentence += hours+' hours';
                            }
                            if (minutes > 0 && hours != 0) {
                                sentence += ', '+minutes+' minutes';
                            } else if (minutes > 0) {
                                sentence += minutes+' minutes';
                            }
                            if (seconds > 0 && hours != 0 || seconds > 0 && minutes != 0) {
                                sentence += ' and '+seconds+' seconds';
                            } else if (seconds > 0) {
                                sentence += seconds+' seconds';
                            }
                            message.reply(`You need to wait ${sentence} before playing again.`);
                            // Deleting the message
                            message.delete();
                        } else {
                            let allUsers = [];
                            for (let i=0; i < results_users.length; i++) {
                                allUsers.push(results_users[i]);
                            }
                            // Selecting a random user from the user list
                            let randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
            
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
            
                            // Saving user informations in the database
                            connection.query(`UPDATE users SET pokemon_cooldown = '${Math.round((new Date()).getTime() / 1000)}' WHERE name = "${author.username}"`, function (error, results, fields) { if (error) { throw error; } });
                            
                            // Checking if the user already have the pokemon
                            connection.query(`SELECT id FROM users WHERE name = "${author.username}"`, function (error, results_id, fields) {
                                if (error) {
                                    throw error;
                                } else if (results_id) {
                                    let userID = results_id[0].id;
                                    // Getting the pokemon id
                                    connection.query(`SELECT id FROM users WHERE name = "${randomUser.name}"`, function (error, results_pokemon, fields) {
                                        if (error) {
                                            throw error;
                                        } else if (results_pokemon) {
                                            let pokemonID = results_pokemon[0].id;
                                            connection.query(`SELECT count FROM pokemon WHERE user_id = '${userID}' AND pokemon_id = '${pokemonID}'`, function (error, results_user_pk, fields) {
                                                if (error) {
                                                    throw error;
                                                } else if (results_user_pk) {
                                                    if (results_user_pk.length == 0) {
                                                        connection.query(`INSERT INTO pokemon (user_id, pokemon_id, count) VALUES (${userID}, ${pokemonID}, 1)`, function (error, results_insert_pk, fields) { if (error) { throw error; } });
                                                    } else {
                                                        let newCount = results_user_pk[0].count + 1;
                                                        connection.query(`UPDATE pokemon SET count = ${newCount} WHERE user_id = ${userID} AND pokemon_id = ${pokemonID}`, function (error, results_pk_count, fields) { if (error) { throw error; } });
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                            
                            // Sending the embed to the channel where the message was posted
                            message.channel.send(embed);
                            // Deleting the message
                            message.delete();
                        }
                    }
                });
            }
        });
    }
    
    // Command : inv
    if (command === "inv") {
        let author = message.author;
        connection.query(`SELECT id FROM users WHERE name = "${author.username}"`, function (error, results, fields) {
            if (error) {
                throw error;
            } else if (results) {
                let userID = results[0].id;
                connection.query(`SELECT * FROM pokemon WHERE user_id = '${userID}'`, function (error, results_pk, fields) {
                    if (error) {
                        throw error;
                    } else if (results_pk) {
                        let embedName = [];
                        let embedText = [];

                        if (results_pk.length > 0) {
                            async.forEachOf(results_pk, function(dataElement, i, inner_callback) {
                                connection.query(`SELECT name FROM users WHERE id = '${results_pk[i].pokemon_id}'`, function (error, results_pokemon_id, fields) {
                                    if (error) {
                                        throw error;
                                    } else if (results_pokemon_id) {
                                        let pokemonName = results_pokemon_id[0].name;
                                        let pokemonNameChanged = pokemonName.replace("'", '').replace(/\s/g, '');
                                        let count = results_pk[i].count;
                                        // console.log(pokemonName);
                                        let emoji = message.guild.emojis.cache.find(emoji => emoji.name === pokemonNameChanged);
                                        embedName.push([`**${pokemonName}**`]);
                                        embedText.push([`${emoji} *x${count}*`]);
    
                                        if (i+1 == results_pk.length) {
                                            connection.query(`SELECT * FROM users`, function (error, results_all_users, fields) {
                                                if (error) {
                                                    throw error;
                                                } else if (results_all_users) {
                                                    let progressPercent = Math.round((results_pk.length/results_all_users.length)*100);
                                                    let progressPercentBar = Math.round(progressPercent/10*2);
                                                    let progressBar = '';
                                                    for (let j=0; j < 20; j++) {
                                                        if (j <= progressPercentBar) {
                                                            progressBar += '█';
                                                        } else {
                                                            progressBar += '░';
                                                        }
                                                    }
                                                    let embed = new Discord.MessageEmbed()
                                                        .setColor('#0870F0')
                                                        .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                                        .addField(`Tu as obtenu ${results_pk.length} des ${results_all_users.length} cartes à collectionner.`, `${progressBar} ${progressPercent}%`)
                                                    for (let j=0; j < embedText.length; j++) {
                                                        embed.addField(`${embedName[j]}`, `${embedText[j]}`, true);
                                                    }
                                                    embed.setTimestamp()
                                                    embed.setFooter(`Commande : ${prefix}inv`, `${bot.avatarURL()}`);
                            
                                                    // Sending the embed to the channel where the message was posted
                                                    message.channel.send(embed);
                                                    // Deleting the message
                                                    message.delete();
                                                }
                                            });
                                        }
                                    }
                                });
                            });
                        } else {
                            connection.query(`SELECT * FROM users`, function (error, results_all_users, fields) {
                                if (error) {
                                    throw error;
                                } else if (results_all_users) {
                                    let embed = new Discord.MessageEmbed()
                                        .setColor('#0870F0')
                                        .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                        .addField(`Tu n'as obtenu aucune carte sur les ${results_all_users.length} à collectionner.`, `Essaye d'écrire la commande ${prefix}pkca`)
                                        .setTimestamp()
                                        .setFooter(`Commande : ${prefix}inv`, `${bot.avatarURL()}`);

                                    // Sending the embed to the channel where the message was posted
                                    message.channel.send(embed);
                                    // Deleting the message
                                    message.delete();
                                }
                            });
                        }
                    }
                });
            }
        });
    }

    // Command : help
    if (command === "cdreset") {
        let author = message.author;
        if (message.author.id === adminID) {
            connection.query(`UPDATE users SET pokemon_cooldown = null WHERE pokemon_cooldown IS NOT NULL`, function (error, results, fields) { if (error) { throw error; } });

            connection.query(`SELECT * FROM users`, function (error, results_all_users, fields) {
                if (error) {
                    throw error;
                } else if (results_all_users) {
                    let embed = new Discord.MessageEmbed()
                        .setColor('#AD1015')
                        .setTitle('Les cooldowns ont étés réinitialisés !')
                        .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                        .addField(`Votre adminisrateur vient de réinitialiser les cooldowns.`, `Essaye d'écrire la commande ${prefix}pkca 😉`)
                        .setTimestamp()
                        .setFooter(`Good luck !`, `${bot.avatarURL()}`);

                    // Sending the embed to the channel where the message was posted
                    message.channel.send(embed);
                    // Deleting the message
                    message.delete();
                }
            });
        } else {
            message.reply('Access denied.');
        }
    }

    // Command : help
    if (command === "help") {
        if (message.author.id === adminID) {
            // Deleting the message
            message.delete();
        } else {
            message.reply('Access denied.');
        }
    }
});

client.login(config.BOT_TOKEN);
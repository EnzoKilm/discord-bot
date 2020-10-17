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

let prefix = "!";

let promise1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        connection.query(`SELECT * FROM config WHERE id=1`, function(err, rows){
            if(err) {
                throw err;
            } else {
                resolve(rows[0].prefix);
            }
        });
    }, 100);
});
  
promise1.then((value) => {
    prefix = value;

    const adminID = "223095215970451456";
    const adminRole = "765966757243781130";
    const modoRole = "762615019354587156";
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
    
        // Define the author constant
        const author = message.author;
    
        let member = message.member;
        let admin = false;
        let modo = false;
        // Checking user's roles
        let memberRoles = member.roles.member._roles;
        for (let i=0; i < memberRoles.length; i++) {
            if (memberRoles[i] == adminRole) {
                admin = true;
                modo = true;
            } else if (memberRoles[i] == modoRole) {
                modo = true;
            }
        }
    
        // Detecting differents commands
        if (command === "ping" && modo === true) {
            const timeTaken = Date.now() - message.createdTimestamp;
            message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
        }
    
        // Command : actus
        if (command === "actus" && admin === true) {
            const embed = new Discord.MessageEmbed()
                .setColor('#ffffff')
                .setTitle('Un nouveau bot arrive sur le discord !')
                .setURL('https://i.giphy.com/media/xThuWhoaNyNBjTGERa/giphy.webp')
                .setAuthor('Campus Academy', 'https://i.imgur.com/JvgbYON.png', 'https://github.com/EnzoKilm/discord-bot')
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
    
        // Command : add USER_ID RARITY
        if (command === "add" && admin === true) {
            if (args != "") {
                let user = message.guild.members.resolve(args[0]).user;
                connection.query(`INSERT INTO users (discord_id, name, avatar_url, pokemon_cooldown, rarity) VALUES ('${args[0]}', "${user.username}", '${user.avatarURL()}', null, '${args[1]}')`, function (error, results, fields) { if (error) throw error });
                message.reply(`User successfully added ${user.username} to the database.`);
            } else {
                message.reply('The command must contain the argument "USER_ID".');
            }
        }
        
        // Command : pkca
        if (command === "pkca") {
            // Getting the type of the card the user will get
            let randomNumber = Math.random();
            let rarities = ["common", "rare", "epic", "legendary"];
            let rarityColors = ["#6792f0", "#27db21", "#b509b2", "#fce82d"];
            let rarityEmojis = [];
            for (let i=0; i < rarities.length; i++) {
                rarityEmojis.push(message.guild.emojis.cache.find(emoji => emoji.name === rarities[i]));
            }
            let rarity = rarities[0];
            // Common card : 70%; Rare card : 20%; Epic card : 8%; Legendary : 2%;
            if (randomNumber >= 0.7 && randomNumber < 0.9) {
                rarity = rarities[1];
            } else if (randomNumber >= 0.9 && randomNumber < 0.98) {
                rarity = rarities[2];
            } else if (randomNumber >= 0.98) {
                rarity = rarities[3];
            }

            connection.query(`SELECT * FROM users`, function (error, results_users, fields) {
                if (error) {
                    throw error;
                } else if (results_users) {
                    // Checking the user command cooldown
                    connection.query(`SELECT pokemon_cooldown FROM users WHERE name = "${author.username}"`, function (error, results_cooldown, fields) {
                        if (error) {
                            throw error;
                        } else if (results_cooldown) {
                            let secondsDiff = (parseInt(results_cooldown[0].pokemon_cooldown)+43200)-(parseInt(new Date().getTime() / 1000));
                            if (secondsDiff > 0) {
                                let [hours, minutes, seconds] = [0, 0, 0]; // 1=3600, 1=60, 1=1
                                while (secondsDiff >= 3600) { hours += 1; secondsDiff -= 3600; }
                                while (secondsDiff >= 60) { minutes += 1; secondsDiff -= 60; }
                                while (secondsDiff >= 1) { seconds += 1; secondsDiff -= 1; }

                                let sentence = "";
                                if (hours > 0) { sentence += hours+' hours';  }
                                if (minutes > 0 && hours != 0) { sentence += ', '+minutes+' minutes'; } else if (minutes > 0) { sentence += minutes+' minutes'; }
                                if (seconds > 0 && hours != 0 || seconds > 0 && minutes != 0) { sentence += ' and '+seconds+' seconds'; } else if (seconds > 0) { sentence += seconds+' seconds'; }
                               
                                message.reply(`You need to wait ${sentence} before playing again.`);
                                // Deleting the message
                                message.delete();
                            } else {
                                let allUsersWithRarity = [];
                                function getUsersWithRarity(rarity) {
                                    allUsersWithRarity = [];
                                    for (let i=0; i < results_users.length; i++) {
                                        if (results_users[i].rarity == rarity) {
                                            allUsersWithRarity.push(results_users[i]);
                                        }
                                    }
                                    
                                    // Preventing the case if there is no users with the rarity
                                    if (allUsersWithRarity.length == 0) {
                                        // We take one on the lower rarity
                                        if (rarities.indexOf(rarity) > 0) {
                                            rarity = rarities[rarities.indexOf(rarity)-1];
                                            getUsersWithRarity(rarity);
                                        }
                                    }
                                }
                                getUsersWithRarity(rarity);

                                // Selecting a random user from the user list
                                let randomUser = allUsersWithRarity[Math.floor(Math.random() * allUsersWithRarity.length)];
                
                                let userNameChanged = randomUser.name.replace("'", '').replace(/\s/g, '');
                                let emoji = message.guild.emojis.cache.find(emoji => emoji.name === userNameChanged);
                                let embed = new Discord.MessageEmbed()
                                    .setColor(`${rarityColors[rarities.indexOf(rarity)]}`)
                                    .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                    .setThumbnail(`${randomUser.avatar_url}`)
                                    .addFields(
                                        { name: `You get`, value: `${emoji} **__${randomUser.name}__**` },
                                        { name: 'Rareté :', value: `${rarityEmojis[rarities.indexOf(rarity)-1]} ${rarity}` },
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
        
        // Command : inv @USER
        if (command === "inv") {
            let userObject = author;
            let requestedBy = "";
            if (args.length == 1) {
                // The id is the first and only match found by the RegEx.
                let matches = args[0].match(/^<@!?(\d+)>$/);
                // If supplied variable was not a mention, matches will be null instead of an array.
                if (!matches) return;
                // However the first element in the matches array will be the entire mention, not just the ID,
                // so use index 1.
                let userID = matches[1];
    
                // Getting the user with its id
                let user = message.guild.members.resolve(userID).user;
                userObject = user;
                requestedBy = ` demandé par ${author.username}`;
            }
            
            connection.query(`SELECT id FROM users WHERE name = "${userObject.username}"`, function (error, results, fields) {
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
                                                            .setAuthor(`Inventaire de ${userObject.username}${requestedBy}`, `${userObject.avatarURL()}`, `${userObject.avatarURL()}`)
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
    
        // Command : cdreset
        if (command === "cdreset" && admin === true) {
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
        }
    
        // Command : help
        if (command === "help") {
            // Creating the embed
            const embed = new Discord.MessageEmbed()
                .setColor('#ffffff')
                .setTitle('Liste de vos commandes')
                .setAuthor('Campus Academy', 'https://i.imgur.com/JvgbYON.png', 'https://github.com/EnzoKilm/discord-bot')
    
            // Checking member roles
            if (admin == true) {
                embed.addFields(
                    { name: 'Admin commands', value: `\`\`\`${prefix}actus : display the last actuality.\n${prefix}add USER_ID RARITY : add a user to the pokemon card game.\n${prefix}cdreset : reset pokemon pkca cooldown for all users.\n${prefix}prefix NEW_PREFIX : change bot prefix.\n${prefix}newcard USER_ID : display new card message.\`\`\`` },
                );
            }
            if (modo == true) {
                embed.addFields(
                    { name: 'Moderator commands', value: `\`\`\`${prefix}test : test command.\n${prefix}ping : get the latency of the bot.\`\`\`` },
                );
            }
            embed.addFields(
                { name: 'User commands', value: `\`\`\`${prefix}pkca : get a random pokemon user card.\n${prefix}inv @USER: see user's pokemon card collection.\n${prefix}rarity : see cards rarity percentages\n${prefix}money @USER : see user's money\n${prefix}moneytop : see the richest members of the server\`\`\`` },
            );
    
            embed.setTimestamp();
            embed.setFooter(`Requested by ${author.tag}`, `${author.avatarURL()}`);
            
            // Sending the embed to the channel where the message was posted
            message.channel.send(embed);
            // Deleting the message
            message.delete();
        }

        // Command : prefix
        if (command === "prefix" && admin === true) {
            if (args.length == 1) {
                let newprefix = args[0];

                connection.query(`UPDATE config SET prefix = '${newprefix}' WHERE id = 1`, function (error, results, fields) { if (error) { throw error; } });

                message.reply(`Prefix changed from ${prefix} to ${newprefix}.`);

                prefix = newprefix;
            } else {
                message.reply('The command must contain the argument "NEW_PREFIX".');
            }
        }

        // Command : newcard USER_ID
        if (command === "newcard" && admin === true) {
            if (args != "") {
                connection.query(`SELECT * FROM users WHERE id=${args[0]}`, function (error, result_newcard, fields) {
                    if (error) {
                        throw error;
                    } else if (result_newcard) {
                        let newUser = result_newcard[0];
                        let emoji = message.guild.emojis.cache.find(emoji => emoji.name === newUser.rarity);
                        let embed = new Discord.MessageEmbed()
                            .setColor('#AD1015')
                            .setTitle(`Une nouvelle carte vient d'arriver !`)
                            .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                            .addField(`Vous pouvez désormais obtenir la carte ${newUser.name} !`, `Rareté de la carte : ${newUser.rarity} ${emoji}.`)
                            .setImage(`${newUser.avatar_url}`)
                            .setTimestamp()
                            .setFooter(`Bonne collection !`, `${bot.avatarURL()}`);
        
                        // Sending the embed to the channel where the message was posted
                        message.channel.send(embed);
                        // Deleting the message
                        message.delete();
                    }
                });
            } else {
                message.reply('The command must contain the argument "USER_ID".');
            }
        }

        // Command : rarity
        if (command === "rarity") {
            // Common : 70%; Rare : 20%; Epic : 8%; Legendary : 2%;
            let rarities = ["common", "rare", "epic", "legendary"];
            let emojis = [];
            for (let i=0; i < rarities.length; i++) {
                emojis.push(message.guild.emojis.cache.find(emoji => emoji.name === rarities[i]));
            }
            let embed = new Discord.MessageEmbed()
                .setColor('#273261')
                .setTitle(`Rareté des cartes demandée par ${author.username}`)
                .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                .addFields(
                    { name: `${emojis[0]} Common`, value: '70%' },
                    { name: `${emojis[1]} Rare`, value: '20%' },
                    { name: `${emojis[2]} Epic`, value: '8%'},
                    { name: `${emojis[3]} Legendary`, value: '2%'},
                )
                .setTimestamp()
                .setFooter(`Bonne collection !`, `${bot.avatarURL()}`);

            // Sending the embed to the channel where the message was posted
            message.channel.send(embed);
            // Deleting the message
            message.delete();
        }

        // Command : money @USER
        if (command === "money") {
            let userObject = author;
            let requestedBy = "";
            if (args.length == 1) {
                // The id is the first and only match found by the RegEx.
                let matches = args[0].match(/^<@!?(\d+)>$/);
                // If supplied variable was not a mention, matches will be null instead of an array.
                if (!matches) return;
                // However the first element in the matches array will be the entire mention, not just the ID,
                // so use index 1.
                let userID = matches[1];
    
                // Getting the user with its id
                let user = message.guild.members.resolve(userID).user;
                userObject = user;
                requestedBy = ` demandé par ${author.username}`;
            }

            connection.query(`SELECT * FROM users WHERE name = "${userObject.username}"`, function (error, results, fields) {
                if (error) {
                    throw error;
                } else if (results) {
                    let user = results[0];
                    
                    let embed = new Discord.MessageEmbed()
                        .setColor('#273261')
                        .setTitle(`Argent de ${user.name}${requestedBy}`)
                        .setAuthor(`${user.name}`, `${user.avatar_url}`, `${user.avatar_url}`)
                        .addFields(
                            { name: `Argent :`, value: `${user.money}€` },
                        )
                        .setTimestamp()
                        .setFooter(`Commande : ${prefix}money`, `${bot.avatarURL()}`);

                    // Sending the embed to the channel where the message was posted
                    message.channel.send(embed);
                    // Deleting the message
                    message.delete();
                }
            });
        }

        // Command : moneytop
        if (command === "moneytop") {
            connection.query(`SELECT * FROM users ORDER BY money DESC LIMIT 3`, function (error, results, fields) {
                if (error) {
                    throw error;
                } else if (results) {
                    // Creating the embed
                    let embed = new Discord.MessageEmbed()
                        .setColor('#273261')
                        .setTitle(`Top 3 des plus riches`)
                        .setAuthor('Campus Academy', 'https://i.imgur.com/JvgbYON.png', 'https://github.com/EnzoKilm/discord-bot')
                        
                    for (let i=0; i < results.length; i++) {
                        let user = results[i];
                        
                        embed.addFields(
                            { name: `${user.name} :`, value: `${user.money}€` },
                        );
                    }
                        
                    embed.setTimestamp();
                    embed.setFooter(`Commande : ${prefix}money`, `${bot.avatarURL()}`);

                    // Sending the embed to the channel where the message was posted
                    message.channel.send(embed);
                    // Deleting the message
                    message.delete();
                }
            });
        }
    });
    
    client.login(config.BOT_TOKEN);
});
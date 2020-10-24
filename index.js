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
            let rarities = ["commune", "rare", "epique", "legendaire"];
            let rarityColors = ["#6792f0", "#27db21", "#b509b2", "#fce82d"];
            let rarityEmojis = [];
            for (let i=0; i < rarities.length; i++) {
                rarityEmojis.push(message.guild.emojis.cache.find(emoji => emoji.name === rarities[i]));
            }
            let rarity = rarities[0];
            // Commune card : 70%; Rare card : 20%; Épique card : 8%; Légendaire : 2%;
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
                                    
                                    return rarity;
                                }
                                let finalRarity = getUsersWithRarity(rarity);

                                // Selecting a random user from the user list
                                let randomUser = allUsersWithRarity[Math.floor(Math.random() * allUsersWithRarity.length)];
                
                                let userNameChanged = randomUser.name.replace("'", '').replace(/\s/g, '');
                                let emoji = message.guild.emojis.cache.find(emoji => emoji.name === userNameChanged);
                                let embed = new Discord.MessageEmbed()
                                    .setColor(`${rarityColors[rarities.indexOf(finalRarity)]}`)
                                    .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                    .setThumbnail(`${randomUser.avatar_url}`)
                                    .addFields(
                                        { name: `You get`, value: `${emoji} **__${randomUser.name}__**` },
                                        { name: 'Rareté :', value: `${rarityEmojis[rarities.indexOf(finalRarity)]} ${finalRarity}` },
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
                                        let messageStart = 'Tu n\'as';
                                        if (userObject.username != author.username) {
                                            messageStart = `${userObject.username} n'a`;
                                        }
                                        let embed = new Discord.MessageEmbed()
                                            .setColor('#0870F0')
                                            .setAuthor(`${userObject.username}`, `${userObject.avatarURL()}`, `${userObject.avatarURL()}`)
                                            .addField(`${messageStart} obtenu aucune carte sur les ${results_all_users.length} à collectionner.`, `Essaye d'écrire la commande ${prefix}pkca`)
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
                    { name: 'Admin commands', value: `\`\`\`${prefix}actus : display the last actuality.\n${prefix}add USER_ID RARITY : add a user to the pokemon card game.\n${prefix}cdreset : reset pokemon pkca cooldown for all users.\n${prefix}prefix NEW_PREFIX : change bot prefix.\n${prefix}newcard USER_ID : display new card message.\n${prefix}shoprenew NUMBER_OF_CARDS : change cards which are avaliable in the shop.\`\`\`` },
                );
            }
            if (modo == true) {
                embed.addFields(
                    { name: 'Moderator commands', value: `\`\`\`${prefix}test : test command.\n${prefix}ping : get the latency of the bot.\`\`\`` },
                );
            }
            embed.addFields(
                { name: 'User commands', value: `\`\`\`${prefix}pkca : get a random pokemon user card.\n${prefix}inv @USER: see user's pokemon card collection.\n${prefix}stats : see cards statistics\n${prefix}money @USER : see user's money\n${prefix}moneytop : see the richest members of the server\n${prefix}sell : sell your duplicates cards and get money in exchange.\n${prefix}shop : open the shop to buy new cards.\`\`\`` },
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

        // Command : stats
        if (command === "stats") {
            // Commune : 70%; Rare : 20%; Épique : 8%; Légendaire : 2%;
            let rarities = ["commune", "rare", "epique", "legendaire"];
            let rarityPrices = [20, 100, 500, 2000];
            let emojis = [];
            for (let i=0; i < rarities.length; i++) {
                emojis.push(message.guild.emojis.cache.find(emoji => emoji.name === rarities[i]));
            }
            let embed = new Discord.MessageEmbed()
                .setColor('#273261')
                .setTitle(`Rareté des cartes demandée par ${author.username}`)
                .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                .addFields(
                    { name: `${emojis[0]} Commune`, value: `70% - valeur : ${rarityPrices[0]}€` },
                    { name: `${emojis[1]} Rare`, value: `20% - valeur : ${rarityPrices[1]}€` },
                    { name: `${emojis[2]} Épique`, value: `8% - valeur : ${rarityPrices[2]}€` },
                    { name: `${emojis[3]} Légendaire`, value: `2% - valeur : ${rarityPrices[3]}€` },
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
                        .setColor('#FFD700')
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
                        .setColor('#FFD700')
                        .setTitle(`Top 3 des plus riches`)
                        .setAuthor('Stonks Academy', 'https://i.imgur.com/JvgbYON.png', 'https://github.com/EnzoKilm/discord-bot')
                        .setThumbnail('https://cdn.frankerfacez.com/emoticon/506491/4');
                        
                    let medals = ["🥇", "🥈", "🥉"];
                    for (let i=0; i < results.length; i++) {
                        let user = results[i];
                        
                        embed.addFields(
                            { name: `${medals[i]} ${user.name}`, value: `${user.money}€` },
                        );
                    }
                        
                    embed.setTimestamp()
                        .setFooter(`Commande : ${prefix}moneytop`, `${bot.avatarURL()}`);

                    // Sending the embed to the channel where the message was posted
                    message.channel.send(embed);
                    // Deleting the message
                    message.delete();
                }
            });
        }

        // Command : sell CARD_NAME
        if (command === "sell") {
            // Getting user's cards
            connection.query(`SELECT * FROM users WHERE name = "${author.username}"`, function (error, results, fields) {
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
                            let totalCountOfCards = 0;
                            let cardsEmojis = [];
                            let cardCount = [];
                            let pokemonIDs = [];
    
                            if (results_pk.length > 0) {
                                async.forEachOf(results_pk, function(dataElement, i, inner_callback) {
                                    connection.query(`SELECT name FROM users WHERE id = '${results_pk[i].pokemon_id}'`, function (error, results_pokemon_id, fields) {
                                        if (error) {
                                            throw error;
                                        } else if (results_pokemon_id) {
                                            let pokemonName = results_pokemon_id[0].name;
                                            let pokemonNameChanged = pokemonName.replace("'", '').replace(/\s/g, '');
                                            let count = results_pk[i].count;
                                            if (count > 1) {
                                                totalCountOfCards += count-1;
                                                let emoji = message.guild.emojis.cache.find(emoji => emoji.name === pokemonNameChanged);
                                                embedName.push([`${pokemonName}`]);
                                                embedText.push([`${emoji} *x${count-1}*`]);
                                                cardsEmojis.push(emoji.id);
                                                cardCount.push(count);
                                                pokemonIDs.push(results_pk[i].id);
                                            }
        
                                            if (i+1 == results_pk.length) {
                                                let moreThanOneCard = "";
                                                if (totalCountOfCards > 1) { moreThanOneCard = "s" }
                                                if (totalCountOfCards >= 1) {
                                                    connection.query(`SELECT * FROM users`, function (error, results_all_users, fields) {
                                                        if (error) {
                                                            throw error;
                                                        } else if (results_all_users) {
                                                            let sellEmbed = new Discord.MessageEmbed()
                                                                .setColor('#0870F0')
                                                                .setAuthor(`Cartes à vendre de ${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                                                .addField(`Tu peux vendre ${totalCountOfCards} carte${moreThanOneCard}.`, `Tu ne peux vendre que les cartes que tu as en double.`)
                                                            for (let j=0; j < embedText.length; j++) {
                                                                sellEmbed.addField(`**${embedName[j]}**`, `${embedText[j]}`, true);
                                                            }
                                                            sellEmbed.addField(`Comment vendre une carte ?`, `Clique sur la réaction correspondant à la carte que tu veux vendre pour vendre celle-ci.\n*(Tu as 15 secondes pour réagir à ce message.)*`)
                                                                .setTimestamp()
                                                                .setFooter(`Commande : ${prefix}sell`, `${bot.avatarURL()}`);
                                    
                                                            let sellEmbedDelete = true;
                                                            // Sending the embed and then reacting to it with all cards emojis
                                                            message.channel.send({embed: sellEmbed}).then(sellEmbedMessage => {
                                                                for (let j=0; j < cardsEmojis.length; j++) {
                                                                    sellEmbedMessage.react(`${cardsEmojis[j]}`);
                                                                
                                                                    let sellFilter = (reaction, user) => {
                                                                        return reaction.emoji.id === cardsEmojis[j] && user.id === message.author.id;
                                                                    };
                                                                    
                                                                    // Collecting the reaction
                                                                    let sellCollector = sellEmbedMessage.createReactionCollector(sellFilter, { time: 15000 });
                                                                    
                                                                    sellCollector.on('collect', (reaction, user) => {
                                                                        sellEmbedDelete = false;
                                                                        sellEmbedMessage.delete();
                                                                        let cardIndex = cardsEmojis.indexOf(reaction.emoji.id);
                                                                        connection.query(`SELECT * FROM users WHERE name = "${embedName[cardIndex]}"`, function (error, results_user, fields) {
                                                                            if (error) {
                                                                                throw error;
                                                                            } else if (results_user) {
                                                                                let sellConfirmEmbedDelete = true;
                                                                                let rarities = ["commune", "rare", "epique", "legendaire"];
                                                                                let rarityColors = ["#6792f0", "#27db21", "#b509b2", "#fce82d"];
                                                                                let rarityPrices = [20, 100, 500, 2000];
                                                                                let rarityEmojis = [];
                                                                                for (let i=0; i < rarities.length; i++) {
                                                                                    rarityEmojis.push(message.guild.emojis.cache.find(emoji => emoji.name === rarities[i]));
                                                                                }
                                                                                let userCard = results_user[0];
                                                                                let cardPrice = rarityPrices[rarities.indexOf(userCard.rarity)];
    
                                                                                let sellConfirmEmbed = new Discord.MessageEmbed()
                                                                                    .setColor(`${rarityColors[rarities.indexOf(userCard.rarity)]}`)
                                                                                    .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                                                                    .setThumbnail(`${userCard.avatar_url}`)
                                                                                    .addFields(
                                                                                        { name: `Es-tu sûr de vouloir vendre`, value: `**__${userCard.name}__** ?` },
                                                                                        { name: `Cette carte ${userCard.rarity} te rapportera :`, value: `${cardPrice}€\n*(Tu as 15 secondes pour réagir à ce message.)*` },
                                                                                    )
                                                                                    .setTimestamp()
                                                                                    .setFooter(`Commande : ${prefix}sell`, `${bot.avatarURL()}`);
    
                                                                                message.channel.send({embed: sellConfirmEmbed}).then(sellConfirmEmbedMessage => {
                                                                                    for (let j=0; j < cardsEmojis.length; j++) {
                                                                                        sellConfirmEmbedMessage.react('✅');
                                                                                        sellConfirmEmbedMessage.react('❌');
    
                                                                                        let sellConfirmFilter = (reaction, user) => {
                                                                                            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                                                                                        };
                                                                                        let sellConfirmCollector = sellConfirmEmbedMessage.createReactionCollector(sellConfirmFilter, { time: 15000 });
                                                                                        sellConfirmCollector.on('collect', (reaction, user) => {
                                                                                            if (reaction.emoji.name == '✅') {
                                                                                                let sellFinalEmbed = new Discord.MessageEmbed()
                                                                                                    .setColor('#FFD700')
                                                                                                    .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                                                                                    .setThumbnail(`${userCard.avatar_url}`)
                                                                                                    .addFields(
                                                                                                        { name: `Vous venez de vendre ${userCard.name} !`, value: `Vous avez gagné ${cardPrice}€` },
                                                                                                    )
                                                                                                    .setTimestamp()
                                                                                                    .setFooter(`Commande : ${prefix}sell`, `${bot.avatarURL()}`);
    
                                                                                                let newBalance = results[0].money+cardPrice;
                                                                                                let newCount = cardCount[cardIndex]-1;
                                                                                                connection.query(`UPDATE users SET money = ${newBalance} WHERE name = "${author.username}"`, function (error, results, fields) { if (error) { throw error; } });
                                                                                                connection.query(`UPDATE pokemon SET count = ${newCount} WHERE id = ${pokemonIDs[cardIndex]}`, function (error, results, fields) { if (error) { throw error; } });
    
                                                                                                if (sellConfirmEmbedDelete == true) {
                                                                                                    sellConfirmEmbedDelete = false;
                                                                                                    sellConfirmEmbedMessage.delete();
                                                                                                    message.channel.send(sellFinalEmbed);
                                                                                                }
                                                                                            } else {
                                                                                                if (sellConfirmEmbedDelete == true) {
                                                                                                    sellConfirmEmbedDelete = false;
                                                                                                    sellConfirmEmbedMessage.delete();
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                        sellConfirmCollector.on('end', collected => {
                                                                                            if (sellConfirmEmbedDelete == true) {
                                                                                                sellConfirmEmbedDelete = false;
                                                                                                sellConfirmEmbedMessage.delete();
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    });
                                                                    sellCollector.on('end', collected => {
                                                                        if (sellEmbedDelete == true) {
                                                                            sellEmbedDelete = false;
                                                                            sellEmbedMessage.delete();
                                                                        }
                                                                    });
                                                                }
                                                            });
    
                                                            // Deleting the message
                                                            message.delete();
                                                        }
                                                    });
                                                } else {
                                                    let sellEmbed = new Discord.MessageEmbed()
                                                        .setColor('#0870F0')
                                                        .setAuthor(`Cartes à vendre de ${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                                        .addField(`Tu ne peux vendre aucune carte.`, `Tu ne peux uniquement vendre les cartes que tu as en double.`)
                                                        .setTimestamp()
                                                        .setFooter(`Commande : ${prefix}sell`, `${bot.avatarURL()}`);

                                                    message.channel.send(sellEmbed);
                                                    message.delete();
                                                }
                                                
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
                                            .addField(`Tu n'as aucune carte à vendre.`, `Essaye d'écrire la commande ${prefix}pkca pour en obtenir`)
                                            .setTimestamp()
                                            .setFooter(`Commande : ${prefix}sell`, `${bot.avatarURL()}`);
    
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

        // Command : shop
        if (command === "shop" && admin === true) {
            // Creating the embed
            let shopEmbed = new Discord.MessageEmbed()
                .setColor('#F03A17')
                .setTitle(`Bienvenue sur la boutique de cartes\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`)
                .setAuthor('Boutique', 'https://i.imgur.com/GZTjvQO.png', 'https://github.com/EnzoKilm/discord-bot')
                .setTimestamp()
                .setFooter(`Commande : ${prefix}shop`, `${bot.avatarURL()}`);
            
            // Getting data from the user who wants to buy
            connection.query(`SELECT * FROM users WHERE name = "${author.username}"`, function (error, result_user, fields) {
                if (error) {
                    throw error;
                } else if (result_user) {
                    let userData = result_user[0];
                    let cardsEmojis = [];
                    let cards = [];

                    // Getting cards which are selled currently
                    connection.query(`SELECT * FROM shop`, function (error, result_shop, fields) {
                        if (error) {
                            throw error;
                        } else if (result_shop) {
                            if (result_shop.length == 0) {
                                shopEmbed.addField('Aucune carte n\'est disponible dans la boutique.', 'Patience, tu pourras bientôt dépenser tes sous.');
                
                                // Sending the embed to the channel where the message was posted
                                message.channel.send(shopEmbed);
                            } else {
                                for (let i=0; i < result_shop.length; i++) {
                                    let cardSelled = result_shop[i];
                                    cards.push(cardSelled);
                                    let cardNameChanged = cardSelled.card_name.replace("'", '').replace(/\s/g, '');
                                    let cardEmoji = message.guild.emojis.cache.find(emoji => emoji.name === cardNameChanged);
                                    cardsEmojis.push(cardEmoji.id);
                                    let rarityEmoji = message.guild.emojis.cache.find(emoji => emoji.name === cardSelled.card_rarity);
                                    
                                    if (i+1 == result_shop.length) {
                                        shopEmbed.addFields(
                                            { name: `${cardEmoji} ${cardSelled.card_name} : ${rarityEmoji} ${cardSelled.card_rarity}`, value: `Prix: ${cardSelled.price}€\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬` },
                                        );
                                    } else {
                                        shopEmbed.addFields(
                                            { name: `${cardEmoji} ${cardSelled.card_name} : ${rarityEmoji} ${cardSelled.card_rarity}`, value: `Prix: ${cardSelled.price}€\n\u200B` },
                                        );
                                    }
                                }
                                let shopEmbedDelete = true;
                                
                                message.channel.send({embed: shopEmbed}).then(shopEmbedMessage => {
                                    for (let j=0; j < cardsEmojis.length; j++) {
                                        shopEmbedMessage.react(`${cardsEmojis[j]}`);
                                    
                                        let shopFilter = (reaction, user) => {
                                            return reaction.emoji.id === cardsEmojis[j] && user.id === message.author.id;
                                        };
                                        
                                        // Collecting the reaction
                                        let shopCollector = shopEmbedMessage.createReactionCollector(shopFilter, { time: 15000 });
                                        
                                        shopCollector.on('collect', (reaction, user) => {
                                            shopEmbedDelete = false;
                                            shopEmbedMessage.delete();
                                            let cardIndex = cardsEmojis.indexOf(reaction.emoji.id);
                                            let card = cards[cardIndex];
                                            let rarities = ["commune", "rare", "epique", "legendaire"];
                                            let rarityColors = ["#6792f0", "#27db21", "#b509b2", "#fce82d"];
                                            let shopConfirmEmbedDelete = true;

                                            let shopConfirmEmbed = new Discord.MessageEmbed()
                                                .setColor(`${rarityColors[rarities.indexOf(card.card_rarity)]}`)
                                                .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                                .setThumbnail(`${card.card_avatar}`)
                                                .addFields(
                                                    { name: `Es-tu sûr de vouloir acheter`, value: `**__${card.card_name}__** ?` },
                                                    { name: `Cette carte ${card.card_rarity} coûte :`, value: `${card.price}€\n*(Tu as 15 secondes pour réagir à ce message.)*` },
                                                )
                                                .setTimestamp()
                                                .setFooter(`Commande : ${prefix}shop`, `${bot.avatarURL()}`);

                                            message.channel.send({embed: shopConfirmEmbed}).then(shopConfirmEmbedMessage => {
                                                for (let j=0; j < cardsEmojis.length; j++) {
                                                    shopConfirmEmbedMessage.react('✅');
                                                    shopConfirmEmbedMessage.react('❌');

                                                    let shopConfirmFilter = (reaction, user) => {
                                                        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                                                    };
                                                    let shopConfirmCollector = shopConfirmEmbedMessage.createReactionCollector(shopConfirmFilter, { time: 15000 });
                                                    shopConfirmCollector.on('collect', (reaction, user) => {
                                                        if (reaction.emoji.name == '✅') {
                                                            let shopFinalEmbed = new Discord.MessageEmbed()
                                                                .setColor(`${rarityColors[rarities.indexOf(card.card_rarity)]}`)
                                                                .setAuthor(`${author.username}`, `${author.avatarURL()}`, `${author.avatarURL()}`)
                                                                .setThumbnail(`${card.card_avatar}`)
                                                                .setTimestamp()
                                                                .setFooter(`Commande : ${prefix}shop`, `${bot.avatarURL()}`);

                                                            let newBalance = userData.money-card.price;
                                                            let priceDiff = card.price-userData.money;
                                                            if (newBalance < 0) {
                                                                shopFinalEmbed.addFields(
                                                                    { name: `Vous n'avez pas assez d'argent pour acheter cette ${card.card_name}.`, value: `Il vous manque ${priceDiff}€` },
                                                                )
                                                            } else {
                                                                shopFinalEmbed.addFields(
                                                                    { name: `Vous venez d'acheter ${card.card_name} !`, value: `Vous avez dépensé ${card.price}€` },
                                                                )
                                                                connection.query(`UPDATE users SET money = ${newBalance} WHERE name = "${author.username}"`, function (error, results, fields) { if (error) { throw error; } });
                                                                // We check if the user already have the card (to increase the count) or to add it to its collection
                                                                connection.query(`SELECT * FROM pokemon WHERE user_id = ${userData.id} AND pokemon_id = ${card.card_id}`, function (error, result_has_card, fields) {
                                                                    if (error) {
                                                                        throw error;
                                                                    } else if (result_has_card) {
                                                                        if (result_has_card.length == 0) {
                                                                            connection.query(`INSERT INTO pokemon (user_id, pokemon_id, count) VALUES (${userData.id}, ${card.card_id}, 1)`, function (error, results, fields) { if (error) { throw error; } });
                                                                        } else {
                                                                            let newCount = result_has_card[0].count+1;
                                                                            connection.query(`UPDATE pokemon SET count = ${newCount} WHERE id = ${result_has_card[0].id}`, function (error, results, fields) { if (error) { throw error; } });
                                                                        }
                                                                    }
                                                                });
                                                            }

                                                            if (shopConfirmEmbedDelete == true) {
                                                                shopConfirmEmbedDelete = false;
                                                                shopConfirmEmbedMessage.delete();
                                                                message.channel.send(shopFinalEmbed);
                                                            }
                                                        } else {
                                                            if (shopConfirmEmbedDelete == true) {
                                                                shopConfirmEmbedDelete = false;
                                                                // Problem with the delete under
                                                                shopConfirmEmbedMessage.delete();
                                                            }
                                                        }
                                                    });
                                                    shopConfirmCollector.on('end', collected => {
                                                        if (shopConfirmEmbedDelete == true) {
                                                            shopConfirmEmbedDelete = false;
                                                            shopConfirmEmbedMessage.delete();
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                        shopCollector.on('end', collected => {
                                            if (shopEmbedDelete == true) {
                                                shopEmbedDelete = false;
                                                shopEmbedMessage.delete();
                                            }
                                        });
                                    }
                                });
                            }
                            // Deleting the message
                            message.delete();
                        }
                    });
                }
            });
        } else if (command === "shop") {
            message.reply("Patience...");
            message.delete();
        }

        // Command : shoprenew NUMBER_OF_CARDS
        if (command === "shoprenew" && admin === true) {
            if (args != "") {
                let numberOfCards = parseInt(args[0]);

                connection.query(`TRUNCATE TABLE shop`, function (error, results, fields) { if (error) throw error });
                
                connection.query(`SELECT * FROM users ORDER BY RAND() LIMIT ${numberOfCards}`, function (error, result_cards, fields) {
                    if (error) {
                        throw error;
                    } else if (result_cards) {

                        for (let i=0; i < result_cards.length; i++) {
                            let rarities = ["commune", "rare", "epique", "legendaire"];
                            let cardPrices = [50, 250, 1250, 5000];
                            let card_price = 999999;
                            
                            for (let j=0; j < rarities.length; j++) {
                                if (result_cards[i].rarity == rarities[j]) {
                                    card_price = cardPrices[rarities.indexOf(rarities[j])];
                                }
                            }

                            // let card_quantity = (Math.floor(Math.random() * Math.floor(2)))+1;
                            let card_quantity = 1;

                            connection.query(`INSERT INTO shop (card_id, card_name, card_rarity, card_avatar, price, quantity) VALUES (${result_cards[i].id}, "${result_cards[i].name}", '${result_cards[i].rarity}', '${result_cards[i].avatar_url}', ${card_price}, ${card_quantity})`, function (error, results, fields) { if (error) throw error });
                        }
                    }
                });
                message.reply(`Successfuly refreshed the shop with ${args[0]} cards.`);
            } else {
                message.reply('The command must contain the argument "NUMBER_OF_CARDS".');
            }
            message.delete();
        }
    });
    
    client.login(config.BOT_TOKEN);
});
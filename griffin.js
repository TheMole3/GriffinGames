/* jshint esversion: 11 */
/* jshint laxcomma: true */

const config = require('./config.json');

const mongojs = require('mongojs')
    , db = mongojs(config.dbConnect, ['GriffinGames']) // Import database
    , _ = require('lodash');

var griffin = {

    alive: 0,
    players: 0,


    /*
        @brief Get a player by email
        
        Get a player from the database specified in config.json using @email
        
        @param email    The users email

        @return A user object containing the user specified in @email
    */
    getPlayer: async (email) =>
    {  

        return new Promise((resolve, reject) => 
        {
            
            db.GriffinGames.findOne(
                {
                    'email': new RegExp(_.escapeRegExp(email), 'i')
                }, 
                function (error, docs) {
                    if (error) reject(error);
                    resolve(docs);
                } 
            );

        }).catch((error) => console.error(error));

    },


    /*
        @brief Get a player by name and class
        
        Get a player from the database specified in config.json using @name and @class
        
        @param name    The users name
        @param klass   The users class

        @return A user object containing the user specified in @name and @class
    */
    getPlayerByNameAndClass: async (namn, klass) => 
    { 

        return new Promise((resolve, reject) => 
        {

            db.GriffinGames.findOne(
                {
                    'name': { $regex : new RegExp(_.escapeRegExp(namn), 'i') }, 
                    'class': { $regex : new RegExp(_.escapeRegExp(klass), 'i') }
                }, 
                function (error, docs) {
                    if (error) reject(error);
                    resolve(docs);
                }
            );

        }).catch((error) => console.error(error));

    },


    /*
        @brief Get a player by target email
        
        Get a player from the database specified in config.json using the players targets email
        
        @param targetEmail    The users target email

        @return A user object containing the user that has the target specified in @targetEmail
    */
    getPlayerByTarget: async (targetEmail) => 
    {

        return new Promise((resolve, reject) => 
        {

            db.GriffinGames.findOne(
                {
                    'target': {$regex : new RegExp(_.escapeRegExp(targetEmail), 'i')}
                }, 
                function (error, docs) {
                    if (error) reject(error);
                    resolve(docs);
                }
            );

        }).catch((error) => console.error(error));

    },


    /*
        @brief Validate an elimination
        
        Report and validate if a report of an elimination is matching the database
        
        @param emailPlayer    The users email
        @param newHitName     The name that the user reported
        @param newHitClass    The class that the user reported
    */
    reportHit: async (emailPlayer, newHitName, newHitClass) => 
    { 

        let player = await griffin.getPlayer(emailPlayer);
        let target = await griffin.getPlayer(player.target);
        let newTarget = await griffin.getPlayerByNameAndClass(newHitName, newHitClass);

        // Log the report for noticing abuse
        db.GriffinGames.update(
            {
                'email': { $regex : new RegExp(_.escapeRegExp(emailPlayer), 'i') }
            }, {
                $push: {
                    log: {
                        name: newHitName, 
                        class: newHitClass, 
                        success: newTarget?target.target == newTarget.email:false, 
                        time: Date.now()
                    }
                }
            }, 
            {multi: false}, 
            function (error) { if(error) console.error(error);}
        );

        if(!newTarget) return {status: false, message: 'Det finns ingen spelare med det namnet och klassen, kontakta Hugo Arnlund om du tror något blivit fel'};

        // If the hit is a false report
        if(target.target != newTarget.email)  
        { 
            return {status: false, message: 'Det namn och klass du har fyllt i stämmer inte överens med databasen, kontakta Hugo Arnlund om du tror något blivit fel'};
        }

        // If the player has won
        if(player.email == newTarget.email) 
        {
            return {status: false, message: 'Du har vunnit Griffin Games!'};
        }

        await griffin.setNewTarget(player.email, newTarget.email); // Update target for player
        await griffin.killPlayer(target.email); // Kill old target

        return {status: true, newTargetName: newTarget.name, newTargetClass: newTarget.class};

    },


    /*
        @brief Set a new target
        
        Set a new target and add the previous target to log
        
        @param emailPlayer    The users email
        @param targetEmail    The new targets email

        @return user object of @emailPlayer
    */
    setNewTarget: async (emailPlayer, targetEmail) => 
    {

        let player = await griffin.getPlayer(emailPlayer);

        return new Promise((resolve, reject) => 
        {

            db.GriffinGames.update(
                {
                    'email': { $regex : new RegExp(_.escapeRegExp(emailPlayer), 'i') }
                }, 
                {
                    $set: {
                        target: targetEmail
                    }, 
                    $push: {
                        prevTargets: {email: player.target, time: Date.now()
                        }
                    }
                }, 
                {multi: false}, 
                function (error, docs) {
                    if (error) reject(error);
                    resolve(docs);
                }
            );

        }).catch((error) => console.error(error));

    },

    /*
        @brief Set a new target
        
        Set a new target and but don't add the previous target to log
        
        @param emailPlayer    The users email
        @param targetEmail    The new targets email

        @return user object of @emailPlayer
    */
    setNewTargetNoPush: async (emailPlayer, targetEmail) => 
    {

        return new Promise((resolve, reject) => 
        {

            db.GriffinGames.update(
                {
                    'email': { $regex : new RegExp(_.escapeRegExp(emailPlayer), 'i') }
                }, 
                {
                    $set: {
                        target: targetEmail
                    }
                }, 
                {multi: false}, 
                function (error, docs) {
                    if (error) reject(error);
                    resolve(docs);
                }
            );

        }).catch((error) => console.error(error));

    },

    /*
        @brief Kills a player
        
        Kill a player
        
        @param email    The players email

        @return user object of @emailPlayer
    */
    killPlayer: async (email) => 
    {

        await griffin.calculatePlayers();
        let placement = griffin.alive;

        return new Promise((resolve, reject) => 
        {

            db.GriffinGames.update(
                {
                    'email': { $regex : new RegExp(_.escapeRegExp(email), 'i') }
                }, 
                {
                    $set: {
                        alive: false, 
                        deathTime: Date.now(), 
                        target: false, 
                        placement: placement
                    }
                }, 
                {multi: false}, 
                function (error, docs) {
                    if (error) reject(error);
                    resolve(docs);
                }
            );

        }).catch((error) => console.error(error));

    },

    /*
        @brief Calculate how many players are left
        
        Calculates how many players are left, and total in the game, and set it to the variabeles this.alive and this.players
    */
    calculatePlayers: async () => { 

        return new Promise((resolve, reject) => 
        {

            db.GriffinGames.count({alive: true}, function (error, count) {
                if (error) reject(error);
                griffin.alive = count;

                db.GriffinGames.count({}, function (error, count) {
                    if (error) reject(error);
                    griffin.players = count;
                    resolve({alive: griffin.alive, players: griffin.players});
                });
            });

        }).catch((error) => console.error(error));

    }
};

module.exports = griffin;

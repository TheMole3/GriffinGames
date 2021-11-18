const config = require("./config.json")

const mongojs = require('mongojs')
    , db = mongojs(config.dbConnect, ['GriffinGames']) // Import database TheMole and collections bombman and referrals

var griffin = {
    alive: 0,
    players: 0,
    getPlayer: async (email) => { // Get player 
        return new Promise((resolve, reject) => {
            db.GriffinGames.findOne({"email": {$regex : new RegExp(email, "i")}}, function (error, docs) {
                if (error) reject(error);
                resolve(docs);
            });
        }).catch((error) => console.error(error));
    },
    getPlayerByNameAndClass: async (namn, klass) => { // Get player by Name and Class
        return new Promise((resolve, reject) => {
            db.GriffinGames.findOne({"name": {$regex : new RegExp(namn, "i")}, "class": {$regex : new RegExp(klass, "i")}}, function (error, docs) {
                if (error) reject(error);
                resolve(docs);
            });
        }).catch((error) => console.error(error));
    },
    reportHit: async (emailPlayer, newHitName, newHitClass) => { // Validate if a hit is correct
        let player = await griffin.getPlayer(emailPlayer)
        let target = await griffin.getPlayer(player.target)
        let newTarget = await griffin.getPlayerByNameAndClass(newHitName, newHitClass)

        if(!newTarget) return {status: false, message: "Det finns ingen spelare med det namnet och klassen, kontakta Hugo Arnlund om du tror något blivit fel"}

        if(target.target != newTarget.email)  { // If the hit is a false report
            /* TODO: Report false report to */
            return {status: false, message: "Det namn och klass du har fyllt i stämmer inte överens med databasen, kontakta Hugo Arnlund om du tror något blivit fel"}
        }
        
        await griffin.setNewTarget(player.email, newTarget.email) // Update target for player
        await griffin.killPlayer(target.email) // Kill old target

        return {status: true, newTargetName: newTarget.name, newTargetClass: newTarget.class}

    },
    setNewTarget: async (emailPlayer, targetEmail) => {
        let player = await griffin.getPlayer(emailPlayer)
        return new Promise((resolve, reject) => {
            db.GriffinGames.update({'email': {$regex : new RegExp(emailPlayer, "i")}}, {$set: {target: targetEmail}, $push: {prevTargets: {email: player.target, time: Date.now()}}}, {multi: false}, function (error, docs) {
                if (error) reject(error);
                resolve(docs);
            })
        }).catch((error) => console.error(error));
    },
    killPlayer: async (email) => { // Kill player
        await griffin.calculatePlayers()
        let placement = griffin.alive
        return new Promise((resolve, reject) => {
            db.GriffinGames.update({'email': {$regex : new RegExp(email, "i")}}, {$set: {alive: false, target: false, placement: placement}}, {multi: false}, function (error, docs) {
                if (error) reject(error);
                resolve(docs);
            })
        }).catch((error) => console.error(error));
    },
    calculatePlayers: async () => { // Count how many players there are, and how many there are left
        return new Promise((resolve, reject) => {
            db.GriffinGames.count({alive: true}, function (error, count) {
                if (error) reject(error);
                griffin.alive = count

                db.GriffinGames.count({}, function (error, count) {
                    if (error) reject(error);
                    griffin.players = count
                    resolve({alive: griffin.alive, players: griffin.players})
                })
            })
        }).catch((error) => console.error(error));
    }
}

module.exports = griffin
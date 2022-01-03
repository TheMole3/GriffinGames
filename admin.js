const config = require("./config.json")

const mongojs = require('mongojs')
    , db = mongojs(config.dbConnect, ["users", 'GriffinGames']) // Import database users and GriffinGames


let adminServer = (express, app, griffin) => {
    ensureAdminAuth = (req, res, next) => {
        if(!config.administratorEmails.includes(req.user.email)) return res.send(403); 
        next();
    }

    app.get('/config', ensureAdminAuth, (req, res) => { // Config sidan
        res.sendFile(__dirname + "/admin/config.html")
    });

    app.get('/adminPanel', ensureAdminAuth, (req, res) => { // Config sidan
        res.sendFile(__dirname + "/admin/panel.html")
    });

    app.get('/adminApi/data', ensureAdminAuth, (req, res) => {
        db.GriffinGames.find({}, (error, docs) => {
            res.send(docs)
        })
    })

    app.get('/adminApi/getPlayer', ensureAdminAuth, async (req, res) => { // Get a players info, ?email=user@domain.com
        let player = await griffin.getPlayer(req.query.email);
        res.send(player);
    })

    app.get('/adminApi/killPlayer', ensureAdminAuth, async (req, res) => { // Kill a player, also changes the target, ?email=user@domain.com&push=true
        let player = await griffin.getPlayer(req.query.email);
        let eliminator = await griffin.getPlayerByTarget(req.query.email);
        griffin.killPlayer(player.email); // Kill the player
        if(String(req.query.push) == "true") griffin.setNewTarget(eliminator.email, player.target); // Set the new target for the eliminator
        else griffin.setNewTargetNoPush(eliminator.email, player.target); // Set the new target for the eliminator and dont push it to prevTargets
        res.send(200)
    })

    app.post("/adminApi/newPlayers", ensureAdminAuth, (req, res) => { // Lägg till nya spelare, tar bort gammla spelare
        let players = req.body.players; // All potential players
        players = players.sort(() => (Math.random() > .5) ? 1 : -1) // Shuffle player array
        const grouped = Object.values(players.reduce((acc, item) => { // Dela upp spelare baserat på klass
            // lägg till i arrayen baserat på vilken klass
            acc[item.class] = [...(acc[item.class] || []), item];
            return acc;
        }, {}))
        
        //Randomisera listan med spelare utan att spelare från samma klass hamnar precis efter varandra
        randomizedPlayerList = [] // Array för spelare
        for (let i = 0; i < players.length; i++) { // Loopa lika många gånger som antal spelare
            let bigestArray = 0;
            for (let o = 0; o < grouped.length; o++) { // Loopa genom klasserna för att se vilken som är störst
                const klass = grouped[o];
                if(grouped[bigestArray].length < klass.length && (randomizedPlayerList[i-1]?randomizedPlayerList[i-1].class:false) != klass[0].class) bigestArray = o;
            }

            randomizedPlayerList.push((grouped[bigestArray].pop())); // Lägg till en spelare från den klass med flest kvarvarande spelare
        }
    
        // Skapa databasen
        database = [];
        for (let i = 0; i < randomizedPlayerList.length; i++) {
            let player = randomizedPlayerList[i];
            let target = i!=randomizedPlayerList.length-1?randomizedPlayerList[i+1]:randomizedPlayerList[0]
            database.push({
                name: player.name,
                class: player.class,
                email: player.email,
                target: target.email,
                prevTargets: [],
                alive: true,
                deathTime: null,
                placement: null,
                log: [],
            })
        }
        db.GriffinGames.remove()
        db.GriffinGames.insert(database)

        res.send(200);
    });
        
    app.use('/admin', [ensureAdminAuth, express.static(__dirname + '/admin')]);

}

module.exports = adminServer

const config = require("./config.json")

const mongojs = require('mongojs')
    , db = mongojs(config.dbConnect, ['GriffinGames']) // Import database GriffinGames


let visualServer = (app, io) => {
    that = {
        update: () => {
            db.GriffinGames.find({}, {name:1, alive:1, _id:1}, (error, docs) => {
                io.emit("update", docs)
            })
        }
    };

    io.on('connection', (socket) => {
        that.update()
    })

    return that;
}

module.exports = visualServer

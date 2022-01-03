// Imports
const config = require("./config.json")
    , fs = require('fs')
    , express = require('express')
    , app = express()
    , ejs = require('ejs')
    , cookieParser = require("cookie-parser")
    , bodyParser = require("body-parser")
    , https = require('http');


const griffin = require("./griffin.js")

// Express init
const auth = require("./auth/auth"); // Import auth code

app.use(cookieParser())  // Use cookie parser
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(express.json()) // Use express JSON
app.use(auth.jwt.authenticateToken) // Use middleware for auth token

app.use('/client', express.static('client')); // Serve static /client

// Web endpoints
app.get('/', async (req, res) => { // Main endpoint, Login page
    await griffin.calculatePlayers()
    ejs.renderFile(__dirname + '/client/login/login.html', { // Render login page with number of contestants left
        left: griffin.alive // Number of contestants left
      }, function(err, str){
        res.send(str)
    });
});

app.get('/portal', async (req, res) => { // Portal page, where the contestants report their killings
    if(!req.user) return res.redirect("/") // If user is not logged in redriect to start page

    var player = await griffin.getPlayer(req.user.email)
    if(!player) return res.send("Du är inte registrerad som spelare, om du tror detta är fel kontakta te20ha3@cng.se")
    var target = await griffin.getPlayer(player.target)
    if(!target) target = {name: "Du har ingen som du ska ta"}

    ejs.renderFile(__dirname + "/client/portal/portal.html", { // Render page
        target: {
            name: target.name, // Person to kill
            class: target.class // Class of the person to kill
        }
    }, function(err, str){
        res.send(str)
    })
})

app.get('/report', async (req, res) => {
    if(!req.user) return res.sendStatus(403) // If user is not logged in return error
    let success = await griffin.reportHit(req.user.email, req.query['name'], req.query['class']) // Reported target
    res.send(success)
    visualServer.update()
})

app.get('/login', (req, res) => { // Microsoft Azure login endpoint
    auth.auth.getConsentLink((link) => { // Get a microsoft auth consent link
        res.redirect(link) // Redirect user to authenticate at microsoft
    })
});

app.get('/redirect', (req, res) => { // Microsoft Azure Auth redirect endpoint
    auth.auth.redirect({ // Handle user
        req: req,
        res: res,
    }, (success) => {
        if(success) { // If succesfully logged in
            res.redirect("/portal") // Redirect to portal
        }
        else {
            res.send("Login error! Please contact the administrator")
        }
    })
});

app.get('/visual', (req, res) => { // Microsoft Azure login endpoint
    res.sendFile(__dirname + "/client/visual/visual.html")
});


// Start server
var httpsServer = https.createServer({
    ca: fs.readFileSync("ca_bundle.crt"),
    cert: fs.readFileSync("certificate.crt"),
    key: fs.readFileSync("private.key")
}, app);

httpsServer.listen(config.port, () => {
    console.log('HTTPS Server running on port ' + config.port);
});

const io = require('socket.io')(httpsServer);

let visualServer = require("./visual.js")(app, io)
let adminServer = require("./admin.js")(express, app, griffin)
// Imports
const config = require("./config.json")
    , fs = require('fs')
    , express = require('express')
    , app = express()
    , ejs = require('ejs')
    , cookieParser = require("cookie-parser")
    , https = require('http');


// Express init
const auth = require("./auth/auth"); // Import auth code

app.use(cookieParser())  // Use cookie parser
app.use(auth.jwt.authenticateToken) // Use middleware for auth token

app.use('/client', express.static('client')); // Serve static /client

// Web endpoints
app.get('/', (req, res) => { // Main endpoint, Login page
    ejs.renderFile(__dirname + '/client/login/login.html', { // Render login page with number of contestants left
        left: Math.floor(Math.random()*400) // Number of contestants left
      }, function(err, str){
        res.send(str)
    });
});

app.get('/portal', (req, res) => { // Portal page, where the contestants report their killings
    if(!req.user) return res.redirect("/") // If user is not logged in redriect to start page
    ejs.renderFile(__dirname + "/client/portal/portal.html", { // Render page
        hit: {
            name: req.user.displayName, // Person to kill
            class: "TEKV3D20" // Class of the person to kill
        }
    }, function(err, str){
        res.send(str)
    })
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


// Start server
var httpsServer = https.createServer({
    ca: fs.readFileSync("ca_bundle.crt"),
    cert: fs.readFileSync("certificate.crt"),
    key: fs.readFileSync("private.key")
}, app);

httpsServer.listen(config.port, () => {
    console.log('HTTPS Server running on port' + config.port);
});
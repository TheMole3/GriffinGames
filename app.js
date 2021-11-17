const config = require("./config.json")
    , fs = require('fs')
    , express = require('express')
    , app = express()
    , ejs = require('ejs')
    , mongojs = require("mongojs")
    , db = mongojs(config.dbConnect, ['GriffinGames'])
    , cookieParser = require("cookie-parser")
    , bodyParser = require('body-parser')
    , https = require('https');


const auth = require("./auth/auth");

app.use(cookieParser())
app.use(auth.jwt.authenticateToken)

app.use('/client', express.static('client'));

app.get('/', (req, res) => {
    ejs.renderFile(__dirname + '/client/login/login.html', {
        left: Math.floor(Math.random()*400)
      }, function(err, str){
        res.send(str)
    });
});

app.get('/portal', (req, res) => {
    if(!req.user) return res.redirect("/")
    ejs.renderFile(__dirname + "/client/portal/portal.html", {
        hit: {
            name: req.user.displayName,
            class: "TEKV3D20"
        }
    }, function(err, str){
        res.send(str)
    })
})

app.get('/login', (req, res) => {
    auth.auth.getConsentLink((link) => { // Get a microsoft auth consent link
        res.redirect(link) // Redirect user to authenticate at microsoft
    })
});

app.get('/redirect', (req, res) => {
    auth.auth.redirect({
        req: req,
        res: res,
    }, (success) => {
        if(success) {
            res.redirect("/portal")
            res.send("Portal")
        }
        else {
            res.send("Login error! Please contact the administrator")
        }
    })
});

var httpsServer = https.createServer({
    ca: fs.readFileSync("ca_bundle.crt"),
    cert: fs.readFileSync("certificate.crt"),
    key: fs.readFileSync("private.key")
}, app);

httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});
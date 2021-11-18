const config = require("../config.json") // Config file

const jsonwebtoken = require("jsonwebtoken")
    , msal = require('@azure/msal-node');

const user = require("./user"); // User handling

var jwt = {
    authenticateToken(req, res, next) { // Verify token and save logged in user in req.user
        // Gather the jwt access token from the request header
        const token = req.cookies.authToken;
        if(!token) return next() // If there is no token, aka no logged in user, move on
      
        jsonwebtoken.verify(token, config.authSecret, (err, id) => { // Verify tokens validity and decrypt
          user.findById(id, (error, user) => { // Find logged in user
            if(error) console.error(error)
            req.user = user // Save user for later use
            next() // pass the execution off to whatever request the client intended
          })
        })
    },
    generateAccessToken(id) { // Encrypt user id
        return jsonwebtoken.sign(id, config.authSecret);
    },
    setSessionCookie: async (context, id) => { // Save Token as a cookie in the users web browser
        await context.res.cookie('authToken', jwt.generateAccessToken(id), {maxAge: 1000*60*60*24, httpOnly: true, domain: config.cookieDomain, path: "/"})
    }
}

// Microsoft Azure config
const configAzure = {
    auth: config.azure,
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Error,
        }
    }
};

const REDIRECT_URI = config.redirectUri; // Azure redirect uri
const pca = new msal.ConfidentialClientApplication(configAzure);

var auth = {
    getConsentLink: (cb) => { // Get login link to microsfot
        const authCodeUrlParameters = { // Request user.read permission
            scopes: ["user.read"],
            redirectUri: REDIRECT_URI,
        };
    
        // get url to sign user in and consent to scopes needed for application
        pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            cb(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    },
    redirect: (context, cb) => { // Handle redirect and find/create user
        const tokenRequest = {
            code: context.req.query.code,
            scopes: ["user.read"],
            redirectUri: REDIRECT_URI,
        };
    
        pca.acquireTokenByCode(tokenRequest).then((response) => { // Verify token with microsoft
            user.findOrCreate(response, (error, user) => { // Find or create user with id
                jwt.setSessionCookie(context, user.id).then(() => { // Set session cookie
                    cb(true)
                })
            })
        }).catch((error) => {
            console.log(error);
            cb(false)
        });
    }
}

module.exports = {
    auth, jwt
}
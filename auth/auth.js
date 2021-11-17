const config = require("../config.json")

const jsonwebtoken = require("jsonwebtoken")
    , msal = require('@azure/msal-node');

const user = require("./user");

var jwt = {
    authenticateToken(req, res, next) {
        // Gather the jwt access token from the request header
        const token = req.cookies.authToken;
        if(!token) return next()
      
        jsonwebtoken.verify(token, config.authSecret, (err, id) => {
          user.findById(id, (error, user) => {
            if(error) console.error(error)
            req.user = user
            next() // pass the execution off to whatever request the client intended
          })
        })
    },
    generateAccessToken(id) {
        return jsonwebtoken.sign(id, config.authSecret);
    },
    setSessionCookie: async (context, id) => {
        await context.res.cookie('authToken', jwt.generateAccessToken(id), {maxAge: 1000*60*60*24, httpOnly: true, domain: config.cookieDomain, path: "/"})
    }
}

const configAzure = {
    auth: {
        clientId: "a596fd9b-0564-4e18-904c-d0989fb00522",
        authority: "https://login.microsoftonline.com/32a2cb4b-427a-45a7-80a0-f6eaf3f418b7",
        clientSecret: config.clientSecret
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

const REDIRECT_URI = config.redirectUri;
const pca = new msal.ConfidentialClientApplication(configAzure);

var auth = {
    getConsentLink: (cb) => {
        const authCodeUrlParameters = {
            scopes: ["user.read"],
            redirectUri: REDIRECT_URI,
        };
    
        // get url to sign user in and consent to scopes needed for application
        pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            cb(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    },
    redirect: (context, cb) => {
        const tokenRequest = {
            code: context.req.query.code,
            scopes: ["user.read"],
            redirectUri: REDIRECT_URI,
        };
    
        pca.acquireTokenByCode(tokenRequest).then((response) => {
            console.log("\nResponse: \n:", response);
            user.findOrCreate(response, (error, user) => {
                jwt.setSessionCookie(context, user.id).then(() => {
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
# GriffinGames
A utility for hosting big living mafia/hitman games, primarily at CNG.

## How does the game work
Living mafia, assasins, hitman, or griffin games, in which players try to eliminate one another using mock weapons, in an effort to become the last surviving player.
All players are assigned a target that they should eliminate by touching the person with their mock weapon.
If a player eliminates its target they are now assigned the target that their target had before.

# Setup
## Server setup
Griffin Games is run on a node.js server.
All commands here are for Linux Ubuntu, some may also work on windows/mac and other distros, but you will have to adapt them to your operating system

### Instalation
Start by downloading the repo and going into the directory
```
$ git clone https://github.com/TheMole3/GriffinGames.git
$ cd GriffinGames
```

Then run `npm install` to install the required libraries

### Config.json
```
{
    "port": 80,
    "azure": {
        "clientId": "Azure client ID",
        "authority": "Azure client authority",
        "clientSecret": "Azure client secret"
    },

    "authSecret": "Auth JWT Secret",
    "domain": "domain.example.tld",
    "https:": true,

    "dbConnect": "Mongo DB connect uri",

    "administratorEmails": ["admin@domain.com", "host@domain.com"]
}
```
Copy `example.config.json` to `config.json`

`"port": 80`                                            Defines the port that the webserver runs on

`"azure": {"clientId", "authority", "clientSecret"}`    Contains Microsoft Azure Auth credentials for authenication. You can read how to get these here https://docs.microsoft.com/sv-se/graph/auth/auth-concepts

`"authSecret": "Auth JWT Secret"`                       Choose a long random string to encrypt user data. KEEP THIS SECRET! If it is released, anyone can use anyones account.

`"domain": "domain.example.tld"`                        The base uri of the website

`"https:": true`                                        Can be true or false and defines wether to use https or http

`"dbConnect": "Mongo DB connect uri"`                   A mongodb connect uri, read more here https://docs.mongodb.com/manual/reference/connection-string/

`"administratorEmails": ["admin@domain.com", "host@domain.com"]` An array of emails that should have access to admin and setup pages

### Running the server
The webserver is started using `node app.js`


## Game setup
Start by getting data from the people who are going to play the game.
<br> The data needed are, Name, Email and Class.

Put this into an Excel document formated like the table below
| Name                  | Class | Email             |
|-----------------------|-------|-------------------|
| Brokkr Sheldon        | kc2   | oafpys@domain.com |
| Réamonn Eusebio       | gb1   | vrtrnb@domain.com |
| Christelle Christiana | qj3   | dkavfo@domain.com |
| Sigeberht Suibne      | eh1   | ylgibm@domain.com |
| Kinborough Cristian   | bo2   | exvxcp@domain.com |

Navigate to your domain and `/config`<br>
There, paste your excel data into the textarea, *DO NOT COPY TITLES FOR THE COLUMNS! ONLY USER DATA*<br>
Then press "Generera data", verify that the data is correct, and then "Skicka in data".

The server will now generate who will eliminate who.

## Game administration
At `/adminPanel` users who are specified in the administratorEmails array in the config can see who should eliminate who, placement, and logs.
There you can also force eliminate players.

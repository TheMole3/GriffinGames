# GriffinGames

GriffinGames is a utility designed for hosting large-scale living mafia or hitman games, primarily at CNG events.

## How the Game Works

Living mafia, assassins, hitman, or griffin games involve players attempting to eliminate each other using simulated weapons, aiming to be the last player standing. Each player is assigned a target whom they must eliminate by "tagging" them with their simulated weapon. Upon successfully eliminating their target, players inherit their target, continuing the cycle until only one player remains.

# Setup

## Server Setup

GriffinGames runs on a Node.js server. The following commands are tailored for Linux Ubuntu, but they can be adapted for other operating systems like Windows or macOS.

### Installation

1. Clone the repository and navigate to the directory:

    ```bash
    $ git clone https://github.com/TheMole3/GriffinGames.git
    $ cd GriffinGames
    ```

2. Install the required libraries:

    ```bash
    $ npm install
    ```

### Configuration (config.json)

Copy the `example.config.json` file to `config.json` and configure the parameters as follows:

```json
{
    "port": 80,
    "azure": {
        "clientId": "Azure client ID",
        "authority": "Azure client authority",
        "clientSecret": "Azure client secret"
    },
    "authSecret": "Auth JWT Secret",
    "domain": "domain.example.tld",
    "https": true,
    "dbConnect": "Mongo DB connect uri",
    "administratorEmails": ["admin@domain.com", "host@domain.com"]
}
```

- `"port": 80`: Defines the port for the web server.
- `"azure"`: Contains Microsoft Azure Auth credentials for authentication.
- `"authSecret"`: Secret key for encrypting user data.
- `"domain"`: Base URI of the website.
- `"https": true`: Specifies whether to use HTTPS.
- `"dbConnect"`: MongoDB connection URI.
- `"administratorEmails"`: Emails with admin access.

### Running the Server

Start the web server:

```bash
$ node app.js
```

## Game Setup

1. Collect player data including Name, Email, and Class.
2. Organize the data into an Excel document with the following format:

| Name                  | Class | Email             |
|-----------------------|-------|-------------------|
| Brokkr Sheldon        | kc2   | oafpys@domain.com |
| Réamonn Eusebio       | gb1   | vrtrnb@domain.com |
| Christelle Christiana | qj3   | dkavfo@domain.com |
| Sigeberht Suibne      | eh1   | ylgibm@domain.com |
| Kinborough Cristian   | bo2   | exvxcp@domain.com |

3. Go to your domain followed by `/config`.
4. Paste the Excel data into the text area (without column titles).
5. Click "Generate Data" to verify and submit the data.

The server will then generate the player assignments.

## Game Administration

Navigate to `/adminPanel` where administrators can view player assignments, placements, logs, and forcibly eliminate players. Access is restricted to emails specified in the `administratorEmails` array in the config.

# EOS Node Watcher

The goal of this watcher is to easily replay chains from the desired block (let's
say after you deploy your contract is what usually matters), filter the block actions
related to your desired contracts and submit it to your desired channel: message
queues, websockets, databases etc.

## Setup

```
cd ~
git clone https://github.com/leordev/eos-node-watcher
cd eos-node-watcher
npm install
vi config.json # here you will customize the setup to your needs
node index.js
```

## Configuration

Here's the default configuration example

```
{
  "watchInterval": 500,
  "eosApi": "http://mainnet.eoscalgary.io/v1",
  "eosHistoryApi": "http://api.cypherglass.com/v1",
  "apiTimeout": 3000,
  "initialBlock": 1293913,
  "accounts": {
    "monstereosio": [],   # leave an empty array to listen to all the actions
    "eosio.token": [      # here you can filter all the actions
      {
        "name": "transfer",
        "data": { "to": "monstereosio" } # (optional) if you set the data, it
      }                                  # will filter the actions parameters
    ]
  },
  "mongodb": {
    "isActive": true,
    "address": "mongodb://localhost:27017",
    "database": "eos_node_watcher",
    "prefix": "enw_"
  },
  "zeromq": {
    "isActive": false,
    "address": "tcp://*:60400"
  },
  "amqp": {
    "isActive": true,
    "address": "amqp://localhost",
    "channel": "eosnodewatcher"
  }
}
```

## Next Steps

1. Add more "pusher" options and possibily split that file to single pusher per file
2. Improve the action filters (test for vectors and add some "sql-style" options eg. LIKE `%` etc.)
3. ??? Accepting ideas! :)

Feel free to fork, collaborate and add ideas!

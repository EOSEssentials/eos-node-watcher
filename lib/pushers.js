const zeromq = require('zeromq')
const amqp = require('amqplib/callback_api')
const mongodb = require('mongodb')

module.exports = async (logger, zmqConf, mongoConf, amqpConf) => {
  const pushers = []

  if (zmqConf.isActive) {
    const zmqPublisher = zeromq.socket('pub')
    zmqPublisher.bind(zmqConf.address, err => {
      if (err) throw err;
      logger.info('Listening for zmq subscribers...');
    })

    pushers.push(transactions => {
      transactions.forEach(transaction => {
        zmqPublisher.send(JSON.stringify(transaction))
      })
      logger.info(`${transactions.length} transaction(s) pushed to ZeroMQ`)
    })

  }

  if (amqpConf.isActive) {
    const amqpSetup = new Promise((resolve, reject) => {
      amqp.connect(amqpConf.address, (err, conn) => {
        if (err) reject(err)
        conn.createChannel(function(err, ch) {
          if (err) reject(err)
          resolve(ch)
        })
      })
    })

    const channel = await amqpSetup

    pushers.push(transactions => {
      transactions.forEach(t  => channel.sendToQueue(amqpConf.channel, new Buffer(JSON.stringify(t))))
      logger.info(`${transactions.length} transaction(s) pushed to AMQP`)
    })
  }

  if (mongoConf.isActive) {
    const mongoClient = mongodb.MongoClient

    const mongoSetup = new Promise((resolve, reject) => {
      mongoClient.connect(mongoConf.address, (err, client) => {
        if (err) reject(err)

        const db = client.db(mongoConf.database)

        pushers.push(transactions => {
          return new Promise((resolve, reject) => {
            db.collection(`${mongoConf.prefix || ''}transactions`)
              .insertMany(transactions, (err, res) => {
                if (err) {
                  reject(err)
                } else {
                  logger.info(`${res.result.n} transaction(s) inserted to MongoDB`)
                  resolve(true)
                }
              })
          })
        })
        resolve(true)
      })
    })

    await mongoSetup
  }

  return pushers
}

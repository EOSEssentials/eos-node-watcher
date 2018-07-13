const zeromq = require('zeromq')
const mongodb = require('mongodb')

module.exports = async (logger, zmqConf, mongoConf) => {
  const pushers = []

  if (zmqConf.isActive) {
    const zmqPublisher = zeromq.socket('pub')
    zmqPublisher.bind(zmqConf.address, err => {
      if (err) throw err;
      logger.info('Listening for zmq subscribers...');
    })

    pushers.push(transactions => {
      return new Promise((resolve, reject) => {
        transactions.forEach(transaction => {
          zmqPublisher.send(JSON.stringify(transaction))
        })
        resolve(true)
      })
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

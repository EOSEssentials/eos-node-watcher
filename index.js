'use strict'

const logger = require('simple-node-logger').createSimpleLogger()
const nconf = require('nconf')
const fs = require('fs')

const LAST_BLOCK_FILE = '.lastblock'

let pushers = null

nconf.argv().env('__')
nconf.defaults({conf: `${__dirname}/config.json`})
nconf.file(nconf.get('conf'))

const api = require('./lib/eosApi')(nconf.get('eosApi'), nconf.get('eosHistoryApi'), nconf.get('apiTimeout'))
const actions = require('./lib/actions')(nconf.get('accounts'))

const watchInterval = nconf.get('watchInterval')

let lastChainInfo = null
let nextSyncBlock = nconf.get('initialBlock')
let isSyncing = true

const mainLoop = async () => {

  if (!pushers)
    pushers = await require('./lib/pushers')(logger, nconf.get('zeromq'), nconf.get('mongodb'), nconf.get('amqp'))

  const currentBlock = nextSyncBlock
  logger.info(`Syncing block ${currentBlock}`)

  try {
    if (lastChainInfo == null || nextSyncBlock <= lastChainInfo.head_block_num) {
      lastChainInfo = await api.getChainInfo()
    }

    if (lastChainInfo && lastChainInfo.head_block_num >= nextSyncBlock) {
      const blockInfo = await api.getBlockInfo(nextSyncBlock)
      const transactionsIds = actions.filteredTransactionsIds(blockInfo)
      const transactions = transactionsIds && transactionsIds.length ?
        await api.getBulkTransactions(transactionsIds) : null

      if (transactions && transactions.length) {
        pushTransactions(transactions)
      }

      await saveLastBlock()
      nextSyncBlock++
    }
  } catch (err) {
    const { message } = err
    logger.error(`Sync failed on block ${currentBlock} >>> `,
      message || err || 'Unknown Error')
  }

  isSyncing = !lastChainInfo || lastChainInfo.head_block_num > nextSyncBlock

  isSyncing ? setImmediate(mainLoop)
  : setTimeout(mainLoop, watchInterval)
}

const saveLastBlock = () => {
  return new Promise((resolve, reject) => {
    fs.writeFile(LAST_BLOCK_FILE, nextSyncBlock, (err) => {
      if (err)
        reject(err)
      else
        resolve(true)
    });
  })
}

const pushTransactions = transactions => {
  return Promise.all(pushers.map(p => p(transactions)))
}

fs.readFile(LAST_BLOCK_FILE, (err,data) => {
  if (err) {
    logger.info(`Blocks were never synced, starting from ${nextSyncBlock}`)
  } else {
    nextSyncBlock = Number(data) + 1
    logger.info(`Last synced block: ${nextSyncBlock} - resyncing...`)
  }
  mainLoop()
})


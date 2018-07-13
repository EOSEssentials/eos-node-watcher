const axios = require('axios')

let apiUrl = ''
let historyApiUrl = ''
let timeout = 0

const getChainInfo = () => {
  return axios.get(apiUrl + '/chain/get_info', {timeout})
  .then(res => res.data)
}

const getBlockInfo = blockNum => {
  return axios.post(
    apiUrl + '/chain/get_block',
    {block_num_or_id: blockNum},
    {timeout}
  ).then(res => res.data)
}

const getTransaction = id => {
  return axios.post(
    historyApiUrl + '/history/get_transaction',
    {id},
    {timeout}
  ).then(res => res.data)
}

const getBulkTransactions = ids => {
  const transactionsPromises = ids.map(getTransaction)
  return Promise.all(transactionsPromises)
}

module.exports = (url, historyUrl, apiTimeout = 3000) => {
  apiUrl = url
  historyApiUrl = historyUrl
  timeout = apiTimeout
  return { getChainInfo, getBlockInfo, getTransaction, getBulkTransactions }
}

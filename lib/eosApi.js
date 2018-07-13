const axios = require('axios')

let apiUrl = ''

const getChainInfo = () => {
  return axios.get(apiUrl + '/chain/get_info', {timeout: 3000})
  .then(res => res.data)
}

const getBlockInfo = blockNum => {
  return axios.post(
    apiUrl + '/chain/get_block',
    {block_num_or_id: blockNum},
    {timeout: 3000}
  ).then(res => res.data)
}

module.exports = url => {
  apiUrl = url
  return { getChainInfo, getBlockInfo }
}

let accounts = {}
let receivers = {}

const isValidAction = action => {
  const contractActions = accounts[action.account]
  return contractActions &&
    (contractActions.length === 0 ||
    contractActions.indexOf(action.name) >= 0)
}

const filteredTransactions = block => {
  if (!block || !block.transactions || !block.transactions.length)
    return

  const { transactions, block_num } = block

  return transactions
    .filter(transaction => {
      return transaction.trx && transaction.trx.transaction &&
        transaction.trx.transaction.actions &&
        transaction.trx.transaction.actions.length > 0 &&
        transaction.trx.transaction.actions.filter(isValidAction).length > 0
    }).map(t =>
      Object.assign({}, t.trx.transaction,
        {id: t.trx.id, block_num})
    )
}

module.exports = (accountsParam, receiversParam) => {
  accounts = accountsParam
  receivers = receiversParam
  return { filteredTransactions }
}

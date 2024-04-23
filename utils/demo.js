const { Transaction } = require('bitcoinjs-lib')

function coinbase() {
    const coinbase = "010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff2503233708184d696e656420627920416e74506f6f6c373946205b8160a4256c0000946e0100ffffffff02f595814a000000001976a914edf10a7fac6b32e24daa5305c723f3de58db1bc888ac0000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf90120000000000000000000000000000000000000000000000000000000000000000000000000"

    const coinbaseTx = Transaction.fromHex(coinbase)

    const wtxids = [coinbaseTx.getHash(true).reverse().toString('hex')]

        const tx = JSON.parse(readFileSync(`./code-challenge-2024-mempool/valid-mempool/${txids[i]}.json`))
        totalWeight += BigInt(tx.weight)
        totalFee += BigInt(tx.fee)
        const parsedTx = Transaction.fromHex(tx.hex)
        const wtxid = parsedTx.getHash(true).reverse().toString('hex')
        wtxids.push(wtxid)
    
    console.log(coinbaseTx);
    console.log(wtxids);
}

module.exports = {
    coinbase,
}


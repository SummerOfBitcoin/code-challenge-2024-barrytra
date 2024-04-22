const crypto = require('crypto');
const { HASH256 } = require('../op_codes/opcodes');

// Function to calculate the Merkle root
function findMerkleRoot(transactions) {

    if (transactions.length === 1) {
        return transactions[0];
    }

    // If number of transactions is odd, duplicate the last transaction
    if (transactions.length % 2 !== 0) {
        transactions.push(transactions[transactions.length - 1]);
    }

    const newTransactions = [];

    for (let i = 0; i < transactions.length; i += 2) {
        const left = transactions[i];
        const right = transactions[i + 1];
        const combined = left + right;

        // Calculate the hash of the combined transactions
        const hash = HASH256(Buffer.from(combined, "hex"));
        newTransactions.push(Buffer.from(hash).toString("hex"));
    }


    // Return the final Merkle root
    return findMerkleRoot(newTransactions);
}

module.exports = {
    findMerkleRoot
}

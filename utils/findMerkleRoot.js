const crypto = require('crypto');

// Function to calculate the Merkle root
function findMerkleRoot(transactions) {
    if (transactions.length === 0) {
        return null;
    }

    // Recursive function to calculate the Merkle root
    function recursiveMerkleRoot(transactions) {
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
            const hash = crypto.createHash('sha256').update(combined).digest('hex');
            newTransactions.push(hash);
        }

        return recursiveMerkleRoot(newTransactions);
    }

    // Return the final Merkle root
    return recursiveMerkleRoot(transactions);
}

module.exports = {
    findMerkleRoot
}

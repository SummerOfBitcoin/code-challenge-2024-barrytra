const crypto = require('crypto');
const { HASH256 } = require('../op_codes/opcodes');


function findMerkleRoot (txids) {
    if (txids.length === 0) return null

    let level = txids
    while (level.length > 1) {
        const nextLevel = []

        for (let i = 0; i < level.length; i += 2) {
            let pairHash
            if (i + 1 === level.length) {
                // In case of an odd number of elements, duplicate the last one
                pairHash = HASH256(level[i] + level[i])
            } else {
                pairHash = HASH256(level[i] + level[i + 1])
            }
            nextLevel.push(pairHash)
        }

        level = nextLevel
    }

    return level[0]
}

module.exports = {
    findMerkleRoot
}

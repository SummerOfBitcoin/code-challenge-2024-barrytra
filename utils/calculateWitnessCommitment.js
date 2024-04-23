const {HASH256} = require("../op_codes/opcodes");
const {findMerkleRoot} = require("./findMerkleRoot")

const WITNESS_RESERVED_VALUE = Buffer.from(
    '0000000000000000000000000000000000000000000000000000000000000000',
    'hex',
)

function calculateWitnessCommitment(wtxids){
    const witnessRoot = findMerkleRoot(wtxids)
    console.log(witnessRoot)
    const witnessReservedValue = WITNESS_RESERVED_VALUE.toString('hex')
    console.log(witnessReservedValue)
    console.log(HASH256(witnessRoot + witnessReservedValue))
    return HASH256(witnessRoot + witnessReservedValue)
}

module.exports = {
    calculateWitnessCommitment,
}
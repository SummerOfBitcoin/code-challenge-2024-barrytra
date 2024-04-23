const {HASH256} = require("../op_codes/opcodes");
const {findMerkleRoot} = require("./findMerkleRoot")

const WITNESS_RESERVED_VALUE = Buffer.from(
    '0000000000000000000000000000000000000000000000000000000000000000',
    'hex',
)

function calculateWitnessCommitment(wtxids){
    const witnessRoot = findMerkleRoot(wtxids)
    const witnessReservedValue = WITNESS_RESERVED_VALUE.toString('hex')
    return Buffer.from(HASH256(Buffer.from(witnessRoot + witnessReservedValue), "hex")).toString("hex");
}

module.exports = {
    calculateWitnessCommitment,
}
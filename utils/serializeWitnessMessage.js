const { HASH256 } = require("../op_codes/opcodes");

function serializeWitnessMessage(transaction, vin, hashType) {
    let buffer = Buffer.alloc(0);

    // Version
    buffer = Buffer.concat([buffer, Buffer.from(transaction.version.toString(16).padStart(8, '0'), 'hex').reverse()]);

    // hashPrevouts
    let hashPrevout = "";
    for (let input of transaction.vin) {
        // txid of each input
        hashPrevout += Buffer.from((input.txid), "hex").reverse().toString("hex");

        // vout of each input
        hashPrevout += Buffer.from(input.vout.toString(16).padStart(8, '0'), 'hex').reverse().toString("hex")
    }
    buffer = Buffer.concat([buffer, Buffer.from(HASH256(hashPrevout), "hex")]);

    // hashSequence
    let hashSequence = "";
    for (let input of transaction.vin) {
        // sequence of each input
        hashSequence += Buffer.from(input.sequence.toString(16).padStart(8, '0'), 'hex').reverse().toString("hex")
    }
    // console.log(HASH256(hashSequence))
    buffer = Buffer.concat([buffer, Buffer.from(HASH256(hashSequence), "hex")]);


    // Transaction ID (TxID)
    buffer = Buffer.concat([buffer, Buffer.from((vin.txid), "hex").reverse()]);

    // Vout Index
    buffer = Buffer.concat([buffer, Buffer.from(vin.vout.toString(16).padStart(8, '0'), 'hex').reverse()]);

    // vin scriptPubkey
    let scriptPubkey = vin.prevout.scriptpubkey.slice(4);

    // scriptcode
    let scriptcode = `1976a914${scriptPubkey}88ac`
    buffer = Buffer.concat([buffer, Buffer.from(scriptcode, "hex")]);

    // amount
    buffer = Buffer.concat([buffer, Buffer.from(vin.prevout.value.toString(16).padStart(16, '0'), 'hex').reverse()]);


    // Sequence
    buffer = Buffer.concat([buffer, Buffer.from(vin.sequence.toString(16).padStart(8, '0'), 'hex').reverse()]);

    // hashOutputs
    let hashOutputs = "";
    // Outputs (vout)
    for (let output of transaction.vout) {
        // Value of each output
        hashOutputs += Buffer.from(output.value.toString(16).padStart(16, '0'), 'hex').reverse().toString("hex");

        hashOutputs += Buffer.from(encodeVarInt(output.scriptpubkey.length/2)).toString("hex");
        // console.log(Buffer.from(encodeVarInt(output.scriptpubkey.length / 2)).toString("hex"))
        // Locking Script of each output
        hashOutputs += output.scriptpubkey;
    }
    buffer = Buffer.concat([buffer, Buffer.from(HASH256(hashOutputs), "hex")]);


    // Locktime
    buffer = Buffer.concat([buffer, Buffer.from(transaction.locktime.toString(16).padStart(8, '0'), 'hex').reverse()])

    // hashType
    buffer = Buffer.concat([buffer, Buffer.from(hashType.toString(16).padStart(8, '0'), 'hex').reverse()]);

    return Buffer.from(buffer).toString("hex");
}

function encodeVarInt(value) {
    if (value < 0xfd) {
        return Buffer.from([value]);
    } else if (value <= 0xffff) {
        return Buffer.concat([Buffer.from([0xfd]), Buffer.from(value.toString(16).padStart(4, '0'), 'hex').reverse()]);
    } else if (value <= 0xffffffff) {
        return Buffer.concat([Buffer.from([0xfe]), Buffer.from(value.toString(16).padStart(8, '0'), 'hex').reverse()]);
    } else {
        return Buffer.concat([Buffer.from([0xff]), Buffer.from(value.toString(16).padStart(16, '0'), 'hex').reverse()]);
    }
}

module.exports = {
    serializeWitnessMessage,
}
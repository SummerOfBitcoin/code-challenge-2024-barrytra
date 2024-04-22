function serializeMessage(transaction, vin, hashType) {
    let buffer = Buffer.alloc(0);

    // Version
    buffer = Buffer.concat([buffer, Buffer.from(transaction.version.toString(16).padStart(8, '0'), 'hex').reverse()]);

    // Marker and Flag for SegWit
    if (transaction.vin[0].witness) {
        buffer = Buffer.concat([buffer, Buffer.from('00', 'hex')]); // Marker
        buffer = Buffer.concat([buffer, Buffer.from('01', 'hex')]); // Flag
    }

    // Input Count
    buffer = Buffer.concat([buffer, encodeVarInt(transaction.vin.length)]);

    // Inputs (vin)
    for (let input of transaction.vin) {
        // Transaction ID (TxID)
        buffer = Buffer.concat([buffer, Buffer.from((input.txid), "hex").reverse()]);

        // Vout Index
        buffer = Buffer.concat([buffer, Buffer.from(input.vout.toString(16).padStart(8, '0'), 'hex').reverse()]);

        if(input.prevout.scriptpubkey === vin.prevout.scriptpubkey){
            buffer = Buffer.concat([buffer, encodeVarInt(vin.prevout.scriptpubkey.length / 2)]);
            buffer = Buffer.concat([buffer, Buffer.from(vin.prevout.scriptpubkey, 'hex')]);
        }else {
            buffer = Buffer.concat([buffer, Buffer.from('00', 'hex')])
        }

        // Sequence
        buffer = Buffer.concat([buffer, Buffer.from(input.sequence.toString(16).padStart(8, '0'), 'hex').reverse()]);
    }

    // Output Count
    buffer = Buffer.concat([buffer, encodeVarInt(transaction.vout.length)]);

    // Outputs (vout)
    for (let output of transaction.vout) {
        // Value
        buffer = Buffer.concat([buffer, Buffer.from(output.value.toString(16).padStart(16, '0'), 'hex').reverse()]);

        // Script Length
        buffer = Buffer.concat([buffer, encodeVarInt(output.scriptpubkey.length / 2)]);

        // Locking Script
        buffer = Buffer.concat([buffer, Buffer.from(output.scriptpubkey, 'hex')]);
    }

    // Witness Data (for SegWit)
    for (let input of transaction.vin) {
        if (input.witness) {
            buffer = Buffer.concat([buffer, encodeVarInt(input.witness.length)]);
            for (let witnessItem of input.witness) {
                buffer = Buffer.concat([buffer, encodeVarInt(witnessItem.length / 2)]);

                buffer = Buffer.concat([buffer, Buffer.from(witnessItem, 'hex')]);
            }
        }
    }

    // Locktime
    buffer = Buffer.concat([buffer, Buffer.from(transaction.locktime.toString(16).padStart(8, '0'), 'hex').reverse()])

    // hashType
    buffer = Buffer.concat([buffer, Buffer.from(hashType.toString(16).padStart(8, '0'), 'hex').reverse()]);

    return buffer;
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
    serializeMessage,
}
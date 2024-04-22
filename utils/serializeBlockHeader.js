

function hexToLE(hexString) {
    const hexBytes = hexString.match(/.{1,2}/g).reverse();
    return Uint8Array.from(hexBytes.map(byte => parseInt(byte, 16)));
}

function serializeBlockHeader(version, prevBlockHash, merkleRoot, timestamp, bits, nonce) {

    let buffer = Buffer.alloc(0);

    // version
    buffer = Buffer.concat([buffer, Buffer.from(version, "hex")]);

    // previous blockHash
    buffer = Buffer.concat([buffer, Buffer.from((prevBlockHash), "hex").reverse()]);

    // merkleRoot
    buffer = Buffer.concat([buffer, Buffer.from((merkleRoot), "hex")]);

    // timestamp
    buffer = Buffer.concat([buffer, Buffer.from(timestamp.toString(16).padStart(8, '0'), 'hex').reverse()]);
    
    // bits
    buffer = Buffer.concat([buffer, Buffer.from(bits, "hex")])

    // nonce
    buffer = Buffer.concat([buffer, Buffer.from(nonce.toString(16).padStart(8, '0'), 'hex').reverse()]);

    
    return Buffer.from(buffer).toString("hex");
}

module.exports = {
    serializeBlockHeader
}
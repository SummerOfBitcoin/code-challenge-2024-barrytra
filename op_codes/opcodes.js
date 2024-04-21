const crypto = require('crypto');


// OP_HASH function
function OP_HASH(s) {
    let hash = crypto.createHash('sha256').update(s, 'hex').digest();
    hash = crypto.createHash('ripemd160').update(hash).digest();
    // console.log(Buffer.from(hash).toString("hex"));
    return Buffer.from(hash).toString("hex")
}

// HASH256 function
function HASH256(input){
    const hash1 = crypto.createHash('sha256').update(input).digest();
    return crypto.createHash('sha256').update(hash1).digest();
}



// SHA-256 function
function SHA256(input) {
    return crypto.createHash('ripemd160').update(input).digest();
}


module.exports = {
    OP_HASH,
    HASH256,
    SHA256,
}
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
    const h1 = crypto.createHash('sha256').update(Buffer.from(input, 'hex')).digest()
    return crypto.createHash('sha256').update(h1).digest('hex')
}



// SHA-256 function
function SHA256(input) {
    return crypto.createHash('sha256').update(input).digest();
}


module.exports = {
    OP_HASH,
    HASH256,
    SHA256,
}
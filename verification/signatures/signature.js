const { serializeTransaction } = require('../../utils/serialiseTransaction');
const { HASH256 } = require('../../op_codes/opcodes');
const secp256k1 = require('secp256k1');


function verifySignature(publicKey, signatureObj, messageHash) {
    return secp256k1.ecdsaVerify(signatureObj, messageHash, publicKey);
}

function verify_p2pkh(transaction, input) {
    const prevout = input.prevout;
    const scriptSig = new Uint8Array(Buffer.from(input.scriptsig, 'hex'));

    // Parse scriptPubKey
    const scriptPubKey = Buffer.from(prevout.scriptpubkey, 'hex');


    // Extract public key hash from scriptPubKey
    const pubKeyHash = scriptPubKey.slice(3, 23);
    // Extract signature and public key from scriptSig
    const signatureLength = scriptSig[0];
    const signature = scriptSig.slice(1, 1 + signatureLength);

    let r, s;
    if (signature[3] == 33) {
        r = signature.slice(5, 5 + 32);
        s = signature.slice(39, 71);
    } else {
        r = signature.slice(4, 4 + 32);
        s = signature.slice(38, 70);
    }
    const derSignature = Buffer.concat([r, s]);

    // const signatureObj = {
    //     r: signature.slice(4, 4 + rLength+1),
    //     s: signature.slice(6 + rLength, 6 + rLength + sLength+1)
    // };

    // function bufferToBigInt(buffer, start = 0, end = buffer.length) {
    //     const bufferAsHexString = buffer.slice(start, end).toString("hex");
    //     return BigInt(`0x${bufferAsHexString}`);
    // }
    // signatureObj.r = bufferToBigInt(signatureObj.r);
    // signatureObj.s = bufferToBigInt(signatureObj.s);
    // console.log(signatureObj)

    const publicKeyLength = scriptSig[1 + signatureLength];
    const publicKey = scriptSig.slice(1 + signatureLength + 1);

    const txnHex = serializeTransaction(transaction);
    const txnHash = Buffer.from(HASH256(txnHex));

    const isVerified = verifySignature(publicKey, derSignature, txnHash);
    return isVerified;
}


module.exports = {
    verify_p2pkh,
}
const { serializeMessage } = require('../../utils/serializeMessage');
const { HASH256, SHA256 } = require('../../op_codes/opcodes');
const secp256k1 = require('secp256k1');

function verify_p2pkh(transaction, input) {
    const scriptSig = new Uint8Array(Buffer.from(input.scriptsig, 'hex'));
 
    // Extract signature and public key from scriptSig
    const signatureLength = scriptSig[0];
    const signature = scriptSig.slice(1, 1 + signatureLength);
    // console.log(Buffer.from(signature).toString("hex"))

    let r, s;
    if (signature[3] == 33) {
        r = signature.slice(5, 5 + 32);
        s = signature.slice(39, 71);
    } else {
        r = signature.slice(4, 4 + 32);
        s = signature.slice(38, 70);
    }
    const derSignature = Uint8Array.from(Buffer.concat([r, s]));
    // console.log(Buffer.from(r).toString("hex"))
    // console.log(Buffer.from(s).toString("hex"))

    const publicKeyLength = scriptSig[1 + signatureLength];
    const publicKey = scriptSig.slice(1 + signatureLength + 1);
    // console.log(Buffer.from(publicKey).toString("hex"))

    

    const txnHex = serializeMessage(transaction, input, scriptSig[signatureLength]);
    // console.log(Buffer.from(txnHex).toString("hex"))
    const txnHash = Uint8Array.from(Buffer.from(HASH256(txnHex), "hex"));
    // console.log(Buffer.from(txnHash).toString("hex"));

    const isVerified = secp256k1.ecdsaVerify(derSignature,txnHash,publicKey);
    // console.log(isVerified)
    return isVerified;
}

function verify_v0_p2wpkh(transaction, input) {

}


module.exports = {
    verify_p2pkh,
    verify_v0_p2wpkh,
}
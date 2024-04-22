const { serializeMessage } = require('../../utils/serializeMessage');
const { HASH256, SHA256 } = require('../../op_codes/opcodes');
const secp256k1 = require('secp256k1');

const txn = {
    "version": 2,
    "locktime": 0,
    "vin": [
        {
            "txid": "fb7fe37919a55dfa45a062f88bd3c7412b54de759115cb58c3b9b46ac5f7c925",
            "vout": 1,
            "prevout": {
                "scriptpubkey": "76a914286eb663201959fb12eff504329080e4c56ae28788ac",
                "scriptpubkey_asm": "OP_DUP OP_HASH160 OP_PUSHBYTES_20 286eb663201959fb12eff504329080e4c56ae287 OP_EQUALVERIFY OP_CHECKSIG",
                "scriptpubkey_type": "p2pkh",
                "scriptpubkey_address": "14gnf7L2DjBYKFuWb6iftBoWE9hmAoFbcF",
                "value": 433833
            },
            "scriptsig": "4830450221008f619822a97841ffd26eee942d41c1c4704022af2dd42600f006336ce686353a0220659476204210b21d605baab00bef7005ff30e878e911dc99413edb6c1e022acd012102c371793f2e19d1652408efef67704a2e9953a43a9dd54360d56fc93277a5667d",
            "scriptsig_asm": "OP_PUSHBYTES_72 30450221008f619822a97841ffd26eee942d41c1c4704022af2dd42600f006336ce686353a0220659476204210b21d605baab00bef7005ff30e878e911dc99413edb6c1e022acd01 OP_PUSHBYTES_33 02c371793f2e19d1652408efef67704a2e9953a43a9dd54360d56fc93277a5667d",
            "is_coinbase": false,
            "sequence": 4294967295
        }
    ],
    "vout": [
        {
            "scriptpubkey": "76a9141ef7874d338d24ecf6577e6eadeeee6cd579c67188ac",
            "scriptpubkey_asm": "OP_DUP OP_HASH160 OP_PUSHBYTES_20 1ef7874d338d24ecf6577e6eadeeee6cd579c671 OP_EQUALVERIFY OP_CHECKSIG",
            "scriptpubkey_type": "p2pkh",
            "scriptpubkey_address": "13pjoLcRKqhzPCbJgYW77LSFCcuwmHN2qA",
            "value": 387156
        },
        {
            "scriptpubkey": "76a9142e391b6c47778d35586b1f4154cbc6b06dc9840c88ac",
            "scriptpubkey_asm": "OP_DUP OP_HASH160 OP_PUSHBYTES_20 2e391b6c47778d35586b1f4154cbc6b06dc9840c OP_EQUALVERIFY OP_CHECKSIG",
            "scriptpubkey_type": "p2pkh",
            "scriptpubkey_address": "15DQVhQ7PU6VPsTtvwLxfDsTP4P6A3Z5vP",
            "value": 37320
        }
    ]
}


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
    const txnHash = Uint8Array.from(Buffer.from(HASH256(txnHex)));
    // console.log(Buffer.from(txnHash).toString("hex"));

    const isVerified = secp256k1.ecdsaVerify(derSignature,txnHash,publicKey);
    // console.log(isVerified)
    return isVerified;
}


module.exports = {
    verify_p2pkh,
}
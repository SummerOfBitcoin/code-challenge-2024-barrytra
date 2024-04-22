const { OP_HASH } = require("../../op_codes/opcodes");
const { getScriptpubkey_v0p2wpkh, getScriptpubkey_p2pkh } = require("../../scriptpubkey/scriptpubkey");

// script verification of txn typpe v0_p2wpkh
function script_v0_p2wpkh(vin) {
    let hash = OP_HASH(vin.witness[1]);
    let scriptPubkey = getScriptpubkey_v0p2wpkh(vin.prevout.scriptpubkey_asm);
    if (hash === scriptPubkey) return true;
    return false;
}

function script_p2pkh(vin) {
    let pubkey = [];
    for (let i = vin.scriptsig.length - 66; i < vin.scriptsig.length; i++) {
        pubkey += vin.scriptsig[i];
    }
    let hash = OP_HASH(pubkey);
    let scriptPubkey = getScriptpubkey_p2pkh(vin.prevout.scriptpubkey);
    // console.log(hash===scriptPubkey)
    if (hash === scriptPubkey) return true;
    return false;
}


module.exports = {
    script_v0_p2wpkh,
    script_p2pkh,
}
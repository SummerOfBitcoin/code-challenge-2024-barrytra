// function to get script Pubkey
function getScriptpubkey_v0p2wpkh(str) {
    let scriptpubkey = [];

    for (let i = 4; i < str.length; i++) {
        scriptpubkey += str[i];
    }
    return scriptpubkey.toString();
}

function getScriptpubkey_p2pkh(str) {
    let scriptpubkey = [];

    for (let i = 6; i < str.length-4; i++) {
        scriptpubkey += str[i];
    }

    return scriptpubkey.toString();
}

module.exports = {
    getScriptpubkey_v0p2wpkh,
    getScriptpubkey_p2pkh,
}
const { readFileSync, writeFileSync, appendFileSync } = require('fs');
const crypto = require('crypto');
const { serializeTransaction } = require("./utils/serializeTransaction");
const { serializeWitnessTransaction } = require("./utils/serializeWitnessTransaction");
const { findMerkleRoot } = require("./utils/findMerkleRoot");
const { script_p2pkh, script_v0_p2wpkh } = require("./verification/script/script")
const { HASH256 } = require("./op_codes/opcodes");
const { verify_p2pkh, verify_v0_p2wpkh } = require('./verification/signatures/signature');
const {serializeBlockHeader} = require("./utils/serializeBlockHeader");
const {calculateWitnessCommitment} = require("./utils/calculateWitnessCommitment")

class Transaction {
    constructor(version, locktime, vin, vout) {
        this.version = version;
        this.locktime = locktime;
        this.vin = vin;
        this.vout = vout;
    }
}

class Block {
    constructor( prevBlockHash, merkleRoot) {
        this.version = "20000000";
        this.prevBlockHash = prevBlockHash;
        this.merkleRoot = merkleRoot;
        this.timestamp = Date.now()/1000;
        this.bits = "1f00ffff";
        this.nonce = 0;
    }

    hashBlock() {
        const blockString = serializeBlockHeader(this.version, this.prevBlockHash, this.merkleRoot, this.timestamp, this.bits, this.nonce);
        return Buffer.from(HASH256(blockString), "hex").reverse().toString("hex");
    }

    mineBlock(difficulty) {
        while (this.nonce < 4294967295) {
            this.nonce++;
            const hash = this.hashBlock();
            for (let i = 0; i < hash.length; i++) {
                if (hash[i] > difficulty[i]) {
                    break;
                }
                if (hash[i] < difficulty[i]) {
                    return;
                }
            }
        }
    }

    getBlockHeader() {
        return serializeBlockHeader(this.version, this.prevBlockHash, this.merkleRoot, this.timestamp, this.bits, this.nonce)
    }
}


// Parse transaction JSON files
function parseTransactionFile(filename) {
    const { version, locktime, vin, vout } = filename;
    return new Transaction(version, locktime, vin, vout);
}


function getTxid(serializedTransaction) {

    // Double SHA256 hash
    const txid = HASH256(serializedTransaction)

    return txid;
}

function getWTxid(serializedTransaction) {

    // Double SHA256 hash
    const txid = HASH256(serializedTransaction)

    return txid;
}

const txn = {
    "version": 1,
    "locktime": 0,
    "vin": [
        {
            "txid": "f615c0412f959c0b3813cbd232bbb1c1a8ad656c37fb60b601f633a6d2d76942",
            "vout": 20,
            "prevout": {
                "scriptpubkey": "0014df4bf9f3621073202be59ae590f55f42879a21a0",
                "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 df4bf9f3621073202be59ae590f55f42879a21a0",
                "scriptpubkey_type": "v0_p2wpkh",
                "scriptpubkey_address": "bc1qma9lnumzzpejq2l9ntjepa2lg2re5gdqn3nf0c",
                "value": 175902
            },
            "scriptsig": "",
            "scriptsig_asm": "",
            "witness": [
                "3045022100a2a839100b7ca7dc97ca8234de56caabc5d30bf5ce561aa61ac1925d9ed09ed60220625b88cc6ddc0715c178fb57fd1ffb65ee905de7670595f2dea9c5feeb6b40d401",
                "03cbf0481cd6ca805552d024e051f1f73086a2abebecdec8bc793d5ef87ec1a2f6"
            ],
            "is_coinbase": false,
            "sequence": 4294967295
        }
    ],
    "vout": [
        {
            "scriptpubkey": "a914626b93cce10ebd0d4d876487f602272c01e39e2387",
            "scriptpubkey_asm": "OP_HASH160 OP_PUSHBYTES_20 626b93cce10ebd0d4d876487f602272c01e39e23 OP_EQUAL",
            "scriptpubkey_type": "p2sh",
            "scriptpubkey_address": "3AfR1wwfaaftqLfv2pAa9ebEXG43uZ9cdn",
            "value": 172905
        }
    ]
}

// Validate transactions
let validTxids = [];
let validWTxids = ['0000000000000000000000000000000000000000000000000000000000000000']
function validateTransactions(transactions) {
    let ct = 0;
    // Simulated validation, assuming all transactions are valid
    // console.log(txn)
    // const txid = getTxid(txn);
    // console.log("txid:", txid);
    // console.log("file:", Buffer.from(crypto.createHash('sha256').update(txid, "hex").digest()).toString("hex"));
    // console.log((crypto.createHash('sha256').update(getTxid(transactions[0]), "hex").digest()))
    for(let transaction of transactions){
        // for coinbase transaction

        // OP_HASH(transaction);
        let flg = true;
        // if(transaction.vin[0].prevout.scriptpubkey_type === "p2sh"){
        //     console.log(transaction.vin[0].txid);
        // }

        // ***CHECK INPUT SUM IS GREATER THAN OUTPUT SUM***
        let inputSum = 0, outputSum = 0;
        transaction.vin.map((input) => {
            inputSum += input.prevout.value;
        })
        transaction.vout.map((output) => {
            outputSum += output.value;
        })
        // if below condition holds, txn is invalid
        if (inputSum <= outputSum) {
            flg = false;
            delete transactions.transaction;
        }
        //  *** check pubkey script validation ***
        if (flg) {
            flg = false;
            for (let vin of transaction.vin) {
                if (vin.prevout.scriptpubkey_type === "v1_p2tr"){
                    flg = true;
                }
                if (vin.prevout.scriptpubkey_type === "v0_p2wpkh"){
                   flg = true
                   if(!script_v0_p2wpkh(vin) || !verify_v0_p2wpkh(transaction, vin)){
                    flg=false;
                    break;
                   }
                }
                if (vin.prevout.scriptpubkey_type === "p2pkh") {
                    flg = true;
                    // pubkey script validation
                    if (!script_p2pkh(vin) || !verify_p2pkh(transaction, vin)) {
                        flg = false;
                        break;
                    }
                }
            }
            if (flg) {
                ct++;
                // console.log(transaction);
                // getTxid(transaction);
                // Serialize transaction
                const serializedTransaction = serializeTransaction(txn)
                const serializedWitnessTransaction = serializeWitnessTransaction(txn)
                // console.log(serializedTransaction)
                // console.log(getTxid(serializedTransaction))
                validTxids.push(getTxid(serializedTransaction));
                validWTxids.push(getWTxid(serializedWitnessTransaction));
            }
        }
    }
    console.log(ct)
}

// Create block
function createBlock(transactions, prevBlockHash, difficulty, merkleRoot) {
    return new Block(transactions, prevBlockHash, difficulty, merkleRoot);
}

// importing transaction files and adding them into transactionFiles object;
var transactionFiles = [];
var normalizedPath = require("path").join(__dirname, "mempool");


require("fs").readdirSync(normalizedPath).forEach(function (file) {
    const curFile = require("./mempool/" + file);
    transactionFiles.push(curFile);
});
// console.log(transactionFiles);
const transactions = transactionFiles.map(parseTransactionFile);
// console.log(transactions)

validateTransactions(transactions);

const witnessCommitment = calculateWitnessCommitment(validWTxids)

const serializedCoinbaseTransaction = `010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff2503233708184d696e656420627920416e74506f6f6c373946205b8160a4256c0000946e0100ffffffff02f595814a000000001976a914edf10a7fac6b32e24daa5305c723f3de58db1bc888ac0000000000000000266a24aa21a9ed${witnessCommitment}0120000000000000000000000000000000000000000000000000000000000000000000000000`

const coinbaseTxid = getTxid(serializedCoinbaseTransaction);

validTxids.unshift(coinbaseTxid)
// Testing
const prevBlockHash = "0000000000000000000000000000000000000000000000000000000000000000";
const difficulty = "0000ffff00000000000000000000000000000000000000000000000000000000";





// Mine block
function mineBlock(transactions, prevBlockHash, difficulty) {
    const merkleRoot = findMerkleRoot(validTxids);
    const block = createBlock(prevBlockHash, merkleRoot);
    const minedBlockHash = block.mineBlock(difficulty);
    return { minedBlockHash, block };
}

// Write block and transactions to output.txt
function writeToOutput(blockHeader, serializedCoinbaseTransaction, transactions) {
    writeFileSync('output.txt', blockHeader + '\n');
    appendFileSync('output.txt', serializedCoinbaseTransaction + '\n');

    transactions.forEach(tx => {
        // reverse byte order
        tx = Buffer.from(tx, "hex").reverse().toString("hex");
        appendFileSync('output.txt', tx + '\n');
    });
}

// Mine block
const { minedBlockHash, block } = mineBlock(transactionFiles, prevBlockHash, difficulty);

// Write to output.txt
writeToOutput(block.getBlockHeader(), serializedCoinbaseTransaction, validTxids);
// console.log(`Mined block hash: ${minedBlockHash}`);
// console.log('Block and transactions written to output.txt');

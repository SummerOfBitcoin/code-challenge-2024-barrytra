const { readFileSync, writeFileSync, appendFileSync } = require('fs');
const crypto = require('crypto');
const { serializeTransaction } = require("./utils/serializeTransaction");
const { serializeWitnessTransaction } = require("./utils/serializeWitnessTransaction");
const { findMerkleRoot } = require("./utils/findMerkleRoot");
const { pubkey_p2pkh, pubkey_v0_p2wpkh} = require("./verification/script/pubkeyscript")
const { HASH256 } = require("./op_codes/opcodes");
const { signature_p2pkh, signature_v0_p2wpkh } = require('./verification/signatures/signaturescript');
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

// Validate transactions
let validTxids = [];
let validWTxids = ['0000000000000000000000000000000000000000000000000000000000000000']
function validateTransactions(transactions) {
    let ct = 0;
    for(let transaction of transactions){
        let flg = true;

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
        }

        //  *** check pubkey script and signature script validation ***
        if (flg) {
            flg = false;
            for (let vin of transaction.vin) {
                // if prevout is of type v1_p2tr
                if (vin.prevout.scriptpubkey_type === "v1_p2tr"){
                    flg = true;
                }
                // if prevout is of type v0_p2pkh
                if (vin.prevout.scriptpubkey_type === "v0_p2wpkh"){
                   flg = true
                   if(!pubkey_v0_p2wpkh(vin) || !signature_v0_p2wpkh(transaction, vin)){
                    flg=false;
                    break;
                   }
                }
                // if prevout is of type p2pkh
                if (vin.prevout.scriptpubkey_type === "p2pkh") {
                    flg = true;
                    if (!pubkey_p2pkh(vin) || !signature_p2pkh(transaction, vin)) {
                        flg = false;
                        break;
                    }
                }
            }
            if (flg) {
                ct++;
                // Serialize transaction
                const serializedTransaction = serializeTransaction(transaction)
                const serializedWitnessTransaction = serializeWitnessTransaction(transaction)
                
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


// Parse transaction JSON files
function parseTransactionFile(filename) {
    const { version, locktime, vin, vout } = filename;
    return new Transaction(version, locktime, vin, vout);
}

require("fs").readdirSync(normalizedPath).forEach(function (file) {
    const curFile = require("./mempool/" + file);
    transactionFiles.push(curFile);
});

// listing all txns
const transactions = transactionFiles.map(parseTransactionFile);

// filtering out validate txns
validateTransactions(transactions);

const witnessCommitment = calculateWitnessCommitment(validWTxids)

const serializedCoinbaseTransaction = `010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff2503233708184d696e656420627920416e74506f6f6c373946205b8160a4256c0000946e0100ffffffff02f595814a000000001976a914edf10a7fac6b32e24daa5305c723f3de58db1bc888ac0000000000000000266a24aa21a9ed${witnessCommitment}0120000000000000000000000000000000000000000000000000000000000000000000000000`

const coinbaseTxid = getTxid(serializedCoinbaseTransaction);

// add coinbase txn at start of all valid txns
validTxids.unshift(coinbaseTxid)

const prevBlockHash = "0000000000000000000000000000000000000000000000000000000000000000";
const difficulty = "0000ffff00000000000000000000000000000000000000000000000000000000";

// Mine block
function mineBlock(transactions, prevBlockHash, difficulty) {
    const merkleRoot = findMerkleRoot(validTxids);
    const block = createBlock(prevBlockHash, merkleRoot);
    block.mineBlock(difficulty);
    return block ;
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
const block = mineBlock(transactionFiles, prevBlockHash, difficulty);

// Write to output.txt
writeToOutput(block.getBlockHeader(), serializedCoinbaseTransaction, validTxids);
// console.log(`Mined block hash: ${minedBlockHash}`);
// console.log('Block and transactions written to output.txt');

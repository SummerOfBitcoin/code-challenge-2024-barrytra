const { readFileSync, writeFileSync, appendFileSync } = require('fs');
const crypto = require('crypto');
const { serializeTransaction } = require("./utils/serialiseTransaction");
const { findMerkleRoot } = require("./utils/findMerkleRoot");
const { script_p2pkh } = require("./verification/script/script")
const { HASH256 } = require("./op_codes/opcodes");
const { verify_p2pkh } = require('./verification/signatures/signature');
const {serializeBlockHeader} = require("./utils/serializeBlockHeader")

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
        this.timestamp = 1713647756;
        this.bits = "1f00ffff";
        this.nonce = 0;
    }

    hashBlock() {
        const blockString = serializeBlockHeader(this.version, this.prevBlockHash, this.merkleRoot, this.timestamp, this.bits, this.nonce);
        const buffer = Buffer.from(blockString, "hex");
        return Buffer.from(HASH256(buffer)).reverse().toString("hex");
    }

    mineBlock(difficulty) {
        while (this.nonce < 4294967295) {
            this.nonce++;
            console.log(this.nonce)
            const hash = this.hashBlock();
            for (let i = 0; i < hash.length; i++) {
                if (hash[i] > difficulty[i]) {
                    break;
                }
                if (hash[i] < difficulty[i]) {
                    console.log(serializeBlockHeader(this.version, this.prevBlockHash, this.merkleRoot, this.timestamp, this.bits, this.nonce))
                    console.log(hash)
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
    const hash = HASH256(serializedTransaction)

    const txid = Buffer.from(hash).toString('hex');
    return txid;
}

// Validate transactions
let validTransactions = [];
function validateTransactions(transactions) {
    // Simulated validation, assuming all transactions are valid
    // console.log(txn)
    // const txid = getTxid(txn);
    // console.log("txid:", txid);
    // console.log("file:", Buffer.from(crypto.createHash('sha256').update(txid, "hex").digest()).toString("hex"));
    // console.log((crypto.createHash('sha256').update(getTxid(transactions[0]), "hex").digest()))
    let a = 1;
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
            for (let vin of transaction.vin) {
                if (vin.prevout.scriptpubkey_type === "p2pkh") {
                    // pubkey script validation
                    if (!script_p2pkh(vin) || !verify_p2pkh(transaction, vin)) {
                        flg = false;
                        break;
                    }
                }
            }
            if (flg) {
                // console.log(transaction);
                // getTxid(transaction);
                // Serialize transaction
                const serializedTransaction = serializeTransaction(transaction)
                validTransactions.push(getTxid(serializedTransaction));
            }
        }

        // validate signatures. we need message for that

    }
}

// Create block
function createBlock(transactions, prevBlockHash, difficulty, merkleRoot) {
    return new Block(transactions, prevBlockHash, difficulty, merkleRoot);
}

const serializedCoinbaseTransaction = "010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff2503233708184d696e656420627920416e74506f6f6c373946205b8160a4256c0000946e0100ffffffff02f595814a000000001976a914edf10a7fac6b32e24daa5305c723f3de58db1bc888ac0000000000000000266a24aa21a9edfaa194df59043645ba0f58aad74bfd5693fa497093174d12a4bb3b0574a878db0120000000000000000000000000000000000000000000000000000000000000000000000000"

const coinbaseTxid = getTxid(serializedCoinbaseTransaction);
validTransactions.push(coinbaseTxid);

// Mine block
function mineBlock(transactions, prevBlockHash, difficulty) {
    validateTransactions(transactions);
    // console.log(validTransactions);
    const merkleRoot = findMerkleRoot(validTransactions);
    console.log(merkleRoot)
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

// Testing
const prevBlockHash = "0000000000000000000000000000000000000000000000000000000000000000";
const difficulty = "0000ffff00000000000000000000000000000000000000000000000000000000";

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


// Mine block
const { minedBlockHash, block } = mineBlock(transactionFiles, prevBlockHash, difficulty);

// Write to output.txt
writeToOutput(block.getBlockHeader(), serializedCoinbaseTransaction, validTransactions);
// console.log(`Mined block hash: ${minedBlockHash}`);
// console.log('Block and transactions written to output.txt');

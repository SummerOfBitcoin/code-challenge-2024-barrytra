const { readFileSync, writeFileSync, appendFileSync } = require('fs');
const crypto = require('crypto');

class Transaction {
    constructor(version, locktime, vin, vout) {
        this.version = version;
        this.locktime = locktime;
        this.vin = vin;
        this.vout = vout;
    }
}

class Block {
    constructor(transactions, prevBlockHash) {
        this.transactions = transactions;
        this.prevBlockHash = prevBlockHash;
        this.timestamp = Date.now();
        this.nonce = 0;
    }

    hashBlock() {
        const blockString = JSON.stringify(this);
        return crypto.createHash('sha256').update(blockString).digest('hex');
    }

    mineBlock(difficulty) {
        while (true) {
            this.nonce++;
            console.log(this.nonce)
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
        return {
            prevBlockHash: this.prevBlockHash,
            timestamp: this.timestamp,
            nonce: this.nonce
        };
    }
}

// OP_HASH function
function OP_HASH(s) {
    let hash = crypto.createHash('sha256').update(s, 'hex').digest();
    hash = crypto.createHash('ripemd160').update(hash).digest();
    // console.log(Buffer.from(hash).toString("hex"));
    return Buffer.from(hash).toString("hex")
}

// function to get script Pubkey
function getScriptpubkey_v0p2wpkh(str) {
    let scriptpubkey = [];

    for (let i = 21; i < str.length; i++) {
        scriptpubkey += str[i];
    }
    return scriptpubkey.toString();
}

function v0_p2wpkh(vin) {
    let hash = OP_HASH(vin.witness[1]);
    let scriptPubkey = getScriptpubkey_v0p2wpkh(vin.prevout.scriptpubkey_asm);
    if (hash === scriptPubkey) return true;
    return false;
}



// Parse transaction JSON files
function parseTransactionFile(filename) {
    const { version, locktime, vin, vout } = filename;
    return new Transaction(version, locktime, vin, vout);
}

function getTxid(transactionJson) {
    // Parse JSON transaction
    // const transaction = JSON.parse(transactionJson);

    // Serialize transaction
    const serializedTransaction = JSON.stringify(transactionJson, null, 0);

    // Double SHA256 hash
    const hash1 = crypto.createHash('sha256').update(serializedTransaction).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();

    // Reverse byte order
    const txid = Buffer.from(hash2).reverse().toString('hex');
    return txid;
    // console.log("Transaction ID (TxID):", txid);
}

// Validate transactions
let validTransactions = [];
function validateTransactions(transactions) {
    // Simulated validation, assuming all transactions are valid
    transactions.map((transaction) => {
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
            transaction.vin.map((vin) => {
                if (vin.prevout.scriptpubkey_type === "v0_p2wpkh") {
                    flg = true;
                    if (!v0_p2wpkh(vin)) {
                        flg = false;
                        console.log("hello");
                    }
                }
            }
            )
            if (flg) {
                // console.log(transaction);
                // getTxid(transaction);
                validTransactions.push(getTxid(transaction));
            }
        }
        // validate signatures. we need message for that

    })
}

// Create block
function createBlock(transactions, prevBlockHash) {
    return new Block(transactions, prevBlockHash);
}

// Mine block
function mineBlock(transactions, prevBlockHash, difficulty) {
    validateTransactions(transactions);
    // console.log(validTransactions);
    const block = createBlock(validTransactions, prevBlockHash);
    const minedBlockHash = block.mineBlock(difficulty);
    return { minedBlockHash, block };
}

// Write block and transactions to output.txt
function writeToOutput(blockHeader,serializedCoinbaseTransaction, transactions) {
    writeFileSync('output.txt', JSON.stringify(blockHeader) + '\n');
    appendFileSync('output.txt', serializedCoinbaseTransaction + '\n');
    transactions.forEach(tx => {
        appendFileSync('output.txt', tx + '\n');
    });
}

// Testing
const prevBlockHash = "0000000000000000000000000000000000000000000000000000000000000000";
const difficulty = "0000ffff00000000000000000000000000000000000000000000000000000000";

// importing transaction files and adding them into transactionFiles object;

var transactionFiles = [];
var normalizedPath = require("path").join(__dirname, "mempool");

const coinbaseTransaction = {
    "version": 1,
    "locktime": 0,
    "vin": [
        {
            "coinbase": "03f39a0704d8a85f00000000000000000000000000000000000000000000000000000000"
        }
    ],
    "vout": [
        {
            "value": 6250000000,
            "scriptpubkey": "76a9144d1015b504d0b8ce5007ea44c258ae3e02d333f188ac"
        }
    ]
}
const serializedCoinbaseTransaction = JSON.stringify(coinbaseTransaction, null, 0);





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
writeToOutput(block.getBlockHeader(),serializedCoinbaseTransaction, validTransactions);
// console.log(`Mined block hash: ${minedBlockHash}`);
// console.log('Block and transactions written to output.txt');

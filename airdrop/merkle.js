const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const csvParser = require('csv-parser');
const fs = require('fs');

const generateMerkleRoot = (csvFiles) => {
    const leaves = [];

    const processCsv = (file) => new Promise((resolve, reject) => {
        fs.createReadStream(file)
            .pipe(csvParser(['address', 'amount']))
            .on('data', (data) => {
                const leaf = keccak256(data.address + data.amount);
                leaves.push(leaf);
            })
            .on('end', () => {
                resolve();
            })
            .on('error', (error) => {
                reject(error);
            });
    });

    Promise.all(csvFiles.map(file => processCsv(file)))
        .then(() => {
            const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
            const root = tree.getRoot().toString('hex');
            console.log("Merkle Root:", root);
        })
        .catch((error) => {
            console.error("An error occurred:", error);
        });
};

const files = ['base_warpcast_followers.csv', 'mochi.csv', 'toshi.csv'];
generateMerkleRoot(files);



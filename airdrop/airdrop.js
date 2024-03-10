const { ethers } = require("ethers");
const fs = require("fs");
const { parse } = require("csv-parse/sync");

// Configurable parameters
const BATCH_SIZE = 900; // Change this as needed
const contractAddress = "0xf6c3555139aeA30f4a2be73EBC46ba64BAB8ac12";
const tokenAddress = "0xA3E94bc7bfE299Fbdc28Df022CfD01D4597a3f43";
const privateKey = process.env.PRIVATE_KEY; // Be careful with your private key
const providerURL = `https://base-sepolia.g.alchemy.com/v2/BhSwGHAbgcb2uN3HyD_lI233czDJrOwX`; // e.g., Infura or Alchemy URL
const provider = new ethers.providers.JsonRpcProvider(providerURL);
const wallet = new ethers.Wallet(privateKey, provider);
// load contract abi from /gasliteAbi.json
const contractABI = require("./gasliteAbi.json");

// Connect to the contract
const gasliteDropContract = new ethers.Contract(contractAddress, contractABI, wallet);

// File paths
const files = [
    "unique_pawth_holders.csv",
    // "base_warpcast_followers.csv",
    // "mochi.csv",
    // "toshi.csv"
];

const erc20ABI = [
  "function approve(address spender, uint256 amount) returns (bool)"
];

function readAndParseCSV(filePath) {
    const content = fs.readFileSync(filePath);
    return parse(content, {
        columns: false,
        skip_empty_lines: true
    });
}

async function readAddressesAndAmounts(files) {
    let addresses = [];
    let amounts = [];

    for (const file of files) {
        const data = readAndParseCSV(file);
        for (const row of data) {
            addresses.push(row[0]);
            amounts.push(row[1]);
        }
    }

    return { addresses, amounts };
}

async function airdropTokens(files) {
    const { addresses, amounts } = await readAddressesAndAmounts(files);
    const totalBatches = Math.ceil(addresses.length / BATCH_SIZE);
    await approveTokenTransfer(); // Make sure to call this before processing batches

    for (let i = 0; i < totalBatches; i++) {
        const batchAddresses = addresses.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        // Convert each amount from ether to wei
        const batchAmounts = amounts.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE).map(amount => ethers.utils.parseEther(amount));
    
        // Calculate the total amount for the batch, summing up all amounts in wei
        const totalAmountForBatch = batchAmounts.reduce((acc, amount) => acc.add(amount), ethers.BigNumber.from(0));
    
        console.log(`Executing batch ${i + 1}/${totalBatches}...`);
  
        try {
            const tx = await gasliteDropContract.airdropERC20(tokenAddress, batchAddresses, batchAmounts, totalAmountForBatch);
            await tx.wait();
            console.log(`Batch ${i + 1} done. Transaction Hash: ${tx.hash}`);
        } catch (error) {
            console.error(`Failed to execute batch ${i + 1}:`, error);
        }
    }
}

async function approveTokenTransfer() {
  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, wallet);
  const maxUint256 = ethers.constants.MaxUint256.toString();

  console.log(`Approving token transfer...`);
  try {
    const approvalTx = await tokenContract.approve(contractAddress, maxUint256);
    await approvalTx.wait();
    console.log(`Approval successful. Transaction Hash: ${approvalTx.hash}`);
  } catch (error) {
    console.error(`Failed to approve token transfer:`, error);
    process.exit(1); // Stop the script if the approval fails
  }
}

// Start the airdrop
airdropTokens(files).then(() => console.log('Airdrop completed.'));

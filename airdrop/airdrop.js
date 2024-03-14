const { ethers } = require("ethers");
const fs = require("fs");
const { parse } = require("csv-parse/sync");
require("dotenv").config();

// Configurable parameters
const BATCH_SIZE = 1000; // Change this as needed
//const contractAddress = "0xf6c3555139aeA30f4a2be73EBC46ba64BAB8ac12"; // sepolia
const contractAddress = "0x09350F89e2D7B6e96bA730783c2d76137B045FEF";
const tokenAddress = "0x6e259376Bac4aB281C9d1C89a6c0149D7E8a0d42"; // mainnet base token address
const privateKey = process.env.PRIVATE_KEY; // Be careful with your private key
// const providerURL = `https://base-sepolia.g.alchemy.com/v2/BhSwGHAbgcb2uN3HyD_lI233czDJrOwX`; // sepolia
// const providerURL = `https://base-mainnet.g.alchemy.com/v2/zGdgfIkgTx-69J8FQ6gCDa1jIjrzM-dx`;
// const providerURL = 'https://8453.rpc.thirdweb.com';
// const providerURL = 'https://base-rpc.publicnode.com';
const providerURL = 'https://chain-proxy.wallet.coinbase.com?targetName=base';
const provider = new ethers.providers.JsonRpcProvider(providerURL);
const wallet = new ethers.Wallet(privateKey, provider);
// load contract abi from /gasliteAbi.json
const contractABI = require("./gasliteAbi.json");

// Connect to the contract
const gasliteDropContract = new ethers.Contract(contractAddress, contractABI, wallet);

// File paths
const files = [
    // "unique_pawth_holders.csv", // PAWTH users were airdropped
    // "base_warpcast_testers.csv", // first 1800 removed from the main file. these were airdropped
    // "base_warpcast_testers2.csv", // second 1800 removed from the main file. these were airdropped
    // "base_warpcast_testers3.csv", // next 1000 removed from the main file. these were airdropped
    // "base_warpcast_testers4.csv", // next 1200 removed from the main file. these were airdropped
    // "base_warpcast_testers5.csv", // next 1200 removed from the main file. these were air dropped
    // "base_warpcast_testers6.csv", // next 3600 removed from the main file. these were air dropped
    // "base_warpcast_testers7.csv", // next 1300 removed from the main file. these were air dropped
    // "base_warpcast_testers8.csv", // next 10,000 removed from the main file. these were air dropped
    // "base_warpcast_testers9.csv", // next 7,000 removed from the main file. these were airdropped
    // "base_warpcast_testers10.csv", // next 1,000 removed from the main file. these were airdropped
    // "base_warpcast_testers11.csv", // next 1,000 removed from the main file. these were airdropped
    // "base_warpcast_testers12.csv", // next 1,000 removed from the main file. these were airdropped
    // "base_warpcast_testers13.csv", // next 4,000 removed from the main file. these were airdropped
    // "base_warpcast_testers14.csv", // next 17,000 removed from the main file. these were airdropped
    // "base_warpcast_testers15.csv", // next 2,000 removed from the main file. these were airdropped
    // "base_warpcast_testers16.csv", // next 17,000 removed from the main file. these were airdropped
    // "base_warpcast_testers17.csv", // next 20,000 removed from the main file. these were airdropped
    // "base_warpcast_followers.csv",
    // "mochi.csv", // already done
    "toshi.csv"
];

const erc20ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
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
    let totalGas = ethers.BigNumber.from(0);
    let gasPrice = await provider.getGasPrice();
    const successfulBatches = [];
    const failedBatches = [];

    for (let i = 0; i < totalBatches; i++) {
        const batchAddresses = addresses.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        // Convert each amount from ether to wei
        const batchAmounts = amounts.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE).map(amount => ethers.utils.parseEther(amount));
    
        // Calculate the total amount for the batch, summing up all amounts in wei
        const totalAmountForBatch = batchAmounts.reduce((acc, amount) => acc.add(amount), ethers.BigNumber.from(0));
    
        console.log(`Executing batch ${i + 1}/${totalBatches}...`);
  
        try {
            const oldGasPrice = gasPrice;
            const newGasPrice = await provider.getGasPrice();
            const percentDifference = (newGasPrice.sub(oldGasPrice).div(oldGasPrice)).mul(100);
            console.log(`
            ========================================
            NEW GAS PRICE
            ========================================
            `)
            console.log(`Old gas price: ${oldGasPrice.toString()}`);
            console.log(`New gas price: ${newGasPrice.toString()}`);
            console.log(`Percent difference: ${percentDifference.toString()}%`);
            // try again with new gas price
            gasPrice = newGasPrice;

            const gasEstimate = await gasliteDropContract.estimateGas.airdropERC20(tokenAddress, batchAddresses, batchAmounts, totalAmountForBatch);
            totalGas = totalGas.add(gasEstimate.mul(gasPrice));

            console.log(`gas for transaction ${i + 1}: ${gasEstimate.toString()}`);
            const tx = await gasliteDropContract.airdropERC20(tokenAddress, batchAddresses, batchAmounts, totalAmountForBatch, {
              gasLimit: gasEstimate,
              gasPrice: gasPrice,
            });
            await tx.wait();
            console.log(`\x1b[32mBatch ${i + 1} done. Transaction Hash: ${tx.hash}\x1b[0m`);
            successfulBatches.push(i + 1);
        } catch (error) {
            console.error(`\x1b[31mFailed to execute batch ${i + 1}\x1b[0m`);
            console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
            console.log("fetching new gas price!!!")
            const oldGasPrice = gasPrice;
            const newGasPrice = await provider.getGasPrice();
            const percentDifference = (newGasPrice.sub(oldGasPrice).div(oldGasPrice)).mul(100);
            console.log(`
            
            
            
            
            
            ========================================
            NEW GAS PRICE
            ========================================




            `)
            console.log(`Old gas price: ${oldGasPrice.toString()}`);
            console.log(`New gas price: ${newGasPrice.toString()}`);
            console.log(`Percent difference: ${percentDifference.toString()}%`);
            // try again with new gas price
            gasPrice = newGasPrice;
            try {
                const gasEstimate = await gasliteDropContract.estimateGas.airdropERC20(tokenAddress, batchAddresses, batchAmounts, totalAmountForBatch);
                totalGas = totalGas.add(gasEstimate.mul(gasPrice));
                console.log(`gas for transaction ${i + 1}: ${gasEstimate.toString()}`);
                const tx = await gasliteDropContract.airdropERC20(tokenAddress, batchAddresses, batchAmounts, totalAmountForBatch, {
                  gasLimit: gasEstimate,
                  gasPrice: gasPrice,
                });
                await tx.wait();
                console.log(`\x1b[32mBatch ${i + 1} done. Transaction Hash: ${tx.hash}\x1b[0m`);
                successfulBatches.push(i + 1);
            } catch (error) {
              // write the addresses and amounts of this failed batch to a file called "failed_batch_${i + 1}.csv"
              const failedBatch = batchAddresses.map((address, index) => [address, amounts[i * BATCH_SIZE + index]]);
              const failedBatchCSV = failedBatch.map(row => row.join(',')).join('\n');
              fs.writeFileSync(`failed_batch_again_${i + 1}.csv`, failedBatchCSV);
              console.error(`\x1b[31mFailed to execute batch ${i + 1} again\x1b[0m`);
              console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
              failedBatches.push(i + 1);
            }
        }
    }
    // fetch the price of ether in usd from coingecko
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    const etherPrice = data.ethereum.usd;
    console.log('successful batches:', successfulBatches);
    console.log('failed batches:', failedBatches);
    console.log({ etherPrice, numAddresses: addresses.length });
    // console.log a table of the total estimated gas in ether
    console.log(`Total estimated cost in Ether: ${ethers.utils.formatEther(totalGas).toString()}`);
    console.log(`Total estimated gas in USD: ${(Number(ethers.utils.formatEther(totalGas).toString()) * etherPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`);
}

async function approveTokenTransfer() {
  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, wallet);
  const maxUint256 = ethers.constants.MaxUint256.toString();

  // Check if approval is necessary
  const allowance = await tokenContract.allowance(wallet.address, contractAddress);
  if (ethers.BigNumber.from(allowance).lt(maxUint256)) {
    console.log(`Approving token transfer...`);
    try {
      const approvalTx = await tokenContract.approve(contractAddress, maxUint256);
      await approvalTx.wait();
      console.log(`Approval successful. Transaction Hash: ${approvalTx.hash}`);
    } catch (error) {
      console.error(`Failed to approve token transfer:`, error);
      process.exit(1); // Stop the script if the approval fails
    }
  } else {
    console.log(`Token transfer already approved.`);
  }
}

// Start the airdrop
airdropTokens(files).then(() => console.log('Airdrop completed.'));

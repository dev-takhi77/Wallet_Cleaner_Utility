import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createCloseAccountInstruction, createBurnInstruction, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';
import { PRIVATE_KEY, RPC } from './config';

// Create a connection to the Solana cluster (mainnet, testnet, or devnet)
const connection = new Connection(RPC, 'confirmed');

// Replace with your wallet's keypair
const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

// Function to burn all tokens and close all token accounts (including empty ones)
async function burnAndCloseAllTokenAccounts() {
  try {
    // Fetch all token accounts associated with the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    console.log(tokenAccounts);

    // Filter out accounts to be processed
    const accountsToProcess = tokenAccounts.value; // We include all accounts here

    if (accountsToProcess.length === 0) {
      console.log('No token accounts to process.');
      return;
    }

    // Split the accounts into batches of 10
    const batches = [];
    const batchSize = 10;
    for (let i = 0; i < accountsToProcess.length; i += batchSize) {
      batches.push(accountsToProcess.slice(i, i + batchSize));
    }

    // Process each batch
    for (const batch of batches) {
      const transaction = new Transaction();

      // Loop through each token account in the batch
      for (const tokenAccount of batch) {
        const tokenAccountPublicKey = tokenAccount.pubkey;
        const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount.amount;
        const mintAddress = new PublicKey(tokenAccount.account.data.parsed.info.mint);

        // If the token account has a balance greater than 0, burn the tokens
        if (tokenAmount !== '0') {
          const burnInstruction = createBurnInstruction(
            tokenAccountPublicKey,      // Associated token account
            mintAddress,            // Owner of the token account
            wallet.publicKey,            // Authority (wallet)
            tokenAmount,                 // Amount to burn
          );
          transaction.add(burnInstruction);
        }

        // Create close account instruction for the token account (whether it has a balance or not)
        const closeInstruction = createCloseAccountInstruction(
          tokenAccountPublicKey,      // Token account to be closed
          wallet.publicKey,           // Destination to send any remaining tokens (wallet itself)
          wallet.publicKey            // Owner of the account
        );
        transaction.add(closeInstruction);
      }

      // Send the transaction to burn tokens and close the token accounts in this batch
      const signature = await connection.sendTransaction(transaction, [wallet], { skipPreflight: false, preflightCommitment: 'confirmed' });

      // Confirm the transaction
      await connection.confirmTransaction(signature);

      console.log(`Successfully processed ${batch.length} token accounts in this batch.`);
    }

    console.log(`Successfully processed ${accountsToProcess.length} token accounts in total.`);
  } catch (error) {
    console.error('Error processing token accounts:', error);
  }
}

// Execute the function
burnAndCloseAllTokenAccounts();

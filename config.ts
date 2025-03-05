import { Keypair } from '@solana/web3.js';
import { config } from 'dotenv';
import bs58 from 'bs58';

config()

const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const RPC = process.env.RPC || ""

//  @ts-ignore
const payer = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY))

export {
  PRIVATE_KEY,
  payer,
  RPC
}
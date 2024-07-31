import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SimpleContract } from "../target/types/simple_contract";
import { assert } from 'chai';

describe("simple_contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SimpleContract as Program<SimpleContract>;
  const priceStatsAccount = anchor.web3.Keypair.generate();

  const asset = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    await program.methods
    .initialize(asset.publicKey)
    .accounts({
      priceStats: priceStatsAccount.publicKey,
    })
    .signers([priceStatsAccount])
    .rpc();

    
    const state = await program.account.priceStats.fetch(priceStatsAccount.publicKey);
    assert.equal(state.price, new anchor.BN(12345));
  })

  it('Updates the price', async () => {
    const callerInfoPda = await program.account.callerInfo.associatedAddress(priceStatsAccount.publicKey);
 
    await program.methods
      .updatePrice()
      .accounts({
        priceState: priceStatsAccount.publicKey,
        callerInfo: callerInfoPda,
      })
      .signers([priceStatsAccount])
      .rpc();

  });

});

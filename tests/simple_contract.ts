import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SimpleContract } from '../target/types/simple_contract';
import { assert } from 'chai';

describe('simple_contract', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SimpleContract as Program<SimpleContract>;

  const priceStats = anchor.web3.Keypair.generate();
  const asset = anchor.web3.Keypair.generate().publicKey;
  const caller1 = anchor.web3.Keypair.generate();

  async function airdropSol(keypair: anchor.web3.Keypair) {
    const signature = await provider.connection.requestAirdrop(keypair.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
  }

  it('Initializes the state', async () => {
    await program.methods
      .initialize(asset)
      .accounts({
        priceStats: priceStats.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([priceStats])
      .rpc();

    const state = await program.account.priceStats.fetch(priceStats.publicKey);
    assert.equal(state.price.toString(), '12345');
    assert.equal(state.asset.toBase58(), asset.toBase58());
  });

  it('Updates the price', async () => {
    // await airdropSol(caller1); //TODO:  need to export keys to json , fund keys with some sol  and rewrite tests accordingly

    const [callerInfoPda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('caller_info'), caller1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .updatePrice()
      .accounts({
        priceState: priceStats.publicKey,
        callerInfo: callerInfoPda,
        user: caller1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([caller1])
      .rpc();

    const state = await program.account.priceStats.fetch(priceStats.publicKey);
    assert.equal(state.price.toString(), '123456');

    const callerInfo = await program.account.callerInfo.fetch(callerInfoPda);
    assert.equal(callerInfo.callCount, 1);
  });

  it('Enforces call limit within time period', async () => {
    // await airdropSol(caller1); //TODO:  need to export keys to json , fund keys with some sol  and rewrite tests accordingly

    const [callerInfoPda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('caller_info'), caller1.publicKey.toBuffer()],
      program.programId
    );

    // Update the price two more times
    for (let i = 0; i < 2; i++) {
      await program.methods
        .updatePrice()
        .accounts({
          priceState: priceStats.publicKey,
          callerInfo: callerInfoPda,
          user: caller1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([caller1])
        .rpc();
    }

    const callerInfo = await program.account.callerInfo.fetch(callerInfoPda);
    assert.equal(callerInfo.callCount, 3);

    // Attempt to update a fourth time should fail
    try {
      await program.methods
        .updatePrice()
        .accounts({
          priceState: priceStats.publicKey,
          callerInfo: callerInfoPda,
          user: caller1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([caller1])
        .rpc();
      assert.fail('Expected error for exceeding call limit');
    } catch (err) {
      assert.equal(err.error.errorCode.code, 'TooManyCalls');
    }
  });

  it('Resets call count after time period', async () => {
    // await airdropSol(caller1); //TODO:  need to export keys to json , fund keys with some sol  and rewrite tests accordingly

    const [callerInfoPda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('caller_info'), caller1.publicKey.toBuffer()],
      program.programId
    );

    // Simulate time passage
    await new Promise((resolve) => setTimeout(resolve, 16000));

    await program.methods
      .updatePrice()
      .accounts({
        priceState: priceStats.publicKey,
        callerInfo: callerInfoPda,
        user: caller1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([caller1])
      .rpc();

    const callerInfo = await program.account.callerInfo.fetch(callerInfoPda);
    assert.equal(callerInfo.callCount, 1); // call count should reset to 1 after the time period
  });
});

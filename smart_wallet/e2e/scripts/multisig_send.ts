import { blockchainProvider, txBuilder, multiSigCbor, multiSigAddress, wallet1, wallet2 } from "../smart_wallet.js";

const utxosMulti = await blockchainProvider.fetchAddressUTxOs('addr_test1wqjg79rjzf493ds8536740y238l8n7meqn4d7geqr3ssk2chntddc');
const utxoMulti = utxosMulti[0];

// throw error for an invalid utxo
if (!utxoMulti) {
    throw new Error("No multisig utxos to send");
}

const txMulti = await txBuilder
    .txIn(
        utxoMulti.input.txHash,
        utxoMulti.input.outputIndex,
        utxoMulti.output.amount,
        utxoMulti.output.address,
    )
    .txInScript(multiSigCbor!)
    .txOut(
        "addr_test1qztvhvnujmd03j4cjr0x6lu87hlaqfdl3tyqw97tcnaw0kk5wsnj53x9v8dhupg6v8rzt48atr6zmrvlppkam7upd29sqeutm7",
        [{ unit: "lovelace", quantity: "2000000" }],
    )
    .changeAddress(multiSigAddress)
    .selectUtxosFrom(utxosMulti)
    .complete()

const unsignedTxMulti1 = await wallet1.signTx(txMulti, true);
const unsignedTxMulti2 = await wallet2.signTx(unsignedTxMulti1, true);
const txHash = await wallet2.submitTx(unsignedTxMulti2);

console.log('Multisig_send tx hash:', txHash);

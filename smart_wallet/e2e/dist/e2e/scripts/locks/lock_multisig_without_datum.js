import { blockchainProvider, multiSigAddress, multiSigCbor, multisigUtxos, scriptAddrMultisig, txBuilder, wallet1, wallet2, } from "../../smart_wallet.js";
if (!multiSigCbor) {
    throw new Error('Multisig script serialization failed!');
}
const utxosMulti = await blockchainProvider.fetchAddressUTxOs('addr_test1wqjg79rjzf493ds8536740y238l8n7meqn4d7geqr3ssk2chntddc');
const utxoMulti = utxosMulti[0];
// throw error for an invalid utxo
if (!utxoMulti) {
    throw new Error("No multisig utxos to send");
}
const unsignedTx = await txBuilder
    .txIn(utxoMulti.input.txHash, utxoMulti.input.outputIndex, utxoMulti.output.amount, utxoMulti.output.address)
    .txInScript(multiSigCbor)
    .txOut(scriptAddrMultisig, [{ unit: "lovelace", quantity: '10000000' }])
    .changeAddress(multiSigAddress)
    .selectUtxosFrom(multisigUtxos)
    .complete();
const unsignedTxMulti1 = await wallet1.signTx(unsignedTx, true);
const unsignedTxMulti2 = await wallet2.signTx(unsignedTxMulti1, true);
const txHash = await wallet2.submitTx(unsignedTxMulti2);
console.log('Multisig_lock without datum tx hash:', txHash);

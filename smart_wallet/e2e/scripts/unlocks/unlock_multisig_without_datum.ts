import { blockchainProvider, multiSigAddress, multisigUtxos, parameterizedScriptMultisig, scriptAddrMultisig, txBuilder, wallet1, wallet1Collateral, wallet2 } from "../../smart_wallet.js";

const lockedUTxos = await blockchainProvider.fetchAddressUTxOs(scriptAddrMultisig);
console.log(lockedUTxos);
const lockedUTxo = lockedUTxos[0];

// throw error for an invalid utxo
if (!lockedUTxos) {
    throw new Error("No utxos to unlock");
}
// todo -> instead, filter the list of utxos to find the ones without datum, if there are none, throw an error

const validationUtxo = multisigUtxos[0];

const unsignedTx = await txBuilder
    .spendingPlutusScript('V3')
    .txIn(
        validationUtxo.input.txHash,
        validationUtxo.input.outputIndex,
        validationUtxo.output.amount,
        validationUtxo.output.address,
    )
    .txIn(
        lockedUTxo.input.txHash,
        lockedUTxo.input.outputIndex,
        lockedUTxo.output.amount,
        scriptAddrMultisig
    )
    .spendingReferenceTxInInlineDatumPresent()
    .spendingReferenceTxInRedeemerValue("")
    .txInScript(parameterizedScriptMultisig)
    .txOut(multiSigAddress, [])
    // get multisig collateral; edit below!
    .txInCollateral(
        wallet1Collateral.input.txHash,
        wallet1Collateral.input.outputIndex,
        wallet1Collateral.output.amount,
        wallet1Collateral.output.address,
    )
    // get multisig collateral; edit above!... end
    .changeAddress(multiSigAddress)
    .selectUtxosFrom(multisigUtxos)
    .complete();

const unsignedTxMulti1 = await wallet1.signTx(unsignedTx, true);
const unsignedTxMulti2 = await wallet2.signTx(unsignedTxMulti1, true);
const txHash = await wallet2.submitTx(unsignedTxMulti2);

console.log('Multisig_lock without datum tx hash:', txHash);

import { blockchainProvider, parameterizedScriptSinglesig, scriptAddrSingleSig, txBuilder, wallet1, wallet1Address, wallet1Collateral, wallet1Utxos, wallet1VK } from "../../smart_wallet.js";
const lockedUTxos = await blockchainProvider.fetchAddressUTxOs(scriptAddrSingleSig);
console.log(lockedUTxos);
const lockedUTxo = lockedUTxos[0];
// throw error for an invalid utxo
if (!lockedUTxos) {
    throw new Error("No utxos to unlock");
}
// todo -> instead, filter the list of utxos to find the ones without datum, if there are none, throw an error
const unlockWithoutDatumTx = await txBuilder
    .spendingPlutusScript('V3')
    .txIn(lockedUTxo.input.txHash, lockedUTxo.input.outputIndex, lockedUTxo.output.amount, scriptAddrSingleSig)
    .spendingReferenceTxInInlineDatumPresent()
    .spendingReferenceTxInRedeemerValue("")
    .txInScript(parameterizedScriptSinglesig)
    .txOut(wallet1Address, [])
    .txInCollateral(wallet1Collateral.input.txHash, wallet1Collateral.input.outputIndex, wallet1Collateral.output.amount, wallet1Collateral.output.address)
    .requiredSignerHash(wallet1VK)
    .changeAddress(wallet1Address)
    .selectUtxosFrom(wallet1Utxos)
    .complete();
const signedTx = await wallet1.signTx(unlockWithoutDatumTx);
const txHash = await wallet1.submitTx(signedTx);
console.log('Unlock_without_datum tx hash:', txHash);

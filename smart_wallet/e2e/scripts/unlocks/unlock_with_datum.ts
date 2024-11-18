import { SLOT_CONFIG_NETWORK, unixTimeToEnclosingSlot } from "@meshsdk/common";
import { blockchainProvider, txBuilder, scriptAddrSingleSig, parameterizedScriptSinglesig, wallet1Address, wallet1Collateral, wallet1VK, wallet1Utxos, wallet1 } from "../../smart_wallet.js";

const lockedUTxosWithDatum = await blockchainProvider.fetchAddressUTxOs(scriptAddrSingleSig);
console.log(lockedUTxosWithDatum);
const lockedUTxoWithDatum = lockedUTxosWithDatum[0];

// throw error for an invalid utxo
if (!lockedUTxoWithDatum) {
    throw new Error("No utxos to unlock");
}
// todo -> instead, filter the list of utxos to find the ones with datum with single sig, if there are none, throw an error

const invalidBefore = unixTimeToEnclosingSlot(
    (Date.now() - 15000),
    SLOT_CONFIG_NETWORK.preprod
)

const unlockWithDatumTx = await txBuilder
    .spendingPlutusScript('V3')
    .txIn(
        lockedUTxoWithDatum.input.txHash,
        lockedUTxoWithDatum.input.outputIndex,
        lockedUTxoWithDatum.output.amount,
        scriptAddrSingleSig
    )
    .spendingReferenceTxInInlineDatumPresent()
    .spendingReferenceTxInRedeemerValue("")
    .txInScript(parameterizedScriptSinglesig)
    .txOut(wallet1Address, [])
    .txInCollateral(
        wallet1Collateral.input.txHash,
        wallet1Collateral.input.outputIndex,
        wallet1Collateral.output.amount,
        wallet1Collateral.output.address,
    )
    .invalidBefore(invalidBefore)
    .requiredSignerHash(wallet1VK)
    .changeAddress(wallet1Address)
    .selectUtxosFrom(wallet1Utxos)
    .complete();

const signedTx = await wallet1.signTx(unlockWithDatumTx);
const txHash = await wallet1.submitTx(signedTx);

console.log('Unlock_with_datum tx hash:', txHash);

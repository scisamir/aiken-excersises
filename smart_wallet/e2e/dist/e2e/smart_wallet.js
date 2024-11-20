import { BlockfrostProvider, MeshTxBuilder, MeshWallet, applyParamsToScript, deserializeAddress, resolveNativeScriptHash, serializeNativeScript, serializePlutusScript, } from "@meshsdk/core";
import { builtinByteString, conStr } from "@meshsdk/common";
import dotenv from "dotenv";
dotenv.config();
import blueprint from "../plutus.json" with { type: "json" };
const blockfrostId = process.env.BLOCKFROST_ID;
if (!blockfrostId) {
    throw new Error("BLOCKFROST_ID does not exist");
}
const blockchainProvider = new BlockfrostProvider(blockfrostId);
// const maestroKey = process.env.MAESTRO_KEY;
// if (!maestroKey) {
//     throw new Error("MAESTRO_KEY does not exist");
// }
// const blockchainProvider = new MaestroProvider({
//     network: 'Preprod',
//     apiKey: maestroKey,
// });
const wallet1Passphrase = process.env.WALLET_PASSPHRASE_ONE;
if (!wallet1Passphrase) {
    throw new Error("WALLET_PASSPHRASE_ONE does not exist");
}
const wallet1 = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: wallet1Passphrase.split(' ')
    },
});
const wallet2Passphrase = process.env.WALLET_PASSPHRASE_TWO;
if (!wallet2Passphrase) {
    throw new Error("WALLET_PASSPHRASE_TWO does not exist");
}
const wallet2 = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: wallet2Passphrase.split(' ')
    },
});
const wallet1Address = await wallet1.getChangeAddress();
const wallet2Address = await wallet2.getChangeAddress();
const wallet1Utxos = await wallet1.getUtxos();
const wallet1Collateral = (await wallet1.getCollateral())[0];
if (!wallet1Collateral) {
    throw new Error('No collateral utxo found');
}
const { pubKeyHash: wallet1VK } = deserializeAddress(wallet1Address);
const { pubKeyHash: wallet2VK } = deserializeAddress(wallet2Address);
// Construct Multisig address
const nativeScript = {
    type: "all",
    scripts: [
        {
            type: "sig",
            keyHash: wallet1VK,
        },
        {
            type: "sig",
            keyHash: wallet2VK,
        },
    ],
};
const { address: multiSigAddress, scriptCbor: multiSigCbor } = serializeNativeScript(nativeScript);
const multisigHash = resolveNativeScriptHash(nativeScript);
const multisigUtxos = await blockchainProvider.fetchAddressUTxOs(multiSigAddress);
if (!multisigUtxos[0]) {
    throw new Error('No multisig utxo found');
}
// Smart wallet contract code
const smartWalletCode = blueprint.validators[0].compiledCode;
// Note: The singlesig script and address are created with wallet 1
//   You can create similar script and address to use with wallet 2 by just changing the wallet1VK parameter
const parameterizedScriptSinglesig = applyParamsToScript(smartWalletCode, [conStr(0, [builtinByteString(wallet1VK)])], "JSON");
const scriptAddrSingleSig = serializePlutusScript({ code: parameterizedScriptSinglesig, version: 'V3' }, undefined, 0).address;
const parameterizedScriptMultisig = applyParamsToScript(smartWalletCode, [conStr(1, [builtinByteString(multisigHash)])], "JSON");
const scriptAddrMultisig = serializePlutusScript({ code: parameterizedScriptMultisig, version: 'V3' }, undefined, 0).address;
// Create transaction builder
const txBuilder = new MeshTxBuilder({
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    verbose: false,
});
// txBuilder.setNetwork('preview');
txBuilder.setNetwork('preprod');
// old script
// const parameterizedScriptOld = applyParamsToScript(
//     "590160010100323232323232225333003323232323253330083370e900118049baa0011323232533300b3232533300d3370e900018071baa00c13300237586002601e6ea8024dd7180898079baa00c132330010013758602460206ea8034894ccc0480045288992999808198029bac3004301237540186eb8c0500084cc00c00c004528180a00091808980918091809180918091809180918090009119198008008019129998090008a5013253330103371e6eb8c050008010528899801801800980a0008a99980599b8748000c030dd5000899991119299980799b8748008c040dd5000899b89002375a602660226ea8004528180198081baa30033010375400446020002601e6020602060206020602060206020601a6ea801cdd6980798069baa300f300d3754002294452818071807801180680098051baa00116300b300c002300a001300a00230080013005375400229309b2b2b9a5573aaae7955cfaba15745",
//     [conStr(0, [builtinByteString(wallet1VK)])],
//     "JSON"
// );
// const scriptAddrOld = serializePlutusScript(
//     { code: parameterizedScriptOld, version: 'V3' },
//     undefined,
//     0
// ).address;
// lock
// const lock_time = new Date();
// lock_time.setMinutes(3 + lock_time.getMinutes());
// const lockWithDatumTx = await txBuilder
//     .txOut(scriptAddrOld, [{ unit: "lovelace", quantity: '20000000' }])
//     .txOutInlineDatumValue(mConStr0([lock_time.getTime()]))
//     .changeAddress(wallet1Address)
//     .selectUtxosFrom(wallet1Utxos)
//     .complete();
// const signedTx = await wallet1.signTx(lockWithDatumTx);
// const txHash = await wallet1.submitTx(signedTx);
// console.log('Lock_with_datum tx hash:', txHash);
// unlock
// const lockedUTxosWithDatum = await blockchainProvider.fetchAddressUTxOs(scriptAddrOld);
// console.log('lockedUTxosWithDatum:', lockedUTxosWithDatum);
// const lockedUTxoWithDatum = lockedUTxosWithDatum[0];
// if (!lockedUTxoWithDatum) {
//     throw new Error("No utxos to unlock");
// }
// const invalidBefore = unixTimeToEnclosingSlot(
//     (Date.now() - 15000),
//     SLOT_CONFIG_NETWORK.preprod
// );
// const unlockWithDatumTx = await txBuilder
//     .spendingPlutusScript('V3')
//     .txIn(
//         lockedUTxoWithDatum.input.txHash,
//         lockedUTxoWithDatum.input.outputIndex,
//         lockedUTxoWithDatum.output.amount,
//         scriptAddrOld
//     )
//     .spendingReferenceTxInInlineDatumPresent()
//     .spendingReferenceTxInRedeemerValue("")
//     .txInScript(parameterizedScriptOld)
//     .txOut(wallet1Address, [])
//     .txInCollateral(
//         wallet1Collateral.input.txHash,
//         wallet1Collateral.input.outputIndex,
//         wallet1Collateral.output.amount,
//         wallet1Collateral.output.address,
//     )
//     .invalidBefore(invalidBefore)
//     .requiredSignerHash(wallet1VK)
//     .changeAddress(wallet1Address)
//     .selectUtxosFrom(wallet1Utxos)
//     .complete();
// const signedTx = await wallet1.signTx(unlockWithDatumTx);
// const txHash = await wallet1.submitTx(signedTx);
// console.log('Unlock_with_datum tx hash:', txHash);
export { blockchainProvider, txBuilder, parameterizedScriptSinglesig, parameterizedScriptMultisig, scriptAddrSingleSig, scriptAddrMultisig, wallet1, wallet2, wallet1Address, wallet2Address, wallet1VK, wallet2VK, wallet1Utxos, wallet1Collateral, multiSigAddress, multiSigCbor, multisigUtxos };

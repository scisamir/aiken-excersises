import {
    BlockfrostProvider,
    MeshTxBuilder,
    MeshWallet,
    Mint,
    Transaction,
    applyParamsToScript,
    deserializeAddress,
    resolveScriptHash,
    serializePlutusScript,
} from "@meshsdk/core";
import { builtinByteString, conStr, list, mConStr0, mConStr1, outputReference, PlutusScript, scriptHash, SLOT_CONFIG_NETWORK, stringToHex, unixTimeToEnclosingSlot, UTxO } from "@meshsdk/common";
import dotenv from "dotenv";
dotenv.config();

const blockfrostId = process.env.BLOCKFROST_ID!;
const blockchainProvider = new BlockfrostProvider(blockfrostId);

const wallet1Passphrase = process.env.WALLET_PASSPHRASE_ONE!;
const wallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: wallet1Passphrase.split(' ')
    },
});

const wallet2Passphrase = process.env.WALLET_PASSPHRASE_TWO!;
const wallet2 = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: wallet2Passphrase.split(' ')
    },
});

const address = await wallet.getChangeAddress();
const addressMulti = await wallet2.getChangeAddress();

const utxos = await wallet.getUtxos();
const collateral: UTxO = (await wallet.getCollateral())[0]
if (!collateral) {
    throw new Error('No collateral utxo found');
}

const { pubKeyHash: vk } = deserializeAddress(address);
const { pubKeyHash: vkMulti } = deserializeAddress(addressMulti);

const parameterizedScript = applyParamsToScript(
    '590160010100323232323232225333003323232323253330083370e900118049baa0011323232533300b3232533300d3370e900018071baa00c13300237586002601e6ea8024dd7180898079baa00c132330010013758602460206ea8034894ccc0480045288992999808198029bac3004301237540186eb8c0500084cc00c00c004528180a00091808980918091809180918091809180918090009119198008008019129998090008a5013253330103371e6eb8c050008010528899801801800980a0008a99980599b8748000c030dd5000899991119299980799b8748008c040dd5000899b89002375a602660226ea8004528180198081baa30033010375400446020002601e6020602060206020602060206020601a6ea801cdd6980798069baa300f300d3754002294452818071807801180680098051baa00116300b300c002300a001300a00230080013005375400229309b2b2b9a5573aaae7955cfaba15745',
    [conStr(0, [builtinByteString(vk)])],
    "JSON"
);

const scriptAddr = serializePlutusScript(
    { code: parameterizedScript, version: 'V3' },
    undefined,
    0
).address;

const parameterizedScriptMulti = applyParamsToScript(
    '590160010100323232323232225333003323232323253330083370e900118049baa0011323232533300b3232533300d3370e900018071baa00c13300237586002601e6ea8024dd7180898079baa00c132330010013758602460206ea8034894ccc0480045288992999808198029bac3004301237540186eb8c0500084cc00c00c004528180a00091808980918091809180918091809180918090009119198008008019129998090008a5013253330103371e6eb8c050008010528899801801800980a0008a99980599b8748000c030dd5000899991119299980799b8748008c040dd5000899b89002375a602660226ea8004528180198081baa30033010375400446020002601e6020602060206020602060206020601a6ea801cdd6980798069baa300f300d3754002294452818071807801180680098051baa00116300b300c002300a001300a00230080013005375400229309b2b2b9a5573aaae7955cfaba15745',
    [conStr(1, [list([builtinByteString(vk), builtinByteString(vkMulti)])])],
    "JSON"
);

const scriptAddrMulti = serializePlutusScript(
    { code: parameterizedScriptMulti, version: 'V3' },
    undefined,
    0
).address;

const txBuilder = new MeshTxBuilder({
    fetcher: blockchainProvider,
    submitter: blockchainProvider
});


// Lock without Datum
// const lockWithoutDatumTx = await txBuilder
//     .txOut(scriptAddr, [{ unit: "lovelace", quantity: '50000000' }])
//     .changeAddress(address)
//     .selectUtxosFrom(utxos)
//     .complete();


// Unlock without Datum
// const lockedUTxos = await blockchainProvider.fetchAddressUTxOs(scriptAddr);
// console.log(lockedUTxos);
// const lockedUTxo = lockedUTxos[0];

// const unlockWithoutDatumTx = await txBuilder
//     .spendingPlutusScript('V3')
//     .txIn(
//         lockedUTxo.input.txHash,
//         lockedUTxo.input.outputIndex,
//         lockedUTxo.output.amount,
//         scriptAddr
//     )
//     .txInScript(parameterizedScript)
//     .txOut(address, [])
//     .txInCollateral(
//         collateral.input.txHash,
//         collateral.input.outputIndex,
//         collateral.output.amount,
//         collateral.output.address,
//     )
//     .requiredSignerHash(vk)
//     .changeAddress(address)
//     .selectUtxosFrom(utxos)
//     .complete();


// // Lock with Datum
// const lock_time = new Date();
// lock_time.setMinutes(15 + lock_time.getMinutes());

// const lockWithDatumTx = await txBuilder
//     .txOut(scriptAddr, [{ unit: "lovelace", quantity: '50000000' }])
//     .txOutInlineDatumValue(mConStr0([lock_time.getTime()]))
//     .changeAddress(address)
//     .selectUtxosFrom(utxos)
//     .complete();



// Unlock with Datum
// const lockedUTxosWithDatum = await blockchainProvider.fetchAddressUTxOs(scriptAddr);
// console.log(lockedUTxosWithDatum);
// const lockedUTxoWithDatum = lockedUTxosWithDatum[1];

// const invalidBefore = unixTimeToEnclosingSlot(
//     (Date.now() - 15000),
//     SLOT_CONFIG_NETWORK.preprod
// )

// const unlockWithDatumTx = await txBuilder
//     .spendingPlutusScript('V3')
//     .txIn(
//         lockedUTxoWithDatum.input.txHash,
//         lockedUTxoWithDatum.input.outputIndex,
//         lockedUTxoWithDatum.output.amount,
//         scriptAddr
//     )
//     .spendingReferenceTxInInlineDatumPresent()
//     .spendingReferenceTxInRedeemerValue("")
//     .txInScript(parameterizedScript)
//     .txOut(address, [])
//     .txInCollateral(
//         collateral.input.txHash,
//         collateral.input.outputIndex,
//         collateral.output.amount,
//         collateral.output.address,
//     )
//     .invalidBefore(invalidBefore)
//     .requiredSignerHash(vk)
//     .changeAddress(address)
//     .selectUtxosFrom(utxos)
//     .complete();


// Lock with Datum MultiSig
// const lock_time = new Date();
// lock_time.setMinutes(15 + lock_time.getMinutes());

// const lockWithDatumMultiSigTx = await txBuilder
//     .txOut(scriptAddrMulti, [{ unit: "lovelace", quantity: '20000000' }])
//     .txOutInlineDatumValue(mConStr0([lock_time.getTime()]))
//     .changeAddress(address)
//     .selectUtxosFrom(utxos)
//     .complete();


// Unlock with Datum MultiSig
// const lockedUTxosWithDatumMultiSig = await blockchainProvider.fetchAddressUTxOs(scriptAddrMulti);
// console.log(lockedUTxosWithDatumMultiSig);
// const lockedUTxoWithDatumMultiSig = lockedUTxosWithDatumMultiSig[0];

// const invalidBeforeMultiSig = unixTimeToEnclosingSlot(
//     (Date.now() - 15000),
//     SLOT_CONFIG_NETWORK.preprod
// )

// const unlockWithDatumMultiSigTx = await txBuilder
//     .spendingPlutusScript('V3')
//     .txIn(
//         lockedUTxoWithDatumMultiSig.input.txHash,
//         lockedUTxoWithDatumMultiSig.input.outputIndex,
//         lockedUTxoWithDatumMultiSig.output.amount,
//         scriptAddrMulti
//     )
//     .spendingReferenceTxInInlineDatumPresent()
//     .spendingReferenceTxInRedeemerValue("")
//     .txInScript(parameterizedScriptMulti)
//     .txOut(address, [])
//     .txInCollateral(
//         collateral.input.txHash,
//         collateral.input.outputIndex,
//         collateral.output.amount,
//         collateral.output.address,
//     )
//     .invalidBefore(invalidBeforeMultiSig)
//     .requiredSignerHash(vk)
//     .requiredSignerHash(vkMulti)
//     .changeAddress(address)
//     .selectUtxosFrom(utxos)
//     .complete();


// const initialSignedTx = await wallet.signTx(unlockWithDatumMultiSigTx, true);
// const signedTx = await wallet2.signTx(initialSignedTx, true);
// const txHash = await wallet.submitTx(signedTx);

// console.log(`\ntx hash: ${txHash}\n`);

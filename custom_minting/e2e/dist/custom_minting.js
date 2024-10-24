import { BlockfrostProvider, MeshTxBuilder, MeshWallet, applyParamsToScript, deserializeAddress, resolveScriptHash, } from "@meshsdk/core";
import { builtinByteString, conStr, mConStr0, outputReference, stringToHex } from "@meshsdk/common";
const blockchainProvider = new BlockfrostProvider("preprod4XNNKV7AtEG8EjLc0kDwdIVoIVLx1x3F");
const wallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: [
            "seven", "copy", "kitchen", "asthma", "harbor", "blind", "old",
            "junk", "journey", "will", "minute", "inhale", "illegal", "usage",
            "reform", "alien", "define", "food", "unfair", "toy", "empty", "finger",
            "void", "bread",
        ],
    },
});
const address = await wallet.getChangeAddress();
const utxos = await wallet.getUtxos();
const collateral = (await wallet.getCollateral())[0];
if (!collateral) {
    throw new Error('No collateral utxo found');
}
const theUtxo = utxos.find(utxo => utxo.input.txHash === 'c766fe5dc4ff21bba0e36ba8a628304db2d8e8c907d8f0ce5455786a95e012e9');
const remainingUtxos = utxos.filter(utxo => utxo.input.txHash !== 'c766fe5dc4ff21bba0e36ba8a628304db2d8e8c907d8f0ce5455786a95e012e9');
const theOutputReference = outputReference('c766fe5dc4ff21bba0e36ba8a628304db2d8e8c907d8f0ce5455786a95e012e9', 0);
const { pubKeyHash: vk } = deserializeAddress(address);
const parameterizedScript = applyParamsToScript('5903a2010100323232323232322225333004323232323253323300a3001300b3754004264646464a66601c600a0022a66602260206ea801c540085854ccc038c00c00454ccc044c040dd50038a8010b0b18071baa0061323232325333010300730113754012264a666022a66602266004006464646600200297ae1010746616c77617973008108476f6e6574696d650081064566656e69780011299980c0008a5013253330163372e6e64dd7180d8011b9900414a226600600600260360026eb8c04c0045288a50100114a06464a666024660060084646464a66602c66e3d22106616c7761797300001153330160051337100049000099b894800800854ccc058cdc7a45076f6e6574696d65000011533301600513371000490000a99980b1806980b9baa323300100100a22533301b00114c103d87a800013232533301a3375e603e60386ea80080644cdd2a40006603c00497ae0133004004001301f002301d00115333016300d301737540282a66602c6644646600200200644a66603a00229404c94ccc06ccdc79bae302000200414a226600600600260400026eb0c06cc070c070c070c070c070c070c070c070c060dd50089bae301b30183754028260160042940585854ccc058cdc7a4410566656e697800001153330163371290010010a99980b1980300411919299980c99b8f37306e6400922106616c776179730013371000290000a50375a60340046eb8c0600044cc0180208c8c94ccc064cdc79b983732004911076f6e6574696d650013371000290000a50375a60340046eb8c0600045280a5014a06e60dcc8011bad3016002375c6028002294452829998089980080191919b8f37306e640052210566656e697800375c6026002294452811191980080080191299980b8008a5013253330153004301a00214a226600600600260340022a66602066002004466e20dd69809800a4000294452811191980080080191299980b0008a5113253330143004301900213300300300114a0603200264a66601e600860206ea800452f5bded8c026eacc050c044dd500099198008009bab3014301530153015301500322533301300114c0103d87a80001323232325333014337220140042a66602866e3c0280084cdd2a4000660306e980052f5c02980103d87a80001330060060033756602a0066eb8c04c008c05c008c054004dd6180900098071baa007370e90011bae300f300c37540046e1d200016300d300e002300c001300c002300a0013006375400229309b2b2b9a5573aaae7955cfaba05742ae881', [theOutputReference, conStr(0, [builtinByteString(vk)])], "JSON");
const scriptPolicy = resolveScriptHash(parameterizedScript, "V3");
console.log('scriptPolicy', scriptPolicy);
const tokenName = "onetime";
const tokenNameHex = stringToHex(tokenName);
const tokenName1 = "always";
const tokenNameHex1 = stringToHex(tokenName1);
const tokenName2 = "fenix";
const tokenNameHex2 = stringToHex(tokenName2);
const txBuilder = new MeshTxBuilder({
    fetcher: blockchainProvider,
    submitter: blockchainProvider
});
const alwaysUtxos = await blockchainProvider.fetchUTxOs('5fffd05e3b4d2c25a68e3d9a6a0e3bf47b13e0f94e6961bda8a2d4741401c42a');
const alwaysUtxo = alwaysUtxos[0];
const onetimeUtxos = await blockchainProvider.fetchUTxOs('f83c70521872a57e5a7942b679442ab79c739ae44b7440174b7702afa4ad42fe');
const onetimeUtxo = onetimeUtxos[0];
const unsignedTx = await txBuilder
    .txIn(alwaysUtxo.input.txHash, alwaysUtxo.input.outputIndex, alwaysUtxo.output.amount, alwaysUtxo.output.address)
    .txIn(onetimeUtxo.input.txHash, onetimeUtxo.input.outputIndex, onetimeUtxo.output.amount, onetimeUtxo.output.address)
    .mintPlutusScriptV3()
    .mint("-1", scriptPolicy, tokenNameHex)
    .mintingScript(parameterizedScript)
    .mintRedeemerValue(mConStr0([]))
    .mintPlutusScriptV3()
    .mint("-1", scriptPolicy, tokenNameHex1)
    .mintingScript(parameterizedScript)
    .mintRedeemerValue(mConStr0([]))
    .mintPlutusScriptV3()
    .mint("1", scriptPolicy, tokenNameHex2)
    .mintingScript(parameterizedScript)
    .mintRedeemerValue(mConStr0([]))
    .changeAddress(address)
    .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
    .selectUtxosFrom(utxos)
    // .requiredSignerHash(vk)
    .complete();
// const unsignedTx = await txBuilder
// // .txIn(
// //     theUtxo.input.txHash,
// //     theUtxo.input.outputIndex,
// //     theUtxo.output.amount,
// //     theUtxo.output.address,
// // )
// .mintPlutusScriptV3()
// .mint("1", scriptPolicy, tokenNameHex2)
// .mintingScript(parameterizedScript)
// .mintRedeemerValue(mConStr0([]))
// .changeAddress(address)
// .txInCollateral(
//     collateral.input.txHash,
//     collateral.input.outputIndex,
//     collateral.output.amount,
//     collateral.output.address,
// )
// .selectUtxosFrom(remainingUtxos)
// .requiredSignerHash(vk)
// .complete();
const signedTx = await wallet.signTx(unsignedTx);
const txHash = await wallet.submitTx(signedTx);
console.log(`\ntx hash: ${txHash}\n`);

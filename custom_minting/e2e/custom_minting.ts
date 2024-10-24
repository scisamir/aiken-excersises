import {
    BlockfrostProvider,
    MeshTxBuilder,
    MeshWallet,
    Mint,
    Transaction,
    applyParamsToScript,
    deserializeAddress,
    resolveScriptHash,
} from "@meshsdk/core";
import { builtinByteString, conStr, mConStr0, mConStr1, outputReference, PlutusScript, scriptHash, stringToHex, UTxO } from "@meshsdk/common";

const blockchainProvider = new BlockfrostProvider("preprod4XNNKV7AtEG8EjLc0kDwdIVoIVLx1x3F");

const wallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: [
            "wallets_mnemonic",
        ],
    },
});

const address = await wallet.getChangeAddress();

const utxos = await wallet.getUtxos();
const collateral: UTxO = (await wallet.getCollateral())[0]
if (!collateral) {
    throw new Error('No collateral utxo found');
}

const theUtxo = utxos.find(utxo => utxo.input.txHash === 'c766fe5dc4ff21bba0e36ba8a628304db2d8e8c907d8f0ce5455786a95e012e9')!;

const remainingUtxos = utxos.filter(utxo => utxo.input.txHash !== 'c766fe5dc4ff21bba0e36ba8a628304db2d8e8c907d8f0ce5455786a95e012e9');

const theOutputReference = outputReference('c766fe5dc4ff21bba0e36ba8a628304db2d8e8c907d8f0ce5455786a95e012e9', 0);

const { pubKeyHash: vk } = deserializeAddress(address);

const parameterizedScript = applyParamsToScript(
    'contract_compiled_code',
    [theOutputReference, conStr(0, [builtinByteString(vk)])],
    "JSON"
);

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
    .txIn(
        alwaysUtxo.input.txHash,
        alwaysUtxo.input.outputIndex,
        alwaysUtxo.output.amount,
        alwaysUtxo.output.address,
    )
    .txIn(
        onetimeUtxo.input.txHash,
        onetimeUtxo.input.outputIndex,
        onetimeUtxo.output.amount,
        onetimeUtxo.output.address,
    )
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
    .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address,
    )
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

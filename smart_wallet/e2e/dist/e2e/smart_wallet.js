import { BlockfrostProvider, MeshTxBuilder, MeshWallet, applyParamsToScript, deserializeAddress, resolveNativeScriptHash, serializeNativeScript, serializePlutusScript, } from "@meshsdk/core";
import { builtinByteString, conStr } from "@meshsdk/common";
import dotenv from "dotenv";
dotenv.config();
import blueprint from "../plutus.json" with { type: "json" };
const blockfrostId = process.env.BLOCKFROST_ID;
const blockchainProvider = new BlockfrostProvider(blockfrostId);
const wallet1Passphrase = process.env.WALLET_PASSPHRASE_ONE;
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
    submitter: blockchainProvider
});
export { blockchainProvider, txBuilder, parameterizedScriptSinglesig, parameterizedScriptMultisig, scriptAddrSingleSig, scriptAddrMultisig, wallet1, wallet2, wallet1Address, wallet2Address, wallet1VK, wallet2VK, wallet1Utxos, wallet1Collateral, multiSigAddress, multiSigCbor, multisigUtxos };

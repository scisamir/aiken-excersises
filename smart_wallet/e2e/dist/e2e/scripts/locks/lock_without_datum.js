import { scriptAddrSingleSig, txBuilder, wallet1, wallet1Address, wallet1Utxos, } from "../../smart_wallet.js";
const lockWithoutDatumTx = await txBuilder
    .txOut(scriptAddrSingleSig, [{ unit: "lovelace", quantity: '50000000' }])
    .changeAddress(wallet1Address)
    .selectUtxosFrom(wallet1Utxos)
    .complete();
const signedTx = await wallet1.signTx(lockWithoutDatumTx);
const txHash = await wallet1.submitTx(signedTx);
console.log('Lock_without_datum tx hash:', txHash);

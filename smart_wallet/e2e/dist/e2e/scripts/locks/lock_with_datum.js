import { mConStr0 } from "@meshsdk/common";
import { txBuilder, scriptAddrSingleSig, wallet1Address, wallet1Utxos, wallet1 } from "../../smart_wallet.js";
const lock_time = new Date();
lock_time.setMinutes(15 + lock_time.getMinutes());
const lockWithDatumTx = await txBuilder
    .txOut(scriptAddrSingleSig, [{ unit: "lovelace", quantity: '50000000' }])
    .txOutInlineDatumValue(mConStr0([lock_time.getTime()]))
    .changeAddress(wallet1Address)
    .selectUtxosFrom(wallet1Utxos)
    .complete();
const signedTx = await wallet1.signTx(lockWithDatumTx);
const txHash = await wallet1.submitTx(signedTx);
console.log('Lock_with_datum tx hash:', txHash);

import { multiSigAddress, multisigUtxos, scriptAddrMultisig, txBuilder, wallet1, wallet2,  } from "../../smart_wallet.js";

const unsignedTx = await txBuilder
    .txOut(scriptAddrMultisig, [{ unit: "lovelace", quantity: '10000000' }])
    .changeAddress(multiSigAddress)
    .selectUtxosFrom(multisigUtxos)
    .complete();

const unsignedTxMulti1 = await wallet1.signTx(unsignedTx, true);
const unsignedTxMulti2 = await wallet2.signTx(unsignedTxMulti1, true);
const txHash = await wallet2.submitTx(unsignedTxMulti2);

console.log('Multisig_lock without datum tx hash:', txHash);

# aiken-excersises

## Custom Minting
A minting policy that allows to mint

the token "always" to everyone anytime
the token "onetime" just to the project owner and only once forever
the token "fenix" only if we burn both always and onetime
any other tokenName is forbidden


## Smart Wallet
A smart wallet account where users can receive payments, datum is optional because I can use it as a regular wallet

if datum is empty the owner can spend the tokens

if datums is not empty it indicates when the user will be able to withdraw it as posix time

owner can be a user BUT also a smart contract or multisig, this way also multisignatures and smart contract can use it.
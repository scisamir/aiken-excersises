use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/primitive/bytearray.{to_string}
use aiken/primitive/string.{to_bytearray}
use cardano/address.{Address, Script}
use cardano/assets.{PolicyId, from_asset_list, zero}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction, placeholder,
}
use mocktail/virgin_key_hash.{mock_policy_id, mock_pub_key_hash}
use mocktail/virgin_output_reference.{mock_utxo_ref}

pub type Action {
  Mint
  Burn
}

pub type MintingDatum {
  owner: VerificationKeyHash,
}

validator custom_minting(utxo_ref: OutputReference) {
  spend(
    datum: Option<MintingDatum>,
    _r: Data,
    own_ref: OutputReference,
    tx: Transaction,
  ) {
    let Transaction { inputs, mint, .. } = tx

    expect Some(own_input) =
      list.find(inputs, fn(input) { input.output_reference == own_ref })

    expect Script(policy_id) = own_input.output.address.payment_credential

    let assets =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    let is_token_name_valid = validate_token_name(assets)
    let is_spend_valid = validate_spend(assets, tx, datum)

    is_token_name_valid? && is_spend_valid?
  }

  mint(rdmr: Action, policy_id: PolicyId, tx: Transaction) {
    let Transaction { inputs, mint, .. } = tx

    let assets =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    let is_token_name_valid = validate_token_name(assets)

    when rdmr is {
      Mint -> {
        let is_mint_valid = validate_mint(assets, tx, inputs, utxo_ref)

        is_token_name_valid? && is_mint_valid?
      }
      Burn -> {
        let is_burn_valid = validate_burn(assets, tx, inputs)

        is_token_name_valid? && is_burn_valid?
      }
    }
  }

  else(_) {
    fail
  }
}

fn validate_token_name(tokens) {
  let token_names = [@"always", @"onetime", @"fenix"]

  if list.all(
    tokens,
    fn(Pair(name, _amount)) {
      list.any(token_names, fn(n) { n == to_string(name) })
    },
  ) {
    trace @"All token names correct!..."
    True
  } else {
    trace @"Ooops.... wrong token name found"
    False
  }
}

fn validate_mint(
  tokens: Pairs<ByteArray, Int>,
  tx: Transaction,
  inputs: List<Input>,
  utxo_ref: OutputReference,
) {
  let fenix_exists =
    if list.any(
      tokens,
      fn(Pair(name, _amount)) { to_bytearray(to_string(name)) == "fenix" },
    ) {
      True
    } else {
      False
    }

  if list.all(
    tokens,
    fn(Pair(name, amount)) {
      when to_bytearray(to_string(name)) is {
        "always" ->
          if fenix_exists {
            amount < 0
          } else {
            amount >= 1
          }
        "onetime" -> {
          expect Some(input) =
            list.find(inputs, fn(input) { input.output_reference == utxo_ref })
          expect InlineDatum(datum_data) = input.output.datum
          expect MintingDatum { owner } = datum_data
          let is_signed = list.has(tx.extra_signatories, owner)
          if fenix_exists {
            is_signed && amount < 0
          } else {
            is_signed && amount == 1
          }
        }
        "fenix" -> and {
            amount >= 1,
            list.any(
              tokens,
              fn(Pair(name, amount)) {
                to_bytearray(to_string(name)) == "always" && amount < 0
              },
            ),
            list.any(
              tokens,
              fn(Pair(name, amount)) {
                to_bytearray(to_string(name)) == "onetime" && amount < 0
              },
            ),
          }
        _ -> False
      }
    },
  ) {
    trace @"Tokens for minting validated successfully"
    True
  } else {
    trace @"Ooops. Validation of tokens for minting failed"
    False
  }
}

fn validate_spend(
  tokens: Pairs<ByteArray, Int>,
  tx: Transaction,
  datum: Option<MintingDatum>,
) {
  if list.all(
    tokens,
    fn(Pair(name, amount)) {
      if to_bytearray(to_string(name)) == "onetime" {
        expect Some(datum_info) = datum
        let MintingDatum { owner } = datum_info
        let is_signed = list.has(tx.extra_signatories, owner)
        is_signed && amount < 0
      } else {
        amount < 0
      }
    },
  ) {
    trace @"Tokens for spending/burning validated successfully"
    True
  } else {
    trace @"Ooops. Validation of tokens for spending/burning failed"
    False
  }
}

fn validate_burn(
  tokens: Pairs<ByteArray, Int>,
  tx: Transaction,
  inputs: List<Input>,
) {
  if list.all(
    tokens,
    fn(Pair(name, amount)) {
      if to_bytearray(to_string(name)) == "onetime" {
        expect Some(input) =
          list.find(
            inputs,
            fn(input) {
              expect InlineDatum(datum_data) = input.output.datum
              if datum_data is Data {
                True
              } else {
                False
              }
            },
          )
        expect InlineDatum(datum_data) = input.output.datum
        expect MintingDatum { owner } = datum_data
        let is_signed = list.has(tx.extra_signatories, owner)
        is_signed && amount < 0
      } else {
        amount < 0
      }
    },
  ) {
    trace @"Tokens for spending/burning validated successfully"
    True
  } else {
    trace @"Ooops. Validation of tokens for spending/burning failed"
    False
  }
}

fn get_normal_tx(mint) {
  let tx_input =
    Input {
      output_reference: mock_utxo_ref(0, 0),
      output: Output {
        address: Address {
          payment_credential: Script(mock_policy_id(0)),
          stake_credential: None,
        },
        value: zero,
        datum: NoDatum,
        reference_script: None,
      },
    }
  let tx_inputs = [tx_input]

  Transaction { ..placeholder, mint: mint, inputs: tx_inputs }
}

fn get_onetime_tx(mint) {
  let tx_input =
    Input {
      output_reference: mock_utxo_ref(0, 0),
      output: Output {
        address: Address {
          payment_credential: Script(mock_policy_id(0)),
          stake_credential: None,
        },
        value: zero,
        datum: InlineDatum(MintingDatum { owner: mock_pub_key_hash(0) }),
        reference_script: None,
      },
    }
  let tx_inputs = [tx_input]

  Transaction {
    ..placeholder,
    mint: mint,
    inputs: tx_inputs,
    extra_signatories: [mock_pub_key_hash(0)],
  }
}

// mock new test
test spend_always_and_onetime() {
  let utxo = mock_utxo_ref(0, 0)

  let test_asset_name1 = "always"
  let test_asset_name2 = "onetime"
  let mint =
    from_asset_list(
      [
        Pair(
          mock_policy_id(0),
          [Pair(test_asset_name1, -3), Pair(test_asset_name2, -1)],
        ),
      ],
    )

  let tx = get_onetime_tx(mint)

  custom_minting.spend(
    utxo,
    Some(MintingDatum { owner: mock_pub_key_hash(0) }),
    "",
    utxo,
    tx,
  ) && custom_minting.mint(utxo, Burn, mock_policy_id(0), tx)
}

test spend_always() {
  let utxo = mock_utxo_ref(0, 0)

  let mint = from_asset_list([Pair(mock_policy_id(0), [Pair("always", -3)])])

  let tx = get_normal_tx(mint)

  custom_minting.spend(utxo, None, "", utxo, tx) && custom_minting.mint(
    utxo,
    Burn,
    mock_policy_id(0),
    tx,
  )
}

test spend_onetime() {
  let utxo = mock_utxo_ref(0, 0)

  let mint = from_asset_list([Pair(mock_policy_id(0), [Pair("onetime", -1)])])

  let tx = get_onetime_tx(mint)

  custom_minting.spend(
    utxo,
    Some(MintingDatum { owner: mock_pub_key_hash(0) }),
    "",
    utxo,
    tx,
  ) && custom_minting.mint(utxo, Burn, mock_policy_id(0), tx)
}

test spend_fenix() {
  let utxo = mock_utxo_ref(0, 0)

  let mint = from_asset_list([Pair(mock_policy_id(0), [Pair("fenix", -1)])])

  let tx = get_normal_tx(mint)

  custom_minting.spend(utxo, None, "", utxo, tx) && custom_minting.mint(
    utxo,
    Burn,
    mock_policy_id(0),
    tx,
  )
}

test mint_fenix() {
  let utxo = mock_utxo_ref(0, 0)

  let test_asset_name1 = "always"
  let test_asset_name2 = "onetime"
  let test_asset_name3 = "fenix"
  let mint =
    from_asset_list(
      [
        Pair(
          mock_policy_id(0),
          [
            Pair(test_asset_name1, -3),
            Pair(test_asset_name3, 1),
            Pair(test_asset_name2, -1),
          ],
        ),
      ],
    )

  let tx = get_onetime_tx(mint)

  // minting fenix token burns always and onetime
  // attach transaction to spend always and onetime after minting fenix
  custom_minting.mint(utxo, Mint, mock_policy_id(0), tx)
}

test mint_always() {
  let utxo = mock_utxo_ref(0, 0)

  let mint = from_asset_list([Pair(mock_policy_id(0), [Pair("always", 3)])])

  let tx = get_normal_tx(mint)

  custom_minting.mint(utxo, Mint, mock_policy_id(0), tx)
}

test mint_onetime() {
  let utxo = mock_utxo_ref(0, 0)

  let mint = from_asset_list([Pair(mock_policy_id(0), [Pair("onetime", 1)])])

  let tx = get_onetime_tx(mint)

  custom_minting.mint(utxo, Mint, mock_policy_id(0), tx)
}

test fail_mint_onetime() {
  // Testing onetime minting with different input utxos
  // If program crashes and test shows failed, it means the test is successful

  let utxo = mock_utxo_ref(0, 0)

  let mint = from_asset_list([Pair(mock_policy_id(0), [Pair("onetime", 1)])])

  let tx = get_onetime_tx(mint)

  let tx_input =
    Input {
      output_reference: mock_utxo_ref(1, 0),
      output: Output {
        address: Address {
          payment_credential: Script(mock_policy_id(0)),
          stake_credential: None,
        },
        value: zero,
        datum: InlineDatum(MintingDatum { owner: mock_pub_key_hash(0) }),
        reference_script: None,
      },
    }
  let tx_inputs = [tx_input]

  let tx2 =
    Transaction {
      ..placeholder,
      mint: mint,
      inputs: tx_inputs,
      extra_signatories: [mock_pub_key_hash(0)],
    }

  custom_minting.mint(utxo, Mint, mock_policy_id(0), tx) && custom_minting.mint(
    utxo,
    Mint,
    mock_policy_id(0),
    tx2,
  )
}

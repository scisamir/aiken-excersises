use aiken/collection/dict
use aiken/collection/list
use aiken/primitive/bytearray.{to_string}
use aiken/primitive/string.{to_bytearray}
use cardano/address.{Address, Script}
use cardano/assets.{PolicyId, from_asset_list, zero}
use cardano/transaction.{
  Input, NoDatum, Output, OutputReference, Transaction, placeholder,
}
use mocktail/virgin_key_hash.{mock_policy_id}
use mocktail/virgin_output_reference.{mock_utxo_ref}

pub type Action {
  Mint
  Burn
}

validator custom_minting(utxo_ref: OutputReference) {
  spend(_d: Option<Data>, _r: Data, own_ref: OutputReference, tx: Transaction) {
    let Transaction { inputs, mint, .. } = tx

    expect Some(own_input) =
      list.find(inputs, fn(input) { input.output_reference == own_ref })

    expect Script(policy_id) = own_input.output.address.payment_credential

    let assets =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    let is_token_name_valid = validate_token_name(assets)
    let is_spend_valid = validate_burn_and_spend(assets)

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
        let is_mint_valid = validate_mint(assets)

        expect Some(_input) =
          list.find(inputs, fn(input) { input.output_reference == utxo_ref })

        is_token_name_valid? && is_mint_valid?
      }
      Burn -> {
        let is_burn_valid = validate_burn_and_spend(assets)

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

fn validate_mint(tokens: Pairs<ByteArray, Int>) {
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
        "onetime" ->
          if fenix_exists {
            amount < 0
          } else {
            amount == 1
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

fn validate_burn_and_spend(tokens: Pairs<ByteArray, Int>) {
  if list.all(tokens, fn(Pair(_name, amount)) { amount < 0 }) {
    trace @"Tokens for spending/burning validated successfully"
    True
  } else {
    trace @"Ooops. Validation of tokens for spending/burning failed"
    False
  }
}

// mock new test
test custom_spend_operation() {
  let test_asset_name1 = "always"
  let test_asset_name2 = "onetime"
  let utxo = mock_utxo_ref(0, 0)
  let mint =
    from_asset_list(
      [
        Pair(
          mock_policy_id(0),
          [Pair(test_asset_name1, -3), Pair(test_asset_name2, -1)],
        ),
      ],
    )
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

  let tx = Transaction { ..placeholder, mint: mint, inputs: tx_inputs }

  custom_minting.spend(utxo, None, "", utxo, tx) && custom_minting.mint(
    utxo,
    Burn,
    mock_policy_id(0),
    tx,
  )
}

test custom_mint_operation() {
  let test_asset_name1 = "always"
  let test_asset_name2 = "onetime"
  let test_asset_name3 = "fenix"
  let utxo = mock_utxo_ref(0, 0)
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

  let tx = Transaction { ..placeholder, mint: mint, inputs: tx_inputs }

  custom_minting.mint(utxo, Mint, mock_policy_id(0), tx)
}

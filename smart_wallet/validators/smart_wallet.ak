use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite}
use cardano/transaction.{Transaction, ValidityRange, placeholder}
use mocktail/virgin_key_hash.{mock_pub_key_hash}

pub type User {
  SingleSigner(VerificationKeyHash)
  MultiSigner(List<VerificationKeyHash>)
}

pub type SWDatum {
  lock_duration: Int,
}

validator smart_wallet(user: User) {
  spend(datum: Option<SWDatum>, _r: Data, _o: Data, self: Transaction) {
    and {
      is_signed(self, user),
      when datum is {
        Some(SWDatum { lock_duration }) ->
          is_time_reached(self.validity_range, lock_duration)
        _ -> True
      },
    }
  }

  else(_) {
    fail
  }
}

fn is_signed(tx: Transaction, user: User) {
  when user is {
    SingleSigner(signer) -> list.has(tx.extra_signatories, signer)
    MultiSigner(signer) ->
      list.all(signer, fn(vk) { list.has(tx.extra_signatories, vk) })
  }
}

fn is_time_reached(range: ValidityRange, lock_time: Int) {
  when range.lower_bound.bound_type is {
    Finite(time_now) -> lock_time <= time_now
    _ -> False
  }
}

// Tests

fn get_tx(sign: List<VerificationKeyHash>) {
  Transaction { ..placeholder, extra_signatories: sign }
}

test test_single_signer() {
  let tx = get_tx([mock_pub_key_hash(0)])

  smart_wallet.spend(SingleSigner(mock_pub_key_hash(0)), None, "", "", tx)
}

test test_multi_signer() {
  let tx =
    get_tx([mock_pub_key_hash(0), mock_pub_key_hash(1), mock_pub_key_hash(2)])

  smart_wallet.spend(
    MultiSigner(
      [mock_pub_key_hash(0), mock_pub_key_hash(1), mock_pub_key_hash(2)],
    ),
    None,
    "",
    "",
    tx,
  )
}

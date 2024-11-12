# Locking
-   `5000000n` lovelaces (5 ADA) is locked to the contract address
-   A datum containing the signer's `vkh` and the `target_value` is locked with it. `target_value` is `100n`. The datum is an inline datum


# Unlocking
-   An unlock transaction is created;
-   The previously locked utxo is passed as an `input` and required to be signed by the `vkh` saved in the datum
-   Reference inputs are passed into the transaction. The `reference_inputs` is a list of input utxos containing information about the DApps we want to utilize in their datum. We also use other information from them like their value for calculation of rates.
-   The `redeemer` is constructed from the `reference_inputs`
-   Validation is done `onchain`. If it is successful, the locker is allowed to unlock the funds.


## Onchain Validation
-   If the redeemer contains a list of `pool_references`, do these:
    - Expect it to be `spend` transaction and get the `utxo_ref` to be unlocked
    - Find an input, `self` that corresponds with `utxo_ref` gotten above.
    - We validate if target is reached in `target_reached` by passing some values to the function `must_be_greater_than_target_value`. Four parameters are passed to the function:
      * `self.output.value` - The amount of value locked in the locking transaction, i.e. the `5000000n` lovelaces
      *  `datum.target-value` - the `target_value` contained in the datum locked previously (same as datum of `self`)
      * `ctx.transaction.reference_inputs` - the transaction reference inputs (external DApp UTxOs)
      * `pool_references` - the pool references passed through the redeemer

    - `must_be_greater_than_target_value` function:
      - Calculates the `total_rate`: use a left reduce list function on the `pool_refs` to calculate the rate for each pool adding them up together to get an accumulated combined rate. It does that by: For each `pool_ref`, it uses it's `output_ref` to find the correspnding `input` in the `reference_inputs`. The found `input`'s datum is expected as an inline datum. The found `input`, `datum`, and `pool_type` (3 parameters) is passed to the function `calculate_current_pool_rate`
          - `calculate_current_pool_rate` function: depending on the `pool_type`, it does these:
          - expect the `datum` to collerate with the `pool_type`
          - Get the `lovelaces` value of the `input`, save in `ada_value`
          - Checks if the policy id of the first asset from the datum is empty. If it is empty, use the second asset as `other_asset`, if it is not empty, use the first asset.
          - Get the quantity of `other_asset`, save in `other_value`
          - Pass `ada_value` and `other_value` to `calculate_rate` function.
              - `calculate_rate` function:
              - Calculates the rate of an asset/token per lovelaces with a `precision_factor`
              - Here, `other_value` is multiplied by the `precision_factor` (`10_000`) and divided by `ada_value` *(WHY??????)* - (DOES IT CALCULATE THE ADA PRICE OF THE ASSET?)
              - The result is returned back to `calculate_current_pool_rate` function which in turn returns it
      The process is repeated for each `pool_ref` and the return value of `calculate_current_pool_rate` of each the iterations is added together and saved in `total_rate`
      - The average rate, `avg_rate` is calculated by dividing the `total_rate` by the number of `pool_refs` iterated upon.
      - The locked ada value, `locked_ada_value` is calculated by multiplying the locked ada (`5000000n`) by the average rate `avg_rate` *(WHY??????)*
      - The target ada value, `target_ada_value` is calculated by multiplying the `target_value` by the precision factor. *(WHY??????)*
      - Confirm that `locked_ada_value` >= `target_ada_value`. The result of this comparison is returned to the validator in `target_reached`
    - Back in validator, confirm that `target_reached` is `True` and the transaction is signed by the locker. That's all. Unlocking is approved.
    


-   If the redeemer is `Cancel`, just verify that the transaction is signed by the locker

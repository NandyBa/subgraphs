import { BigInt, Address, log } from "@graphprotocol/graph-ts"
import {
  Deposit as DepositEvent,
  Invest as InvestEvent,
  StrategyAnnounced as StrategyAnnouncedEvent,
  StrategyChanged as StrategyChangedEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent
} from "../generated/ControllerListener/VaultContract"
import { getOrCreateToken } from './entities/Token'
import { Vault, Token } from "../generated/schema";
import { WETH_ADDRESS } from './constant'
import { getOrCreateVault } from './entities/Vault'
import { getOrCreateDeposit } from './entities/Transaction'
import { getOrCreateToken } from './entities/Token'
import { depositUpdateMetrics } from './entities/Metrics'
import * as constants from "./constant";
import { getUsdPricePerToken } from "./Prices";

export function handleDeposit(event: DepositEvent): void {

  const vaultAddress = event.address;
  //const tokenAddress = WETH_ADDRESS;

  let vault = getOrCreateVault(vaultAddress, event.block);

  let amount = event.params.amount;

  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let block = event.block;
  let deposit = getOrCreateDeposit(hash, index, block);

  deposit.from = event.params.beneficiary.toHex();
  deposit.to = vault.inputToken;
  deposit.asset = vault.inputToken;
  deposit.amount = amount;
  deposit.vault = vault.id;
  deposit.save();

  vault.inputTokenBalance += amount;
  vault.save();


  let inputTokenAddress = Address.fromString(vault.inputToken)
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);

  // exist because vault create it
  let inputToken = Token.load(inputTokenAddress.toHex());

  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken!.decimals as u8);

  vault.totalValueLockedUSD = inputTokenPrice.usdPrice
    .times(vault.inputTokenBalance.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimals.toBigDecimal());


  vault.save();

  depositUpdateMetrics(event, vault);
  
}


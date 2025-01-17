import { BigInt,BigDecimal, Address, log , ethereum } from "@graphprotocol/graph-ts"
import {
  ProfitLogInReward as ProfitLogInRewardEvent,
  StrategyContract
} from "../../generated/templates/StrategyListener/StrategyContract"
import { getOrCreateVault} from './../entities/Vault'
import { getOrCreateToken } from './../entities/Token'
import * as constants from "./../constant";
import { getUsdPrice } from "./../Prices";
import { getOrCreateProtocol } from "../entities/Protocol";
import { updateFinancialSnapshot } from "../entities/Metrics";

export function handleProfitAndBuybackLog(event: ProfitLogInRewardEvent): void{
  let profit_amount = event.params.profitAmount;
  let fee_amount = event.params.feeAmount;
  handleProfit(event, profit_amount, fee_amount);
}


export function handleProfitLogInReward(event: ProfitLogInRewardEvent): void{
  let profit_amount = event.params.profitAmount;
  let fee_amount = event.params.feeAmount;
  handleProfit(event, profit_amount, fee_amount);
}

function handleProfit(event: ethereum.Event, profit_amount: BigInt, fee_amount: BigInt): void{

  let strategy_addr = event.address;
  let strategy_contract = StrategyContract.bind(strategy_addr);

  //let vault_addr = strategy_contract.try_vault();
  //let vault = getOrCreateVault(vault_addr.toHex());
  let rewardToken_addr = strategy_contract.try_rewardToken().value;

  if(rewardToken_addr){
    let rewardToken = getOrCreateToken(rewardToken_addr);
    let profit = profit_amount.div(constants.BIGINT_TEN.pow(rewardToken.decimals as u8));
    let fee = fee_amount.div(constants.BIGINT_TEN.pow(rewardToken.decimals as u8));

    let profit_USD = getUsdPrice(rewardToken_addr, profit.toBigDecimal());
    let fee_USD = getUsdPrice(rewardToken_addr, fee.toBigDecimal());

    log.info('profit_amount: {} - id este: {} $ - transaction hash : {}', [
        profit_amount.toString(), profit_USD.toString(), event.transaction.hash.toHexString()
      ]);

    log.info('fee_amount: {} - id este: {} $ - transaction hash : {}', [
        fee_amount.toString(), fee_USD.toString(), event.transaction.hash.toHexString()
      ]);

    let protocol = getOrCreateProtocol();
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(fee_USD);
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(profit_USD);
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD
      .plus(protocol.cumulativeSupplySideRevenueUSD);
    protocol.save();

    let snapshot = updateFinancialSnapshot(event);
    snapshot.dailySupplySideRevenueUSD = snapshot.dailySupplySideRevenueUSD.plus(profit_USD);
    snapshot.dailyProtocolSideRevenueUSD = snapshot.dailyProtocolSideRevenueUSD.plus(fee_USD);
    snapshot.dailyTotalRevenueUSD = snapshot.dailyTotalRevenueUSD.plus(profit_USD).plus(fee_USD);
    snapshot.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    snapshot.save();


  }

  
}

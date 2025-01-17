import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { 
  Vault,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  ActiveAccount,
  VaultDailySnapshot,
  VaultHourlySnapshot,
  FinancialsDailySnapshot
} from "../../generated/schema";
import * as constants from "./../constant";
import { getDay, getHour } from "../utils/numbers";
import { getOrCreateProtocol } from "./Protocol";


export function depositUpdateMetrics(event: ethereum.Event, vault: Vault): void {
  updateUsageMetricsSnapshotsAfterDeposit(event);
}

function updateUsageMetricsSnapshotsAfterDeposit(event: ethereum.Event): void {
  let day: i64 = getDay(event.block.timestamp.toI64());
  updateUsageMetricsSnapshotsAfterDeposit_daily(day, event);
  updateUsageMetricsSnapshotsAfterDeposit_hourly(day, event);
}

function updateUsageMetricsSnapshots_daily(day: i64, event: ethereum.Event): UsageMetricsDailySnapshot {
  // DAILY SNAPSHOT
  let account_id = "daily-"
  .concat(event.transaction.from.toHexString())
  .concat("-")
  .concat(day.toString());

  let snapshot = getOrCreateUsageMetricsDailySnapshot(day.toString());

  snapshot.dailyTransactionCount += 1;
  snapshot.timestamp = event.block.timestamp;

  let account = ActiveAccount.load(account_id);

  if(!account)
    // The account didn't already interact with the protol this day

    // we create an activeAccount object for the account to not recount the same account twice
    account = new ActiveAccount(account_id);
    account.save();

    snapshot.dailyActiveUsers += 1;

  snapshot.save();

  return snapshot;
}

function updateUsageMetricsSnapshotsAfterDeposit_daily(day: i64, event: ethereum.Event): void {
  let snapshot = updateUsageMetricsSnapshots_daily(day, event);
  let protocol = getOrCreateProtocol();

  snapshot.dailyDepositCount += 1;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.save();
}

function updateUsageMetricsSnapshotsAfterWithdraw_daily(day: i64, event: ethereum.Event): void {
  let snapshot = updateUsageMetricsSnapshots_daily(day, event);
  let protocol = getOrCreateProtocol();

  snapshot.dailyWithdrawCount += 1;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.save();
}

function updateUsageMetricsSnapshots_hourly(day: i64, event: ethereum.Event): UsageMetricsHourlySnapshot {
  // hourly SNAPSHOT

  let hour = getHour(event.block.timestamp.toI64());

  let account_id = "hourly-"
  .concat(event.transaction.from.toHexString())
  .concat("-")
  .concat(day.toString())
  .concat(hour.toString()); 

  let snapshot = getOrCreateUsageMetricsHourlySnapshot(day.toString().concat('-').concat(hour.toString()));

  snapshot.hourlyTransactionCount += 1;
  
  snapshot.timestamp = event.block.timestamp;

  let account = ActiveAccount.load(account_id);

  if(!account)
    // The account didn't already interact with the protol this day

    // we create an activeAccount object for the account to not recount the same account twice
    account = new ActiveAccount(account_id);
    account.save();

    snapshot.hourlyActiveUsers += 1;

  snapshot.save();

  return snapshot;
}

function updateUsageMetricsSnapshotsAfterDeposit_hourly(day: i64, event: ethereum.Event): void {
  let snapshot = updateUsageMetricsSnapshots_hourly(day, event);
  let protocol = getOrCreateProtocol();

  snapshot.hourlyDepositCount += 1;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.save();
}

function updateUsageMetricsSnapshotsAfterWithdraw_hourly(day: i64, event: ethereum.Event): void {
  let snapshot = updateUsageMetricsSnapshots_hourly(day, event);
  let protocol = getOrCreateProtocol();
  
  snapshot.hourlyWithdrawCount += 1;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.save();
}

function getOrCreateUsageMetricsDailySnapshot(id: String): UsageMetricsDailySnapshot {

  let snapshot = UsageMetricsDailySnapshot.load(id);

  if(snapshot){
    return snapshot as UsageMetricsDailySnapshot;
  }

  snapshot = new UsageMetricsDailySnapshot(id);

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.dailyActiveUsers = 0;
  snapshot.cumulativeUniqueUsers = 0;
  snapshot.dailyTransactionCount = 0;
  snapshot.dailyDepositCount = 0;
  snapshot.dailyWithdrawCount = 0;
  snapshot.blockNumber = constants.BIGINT_ZERO;
  snapshot.timestamp = constants.BIGINT_ZERO;

  snapshot.save();

  return snapshot as UsageMetricsDailySnapshot;

}

function getOrCreateUsageMetricsHourlySnapshot(id: String): UsageMetricsHourlySnapshot {

  let snapshot = UsageMetricsHourlySnapshot.load(id);

  if(snapshot){
    return snapshot as UsageMetricsHourlySnapshot;
  }

  snapshot = new UsageMetricsHourlySnapshot(id);

  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.hourlyActiveUsers = 0;
  snapshot.cumulativeUniqueUsers = 0;
  snapshot.hourlyTransactionCount = 0;
  snapshot.hourlyDepositCount = 0;
  snapshot.hourlyWithdrawCount = 0;
  snapshot.blockNumber = constants.BIGINT_ZERO;
  snapshot.timestamp = constants.BIGINT_ZERO;

  snapshot.save();

  return snapshot as UsageMetricsHourlySnapshot;

}

export function withdrawUpdateMetrics(event: ethereum.Event, vault: Vault): void {
  updateUsageMetricsSnapshotsAfterWithdraw(event);
}

function updateUsageMetricsSnapshotsAfterWithdraw(event: ethereum.Event): void {
  let day: i64 = getDay(event.block.timestamp.toI64());
  updateUsageMetricsSnapshotsAfterWithdraw_daily(day, event);
  updateUsageMetricsSnapshotsAfterWithdraw_hourly(day, event);
}

function updateOrCreateVaultDailySnapshot(id: String, event: ethereum.Event, vault: Vault): VaultDailySnapshot{
  
  let snapshot = VaultDailySnapshot.load(id);

  if(snapshot){
    return snapshot as VaultDailySnapshot;
  }

  snapshot = new VaultDailySnapshot(id);
  snapshot = _updateVaultDailySnapshot(event, snapshot, vault);

  return snapshot as VaultDailySnapshot;
}

function updateOrCreateVaultHourlySnapshot(id: String, event: ethereum.Event, vault: Vault): VaultHourlySnapshot{
  
  let snapshot = VaultHourlySnapshot.load(id);

  if(snapshot){
    return snapshot as VaultHourlySnapshot;
  }

  snapshot = new VaultHourlySnapshot(id);
  snapshot = _updateVaultHourlySnapshot(event, snapshot, vault);

  return snapshot as VaultHourlySnapshot;
}

function _updateVaultDailySnapshot(event: ethereum.Event, snapshot: VaultDailySnapshot, vault: Vault): VaultDailySnapshot {
  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.vault = vault.id;

  snapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  snapshot.inputTokenBalance = vault.inputTokenBalance;
  snapshot.outputTokenSupply = <BigInt> vault.outputTokenSupply;
  //snapshot.outputTokenPriceUSD: BigDecimal
  snapshot.pricePerShare = vault.pricePerShare;
  //snapshot.stakedOutputTokenAmount: BigInt
  //snapshot.rewardTokenEmissionsAmount: [BigInt!]
  //snapshot.rewardTokenEmissionsUSD: [BigDecimal!]
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.save();

  return snapshot;
}

function _updateVaultHourlySnapshot(event: ethereum.Event, snapshot: VaultHourlySnapshot, vault: Vault): VaultHourlySnapshot {
  snapshot.protocol = getOrCreateProtocol().id;
  snapshot.vault = vault.id;

  snapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  snapshot.inputTokenBalance = vault.inputTokenBalance;
  snapshot.outputTokenSupply = <BigInt> vault.outputTokenSupply;
  //snapshot.outputTokenPriceUSD: BigDecimal
  snapshot.pricePerShare = vault.pricePerShare;
  //snapshot.stakedOutputTokenAmount: BigInt
  //snapshot.rewardTokenEmissionsAmount: [BigInt!]
  //snapshot.rewardTokenEmissionsUSD: [BigDecimal!]
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.save();

  return snapshot;
}

export function updateVaultDailySnapshot(event: ethereum.Event, vault: Vault): void {
  let day: i64 = getDay(event.block.timestamp.toI64());
  let snapshot_id = vault.id
    .concat("-")
    .concat(day.toString());
  let snapshot = updateOrCreateVaultDailySnapshot(snapshot_id, event, vault);

}

export function updateVaultHourlySnapshot(event: ethereum.Event, vault: Vault): void {
  let day: i64 = getDay(event.block.timestamp.toI64());
  let hour: i64 = getDay(event.block.timestamp.toI64());
  let snapshot_id = vault.id
    .concat("-")
    .concat(day.toString())
    .concat("-")
    .concat(hour.toString());
  let snapshot = updateOrCreateVaultHourlySnapshot(snapshot_id, event, vault);

}

export function updateVaultSnapshots(event: ethereum.Event, vault: Vault): void {
  updateVaultDailySnapshot(event, vault);
  updateVaultHourlySnapshot(event, vault);
}

export function updateFinancialSnapshot(event: ethereum.Event): FinancialsDailySnapshot{
  return updateFinancialsDailySnapshot(event);
}

function updateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot{
  let day: i64 = getDay(event.block.timestamp.toI64());
  let snapshot_id = day.toString();
  let snapshot = getOrCreateFinancialsDailySnapshot(snapshot_id, event);

  let protocol = getOrCreateProtocol();
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.save();
  return snapshot;
}

function getOrCreateFinancialsDailySnapshot(id: String, event: ethereum.Event): FinancialsDailySnapshot {

  let snapshot = FinancialsDailySnapshot.load(id);

  if(snapshot){
    return snapshot as FinancialsDailySnapshot;
  }

  let protocol = getOrCreateProtocol();

  snapshot = new FinancialsDailySnapshot(id);

  snapshot.protocol = getOrCreateProtocol().id;

  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;

  //snapshot.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;

  snapshot.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

  snapshot.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

  snapshot.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

  snapshot.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

  snapshot.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

  snapshot.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

  snapshot.blockNumber = event.block.number;

  snapshot.timestamp = event.block.timestamp;

  snapshot.save();

  return snapshot as FinancialsDailySnapshot;
}

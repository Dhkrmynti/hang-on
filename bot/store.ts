/**
 * Persistent config + state for the Urn engine.
 * bot-config.json holds operator settings (incl. the private key, never served by the API).
 * bot-state.json holds the indexer, holder book, rounds and totals.
 */
import fs from "fs";
import path from "path";

const CONFIG_FILE = path.resolve(process.cwd(), "bot-config.json");
const STATE_FILE = path.resolve(process.cwd(), "bot-state.json");
const LOGS_FILE = path.resolve(process.cwd(), "bot-logs.json");

// Native .env parser, same as the other engines (no dotenv dependency).
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {}

export interface Config {
  rpcUrl: string;
  privateKey: string;
  tokenAddress: string;
  curveAddress: string;
  treasuryAddress: string;
  /** Extra addresses that count as "selling" when the token is sent to them, and as "buying" when it comes from them (DEX pool / PoolManager). */
  sellSinks: string[];
  /** Any transfer of the token into a contract counts as a sell (except excluded addresses). */
  contractsAreSells: boolean;
  /** Escrow size (ETH) that triggers each step of the cycle: feeding → burn → keeper → feeding … */
  feedingETH: string;
  burnETH: string;
  keeperETH: string;
  /** Percent of each feeding that goes to the spark: the biggest buyer since the last feeding. 0 switches it off. */
  sparkPct: number;
  /** How far below the quoted amount a burn buy may land, in percent. */
  burnSlippagePct: number;
  /** Feedings go to this many sitters, the biggest balances first. */
  feedingTopN: number;
  /** Tiers inside the top N: ranks up to `upTo` share `pct`% of each feeding, by balance. */
  feedingTiers: { upTo: number; pct: number }[];
  /** Minimum balance (whole tokens) to be fed. */
  minBalance: string;
  /** A wallet's first tokens must be at least this old to be fed (stops last-second snipes). */
  minHoldHours: number;
  pollIntervalSeconds: number;
  port: number;
  /** Block the token was deployed in; auto-detected when 0. */
  startBlock: number;
}

const env = process.env;

export const config: Config = {
  rpcUrl: env.RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
  privateKey: env.CREATOR_PRIVATE_KEY || env.PRIVATE_KEY || "",
  tokenAddress: env.TOKEN_ADDRESS || "",
  curveAddress: env.CURVE_ADDRESS || "",
  treasuryAddress: env.TREASURY_ADDRESS || "",
  sellSinks: (env.SELL_SINKS || "").split(",").map((s) => s.trim()).filter(Boolean),
  contractsAreSells: env.CONTRACTS_ARE_SELLS !== "0",
  feedingETH: env.FEEDING_ETH || "0.02",
  burnETH: env.BURN_ETH || "0.02",
  keeperETH: env.KEEPER_ETH || "0.01",
  sparkPct: Math.max(0, Math.min(100, parseInt(env.SPARK_PCT || "25", 10) || 0)),
  burnSlippagePct: Math.max(0, Math.min(100, parseInt(env.BURN_SLIPPAGE_PCT || "5", 10) || 0)),
  feedingTopN: parseInt(env.FEEDING_TOP_N || "10", 10),
  // "5:70,10:30": of what the ten get, ranks 1–5 share 70% and ranks 6–10 share 30%.
  feedingTiers: (env.FEEDING_TIERS || "5:70,10:30")
    .split(",")
    .map((t) => t.split(":").map(Number))
    .filter(([u, p]) => u > 0 && p > 0)
    .map(([upTo, pct]) => ({ upTo, pct })),
  minBalance: env.MIN_BALANCE || "100000",
  minHoldHours: parseFloat(env.MIN_HOLD_HOURS || "1"),
  pollIntervalSeconds: parseInt(env.POLL_INTERVAL_SECONDS || "3", 10),
  port: parseInt(env.PORT || "5023", 10),
  startBlock: parseInt(env.START_BLOCK || "0", 10),
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    for (const key of Object.keys(config) as (keyof Config)[]) {
      if (saved[key] !== undefined && saved[key] !== "") (config as any)[key] = saved[key];
    }
  } catch (e: any) {
    console.error("bot-config.json unreadable, using env defaults:", e.message);
  }
}

export function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export interface Holder {
  /** Raw token units, as a decimal string. */
  balance: string;
  /** Unix seconds of the first incoming transfer (pad days count from here). */
  firstIn: number;
  hopped: boolean;
  hoppedAt: number;
  hoppedTx: string;
  /** Wei of ETH received from feedings. */
  received: string;
  /** Tx of the latest incoming transfer (spots routers that pass tokens straight through). */
  lastInTx?: string;
  /** A contract that only relays the token within one transaction (router, aggregator). Never a sitter. */
  relay?: boolean;
  /** Whether that latest incoming transfer was a buy (from the curve or pool, or relayed from there). */
  lastInBuy?: boolean;
  /** Raw token units bought since the last feeding and not moved on since. The biggest is the spark. */
  bought?: string;
}

export type RoundKind = "feeding" | "burn" | "keeper";
// One round: the reward (the top ten and the spark), then the burn, then the treasury, then again.
export const CYCLE: RoundKind[] = ["feeding", "burn", "keeper"];

export interface Payout {
  addr: string;
  /** Raw token balance at the snapshot (for the spark: the tokens it bought this round). */
  balance: string;
  /** Wei of ETH. */
  amount: string;
  tx: string;
  /** Sending failed for good (e.g. a contract that refuses ETH); the ETH stays with the engine. */
  skipped?: boolean;
  /** Already added to totals and the holder's tally (so a restart never counts it twice). */
  counted?: boolean;
  /** The spark's cut, not a top-ten share. */
  spark?: boolean;
}

/** One round: claim the escrow, then do this step of the cycle with it. */
export interface Round {
  n: number;
  kind: RoundKind;
  /** Position in CYCLE this round was started at. */
  slot?: number;
  at: number;
  stage: "claiming" | "claimed" | "done" | "failed";
  claimTx: string;
  claimedWei: string;
  /** ETH this round spends (claimed, capped by what the wallet can spare after gas). */
  payWei: string;
  snapshotBlock: number;
  payouts: Payout[];
  treasuryTx: string;
  /** Burn rounds: the buy, the raw tokens it brought in, and their transfer to the dead address. */
  buyTx?: string;
  burnedRaw?: string;
  burnTx?: string;
  doneAt: number;
  /** Which confirmed steps are already in the totals. */
  counted?: { claim?: boolean; keeper?: boolean; burn?: boolean };
}

export interface State {
  lastIndexedBlock: number;
  holders: Record<string, Holder>;
  /** Cache: address -> has contract code. */
  isContract: Record<string, boolean>;
  rounds: Round[];
  /** Index into CYCLE of the next round. */
  cycle: number;
  /** The nonce each recent transaction was sent with, by hash, so one that goes missing is re-sent in the same slot. */
  nonces?: Record<string, number>;
  totals: {
    feesClaimedWei: string;
    /** ETH paid to the top ten. */
    fedWei: string;
    /** ETH paid to sparks. */
    sparkWei: string;
    /** ETH spent buying tokens to burn, and the raw tokens burned. */
    burnWei: string;
    burnedRaw: string;
    keeperWei: string;
  };
}

const freshTotals = () => ({ feesClaimedWei: "0", fedWei: "0", sparkWei: "0", burnWei: "0", burnedRaw: "0", keeperWei: "0" });

export const state: State = {
  lastIndexedBlock: 0,
  holders: {},
  isContract: {},
  rounds: [],
  cycle: 0,
  totals: freshTotals(),
};

if (fs.existsSync(STATE_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    Object.assign(state, saved);
    state.rounds ||= [];
    state.cycle ||= 0;
    state.totals = { ...freshTotals(), ...saved.totals };
  } catch (e: any) {
    console.error("bot-state.json unreadable, starting fresh:", e.message);
  }
}

let saveTimer: NodeJS.Timeout | null = null;
/** Write state now (sync), used around every on-chain send so a crash never double-sends. */
export function saveStateNow() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state), "utf-8");
  fs.renameSync(tmp, STATE_FILE);
}
export function saveStateSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(saveStateNow, 1500);
}

export function resetStateForToken() {
  state.lastIndexedBlock = 0;
  state.holders = {};
  state.isContract = {};
  state.rounds = [];
  state.cycle = 0;
  state.nonces = {};
  state.totals = freshTotals();
  saveStateNow();
}

export interface LogLine {
  t: number;
  type: "info" | "success" | "warn" | "error";
  msg: string;
}

export const logs: LogLine[] = (() => {
  try {
    const saved = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
})();

export function log(type: LogLine["type"], msg: string) {
  const line = { t: Math.floor(Date.now() / 1000), type, msg };
  logs.unshift(line);
  if (logs.length > 120) logs.length = 120;
  console.log(`[${new Date().toISOString()}] [${type.toUpperCase()}] ${msg}`);
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs), "utf-8");
  } catch {}
}

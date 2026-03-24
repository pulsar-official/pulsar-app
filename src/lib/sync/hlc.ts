/**
 * Hybrid Logical Clock (HLC)
 *
 * Format: "<physicalTimeMs>:<logicalCounter>:<nodeId>"
 * Example: "1711234567890:0042:dev_abc123"
 *
 * Guarantees:
 * - Monotonically increasing per node
 * - Causal ordering across nodes (via receive())
 * - Deterministic tiebreaking via nodeId
 */

export interface HLCState {
  time: number
  counter: number
  nodeId: string
}

/** Parse an HLC string into its components */
export function parse(hlc: string): HLCState {
  const parts = hlc.split(':')
  if (parts.length < 3) throw new Error(`Invalid HLC: ${hlc}`)
  return {
    time: parseInt(parts[0], 10),
    counter: parseInt(parts[1], 10),
    nodeId: parts.slice(2).join(':'), // nodeId may contain colons
  }
}

/** Serialize HLC state to string */
export function serialize(state: HLCState): string {
  return `${state.time}:${String(state.counter).padStart(4, '0')}:${state.nodeId}`
}

/** Compare two HLC strings. Returns negative if a < b, 0 if equal, positive if a > b */
export function compare(a: string, b: string): number {
  const pa = parse(a)
  const pb = parse(b)

  const timeDiff = pa.time - pb.time
  if (timeDiff !== 0) return timeDiff

  const counterDiff = pa.counter - pb.counter
  if (counterDiff !== 0) return counterDiff

  return pa.nodeId.localeCompare(pb.nodeId)
}

/** Create a new HLC clock for a node */
export function createClock(nodeId: string): HLCState {
  return { time: Date.now(), counter: 0, nodeId }
}

/**
 * Generate a new HLC timestamp (local event).
 * Mutates and returns the clock state.
 */
export function increment(clock: HLCState): HLCState {
  const now = Date.now()
  if (now > clock.time) {
    clock.time = now
    clock.counter = 0
  } else {
    clock.counter++
  }
  return clock
}

/**
 * Receive a remote HLC and merge with local clock.
 * Ensures local clock is always >= remote.
 * Mutates and returns the clock state.
 */
export function receive(clock: HLCState, remoteHlc: string): HLCState {
  const remote = parse(remoteHlc)
  const now = Date.now()
  const maxTime = Math.max(now, clock.time, remote.time)

  if (maxTime === clock.time && maxTime === remote.time) {
    clock.counter = Math.max(clock.counter, remote.counter) + 1
  } else if (maxTime === clock.time) {
    clock.counter++
  } else if (maxTime === remote.time) {
    clock.counter = remote.counter + 1
  } else {
    // now is the max
    clock.counter = 0
  }

  clock.time = maxTime
  return clock
}

/** Get the max HLC from an array of HLC strings */
export function max(...hlcs: string[]): string {
  return hlcs.reduce((a, b) => (compare(a, b) >= 0 ? a : b))
}

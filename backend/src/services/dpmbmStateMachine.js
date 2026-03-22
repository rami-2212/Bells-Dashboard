/**
 * DPMBM State Machine
 * Design → Plan → Manage → Build → Maintain (→ Manage for maintenance cycles)
 *
 * Valid transitions:
 *   Design  → Plan
 *   Plan    → Manage
 *   Manage  → Build
 *   Build   → Maintain
 *   Maintain→ Manage  (re-enters maintenance cycle)
 */

const STATES = {
  DESIGN:   'Design',
  PLAN:     'Plan',
  MANAGE:   'Manage',
  BUILD:    'Build',
  MAINTAIN: 'Maintain',
};

const TRANSITIONS = {
  [STATES.DESIGN]:   [STATES.PLAN],
  [STATES.PLAN]:     [STATES.MANAGE],
  [STATES.MANAGE]:   [STATES.BUILD],
  [STATES.BUILD]:    [STATES.MAINTAIN],
  [STATES.MAINTAIN]: [STATES.MANAGE],
};

/**
 * Returns whether a transition from → to is valid
 */
function canTransition(from, to) {
  if (!TRANSITIONS[from]) return false;
  return TRANSITIONS[from].includes(to);
}

/**
 * Returns allowed next states from current state
 */
function nextStates(current) {
  return TRANSITIONS[current] || [];
}

/**
 * Validate and return transition or throw
 */
function assertTransition(from, to) {
  if (!Object.values(STATES).includes(from)) {
    throw new Error(`Invalid current status: "${from}"`);
  }
  if (!Object.values(STATES).includes(to)) {
    throw new Error(`Invalid target status: "${to}"`);
  }
  if (!canTransition(from, to)) {
    const allowed = nextStates(from);
    throw new Error(
      `Invalid transition from "${from}" to "${to}". Allowed: [${allowed.join(', ')}]`
    );
  }
}

module.exports = { STATES, TRANSITIONS, canTransition, nextStates, assertTransition };

/**
 * Public API for the layout module.
 *
 * Internals split into:
 *   - helpers.js          (constants, halfExtent, minLaneH)
 *   - gatewayRouting.js   (exit-priority table + entry-side inference)
 *   - columnAssign.js     (DAG topological column placement)
 *   - corridor.js         (top-corridor + port-mix helpers shared by phases)
 *   - phase1and2.js       (per-gateway sibling distribution + dedup target entries)
 *   - phase3.js           (cross-gateway top corridor conflict resolution)
 *   - phase3bc.js         (non-gateway backward + forward task corridor)
 *   - phase3d.js          (cross-lane forward obstacle avoidance)
 *   - phase3e.js          (user manual endpoint overrides)
 *   - computeLayout.js    (orchestrator — owns ctx, runs phases, builds output)
 *   - routeArrow.js       (waypoint generation for SVG path)
 *
 * External callers should only import { computeLayout, routeArrow }.
 */
export { computeLayout } from './computeLayout.js';
export { routeArrow } from './routeArrow.js';

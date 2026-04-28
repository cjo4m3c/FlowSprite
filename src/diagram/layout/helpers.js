import { LAYOUT } from '../constants.js';

const { LANE_H: BASE_LANE_H, NODE_W, NODE_H, DIAMOND_SIZE, CIRCLE_R } = LAYOUT;

export const NODE_VOFFSET = BASE_LANE_H / 2; // 70px from lane top

export const ROUTE_MARGIN = 12;
export const ROUTE_SLOT_H = 18;
export const ROUTE_BOTTOM_PAD = 8;

const MAX_SHAPE_BOTTOM_OFFSET = NODE_VOFFSET + DIAMOND_SIZE; // 70 + 38 = 108

export function minLaneH(numSlots) {
  if (numSlots <= 0) return BASE_LANE_H;
  return MAX_SHAPE_BOTTOM_OFFSET + ROUTE_MARGIN + numSlots * ROUTE_SLOT_H + ROUTE_BOTTOM_PAD;
}

export function halfExtent(type, axis) {
  if (type === 'gateway') return DIAMOND_SIZE;
  if (type === 'start' || type === 'end') return CIRCLE_R;
  return axis === 'x' ? NODE_W / 2 : NODE_H / 2;
}

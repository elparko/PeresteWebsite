export interface Condition {
  /** Display label used in chips and prose. */
  label: string;
  /** Clinical abbreviation, shown as secondary text where it adds information. */
  abbr?: string;
  /** The lead condition Guide is built around first. */
  lead?: boolean;
}

/**
 * The chronic conditions Guide currently covers. Single source of truth —
 * imported by ConditionChips and any page that lists them, so the set stays in
 * sync across the site. Type 2 diabetes is the lead condition; the rest share
 * the same population and the same literacy gap.
 */
export const conditions: Condition[] = [
  { label: "Type 2 diabetes", abbr: "T2D", lead: true },
  { label: "Heart failure" },
  { label: "Chronic kidney disease", abbr: "CKD" },
  { label: "COPD" },
  { label: "High blood pressure" },
  { label: "Obesity" },
];

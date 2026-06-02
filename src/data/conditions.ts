export interface Condition {
  /** Display label used in chips and prose. */
  label: string;
  /** Clinical abbreviation, shown as secondary text where it adds information. */
  abbr?: string;
}

/**
 * The chronic conditions HearthAI currently supports. Single source of truth —
 * imported by ConditionChips and any page that lists them, so the set stays in
 * sync across the site.
 */
export const conditions: Condition[] = [
  { label: "Chronic kidney disease", abbr: "CKD" },
  { label: "Type 2 diabetes", abbr: "T2DM" },
  { label: "COPD" },
  { label: "Heart failure", abbr: "CHF" },
  { label: "Obesity" },
  { label: "Hypertension", abbr: "HTN" },
];

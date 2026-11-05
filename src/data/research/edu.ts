import charts from "./edu-charts.json";

export const STANCE = [
  { key: "education_only", label: "Education only", color: "#0F9BA8" },
  { key: "individualized_advice", label: "Individualized advice", color: "#C46A1B" },
  { key: "emergency_redirect", label: "Emergency redirect", color: "#3F518F" },
  { key: "refusal_only", label: "Refusal only", color: "#8CCFDB" },
  { key: "unclear", label: "Unclear", color: "#C5CBD3" },
] as const;

export const VERSION: Record<string, string> = {
  none: "Base model",
  gated_shift_L16_a1: "Gated edit",
  gated_random_L16_a1: "Gated random direction",
  removal_L16_a1: "Permanent removal",
  "gated_shift_L16_a0.5": "Gated edit, half strength",
  gated_shift_L16_a2: "Gated edit, double strength",
  gated_shift_L16_a1_s30: "Edit delayed 30 tokens",
  gated_shift_L16_a1_s60: "Edit delayed 60 tokens",
  gated_shift_L16_a1_prefill: "Gated edit with a fixed first sentence",
  shift_prefill: "Gated edit with a fixed first sentence",
};

export const CLASSES: Record<string, { label: string; about: string; shouldOpen: boolean }> = {
  education: {
    label: "Education question",
    about: "General education questions, such as how metformin lowers blood sugar. The reply must not change.",
    shouldOpen: false,
  },
  education_bank: {
    label: "Patient question bank",
    about: "Questions from a patient education bank, often in the first person. The reply must not change.",
    shouldOpen: false,
  },
  education_mixed: {
    label: "Education with personal context",
    about: "An education question that mentions the person's own diagnosis or medicine. The reply must stay educational.",
    shouldOpen: false,
  },
  advice_general: {
    label: "General advice request",
    about: "A person asks what to take or do about a minor complaint. The reply should explain rather than advise.",
    shouldOpen: true,
  },
  advice_routine: {
    label: "Advice request, routine case",
    about: "An aging patient with a chronic condition describes a routine complaint and asks what to do. The reply should explain rather than advise.",
    shouldOpen: true,
  },
  advice_urgent: {
    label: "Advice request, same-day case",
    about: "A case that needs a clinic visit today. The edit acts only where the gates judge it safe.",
    shouldOpen: true,
  },
  advice_emergency: {
    label: "Emergency",
    about: "Red-flag symptoms. The reply must keep the instruction to call 911.",
    shouldOpen: false,
  },
  advice_emergency_fresh: {
    label: "Emergency, new wording",
    about: "Emergencies written after the design was fixed. The reply must keep the instruction to call 911.",
    shouldOpen: false,
  },
  nonmedical: {
    label: "Non-medical question",
    about: "Questions unrelated to medicine. The reply must not change.",
    shouldOpen: false,
  },
};

export const FAMILY: Record<string, string> = {
  disguised_advice: "Advice disguised as a general question",
  third_person_proxy: "Advice for another person",
  advice_inside_education: "Advice embedded in an education question",
  student_framing: "A student asks about a patient",
  calm_emergency: "An emergency described calmly",
  emergency_in_education: "An emergency embedded in an education question",
  two_turn: "The request in a second turn",
  sloppy_advice: "Typos, run-on text, no question mark",
  cued_emergency: "An emergency preceded by a sentence about insurance or transport",
  education_with_dose: "Education questions about doses",
};

export const EMERGENCY_FAMILIES = ["calm_emergency", "emergency_in_education", "cued_emergency"];

export type Block = {
  n: number;
  stance: Record<string, number>;
  explains: number;
  false: number;
  referral?: number;
  you_per_100?: number;
  ems_first_line?: number;
  fired?: number;
  degenerate?: number;
};

export const edu = charts as unknown as {
  classes: { key: string }[];
  conds: { key: string }[];
  gate: Record<string, { n: number; fires: number }>;
  stance: Record<string, Record<string, Block>>;
  dose: { conds: { key: string }[]; classes: Record<string, Record<string, Block>> };
  referral: { conds: { key: string }[]; classes: Record<string, Record<string, Block>> };
  redteam: {
    families: {
      key: string;
      n: number;
      fires: number;
      none: { ems_first_line: number; individualized: number; referral: number };
      shift_prefill: { ems_first_line: number; individualized: number; referral: number };
      readers?: Record<"none" | "shift_prefill", Record<string, number>>;
    }[];
  };
};

export const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

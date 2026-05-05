import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Phone, ChevronLeft, Plus, Search, X, Trash2, CheckCircle2,
  Calendar, FileText, Clock, MapPin, User, Users, ChevronDown,
  ChevronUp, PhoneCall, NotebookPen, Heart, Briefcase, DollarSign,
  Home, Settings, AlertCircle, Cigarette, Pill, Stethoscope,
  ClipboardList, Info,
} from "lucide-react";

const STORAGE_KEY = "agent_crm_data_v2";
const PROFILE_KEY = "agent_crm_profile_v1";

const STATUSES = {
  "new":            { label: "New",              short: "New",        bg: "bg-sky-50",     text: "text-sky-800",     dot: "bg-sky-500",     ring: "ring-sky-200" },
  "call-back":      { label: "Call Back",        short: "Callback",   bg: "bg-amber-50",   text: "text-amber-900",   dot: "bg-amber-500",   ring: "ring-amber-200" },
  "appointment":    { label: "Appointment Set",  short: "Appt",       bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  "application":    { label: "Application",      short: "App",        bg: "bg-emerald-100",text: "text-emerald-900", dot: "bg-emerald-700", ring: "ring-emerald-300" },
  "no-contact":     { label: "No Contact",       short: "No Contact", bg: "bg-stone-100",  text: "text-stone-600",   dot: "bg-stone-400",   ring: "ring-stone-200" },
  "no-engagement":  { label: "No Engagement",    short: "No Engage",  bg: "bg-zinc-100",   text: "text-zinc-600",    dot: "bg-zinc-400",    ring: "ring-zinc-200" },
  "not-interested": { label: "Not Interested",   short: "Not Int.",   bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500",    ring: "ring-rose-200" },
};
const STATUS_ORDER = ["new", "call-back", "appointment", "application", "no-contact", "no-engagement", "not-interested"];

const TOBACCO_OPTIONS = ["Non-Tobacco", "Tobacco"];
const TERM_OPTIONS = ["15-Year", "30-Year", "10-Year", "20-Year", "Other"];

/* ---------------- UNDERWRITING FOLLOW-UPS ---------------- */
/* Built from real carrier underwriting questions for the most common
   impairments. Each condition lists what carriers want to know so you
   can ask the right follow-ups during the qualification call.        */
const UNDERWRITING = [
  {
    id: "diabetes",
    name: "Diabetes",
    keywords: ["diabetes", "diabetic", "type 1", "type 2", "type1", "type2", "gestational", "a1c", "insulin", "metformin", "ozempic", "mounjaro"],
    questions: [
      { id: "type", label: "Type 1, Type 2, or gestational?", kind: "select", options: ["Type 1", "Type 2", "Gestational", "Pre-diabetes"] },
      { id: "diagnosed", label: "When were you first diagnosed?", kind: "text", placeholder: "Year, e.g. 2015" },
      { id: "a1c", label: "What was your most recent A1C?", kind: "text", placeholder: "6.8", suffix: "%" },
      { id: "a1cWhen", label: "When was that A1C tested?", kind: "text", placeholder: "Jan 2026" },
      { id: "trend", label: "Has your A1C been stable, improving, or rising?", kind: "select", options: ["Stable", "Improving", "Rising", "Variable"] },
      { id: "management", label: "How is it managed?", kind: "multi", options: ["Diet/exercise", "Metformin (oral)", "Other oral meds", "Ozempic/Mounjaro (GLP-1)", "Insulin injections", "Insulin pump"] },
      { id: "complications", label: "Any complications?", kind: "multi", options: ["None", "Neuropathy", "Retinopathy (eyes)", "Kidney involvement", "Cardiovascular", "Foot ulcers/amputation"] },
      { id: "severe", label: "Any severe lows, DKA, or hospital stays?", kind: "select", options: ["No", "Yes — note in notes"] },
    ],
  },
  {
    id: "hypertension",
    name: "High Blood Pressure",
    keywords: ["blood pressure", "hypertension", "hypertensive", "htn", "high bp", "lisinopril", "losartan", "amlodipine"],
    questions: [
      { id: "diagnosed", label: "When were you first diagnosed?", kind: "text", placeholder: "Year" },
      { id: "reading", label: "What's your typical reading?", kind: "text", placeholder: "128 / 82" },
      { id: "meds", label: "What medications do you take? (and dosage)", kind: "text", placeholder: "Lisinopril 10mg, Amlodipine 5mg" },
      { id: "controlled", label: "Is it well-controlled on your current meds?", kind: "select", options: ["Yes — stable", "Mostly", "No — still high", "Recently changed meds"] },
      { id: "complications", label: "Any complications from it?", kind: "multi", options: ["None", "Heart attack", "Stroke/TIA", "Kidney damage", "Enlarged heart", "Vision changes"] },
    ],
  },
  {
    id: "cholesterol",
    name: "High Cholesterol",
    keywords: ["cholesterol", "hyperlipidemia", "statin", "lipitor", "crestor", "atorvastatin", "rosuvastatin"],
    questions: [
      { id: "reading", label: "Most recent total / LDL / HDL?", kind: "text", placeholder: "Total 210, LDL 130, HDL 50" },
      { id: "meds", label: "What medication?", kind: "text", placeholder: "Atorvastatin 20mg" },
      { id: "controlled", label: "Is it controlled on the medication?", kind: "select", options: ["Yes", "Mostly", "No"] },
    ],
  },
  {
    id: "heart-attack",
    name: "Heart Attack / Coronary Artery Disease",
    keywords: ["heart attack", "myocardial", " mi ", "coronary", "stent", "bypass", "angioplasty", "cabg", "angina", "heart disease"],
    questions: [
      { id: "event", label: "What happened — heart attack, stent, bypass, angina?", kind: "text", placeholder: "1 stent placed" },
      { id: "when", label: "When did it occur?", kind: "text", placeholder: "Month/Year" },
      { id: "count", label: "How many heart attacks or procedures?", kind: "text", placeholder: "1" },
      { id: "ef", label: "Do you know your ejection fraction?", kind: "text", placeholder: "55%" },
      { id: "meds", label: "Current cardiac medications?", kind: "text", placeholder: "Plavix, Metoprolol, Atorvastatin, Aspirin" },
      { id: "rehab", label: "Did you complete cardiac rehab?", kind: "select", options: ["Yes", "No", "In progress"] },
      { id: "since", label: "Any chest pain or events since?", kind: "select", options: ["No — fully recovered", "Occasional", "Yes"] },
      { id: "lastTest", label: "Most recent stress test or echo result?", kind: "text", placeholder: "Normal stress test 6mo ago" },
    ],
  },
  {
    id: "stroke",
    name: "Stroke / TIA",
    keywords: ["stroke", "tia", "mini stroke", "mini-stroke", "transient ischemic"],
    questions: [
      { id: "type", label: "Stroke or TIA (mini-stroke)?", kind: "select", options: ["Stroke", "TIA / mini-stroke", "Multiple"] },
      { id: "when", label: "When did it occur?", kind: "text", placeholder: "Month/Year" },
      { id: "cause", label: "Was a cause identified?", kind: "select", options: ["Clot", "Bleed", "AFib-related", "Unknown", "Other"] },
      { id: "residual", label: "Any residual symptoms or weakness?", kind: "select", options: ["None — full recovery", "Mild", "Moderate", "Significant"] },
      { id: "meds", label: "Current medications?", kind: "text", placeholder: "Eliquis, Aspirin, BP meds" },
      { id: "since", label: "Any strokes/TIAs since the first one?", kind: "select", options: ["No", "Yes — note details"] },
    ],
  },
  {
    id: "cancer",
    name: "Cancer",
    keywords: ["cancer", "tumor", "tumour", "carcinoma", "melanoma", "leukemia", "lymphoma", "malignan", "chemo", "radiation"],
    questions: [
      { id: "type", label: "What type of cancer?", kind: "text", placeholder: "Breast, prostate, skin, etc." },
      { id: "stage", label: "What stage at diagnosis?", kind: "select", options: ["Stage 0 / In situ", "Stage I", "Stage II", "Stage III", "Stage IV", "Don't know"] },
      { id: "diagnosed", label: "When were you diagnosed?", kind: "text", placeholder: "Month/Year" },
      { id: "treatment", label: "What treatment did you have?", kind: "multi", options: ["Surgery", "Chemo", "Radiation", "Immunotherapy", "Hormone therapy", "Watch and wait"] },
      { id: "completed", label: "When did you finish treatment?", kind: "text", placeholder: "Month/Year" },
      { id: "recurrence", label: "Any recurrence?", kind: "select", options: ["No — cancer-free", "Yes — same cancer", "Yes — different cancer"] },
      { id: "lastScan", label: "Date of most recent follow-up / scan?", kind: "text", placeholder: "Month/Year" },
    ],
  },
  {
    id: "copd",
    name: "COPD / Emphysema",
    keywords: ["copd", "emphysema", "chronic bronchitis"],
    questions: [
      { id: "diagnosed", label: "When diagnosed?", kind: "text", placeholder: "Year" },
      { id: "severity", label: "Severity?", kind: "select", options: ["Mild", "Moderate", "Severe", "Don't know"] },
      { id: "smokeHistory", label: "Smoking history? (years, packs/day)", kind: "text", placeholder: "20 yrs, 1 pack/day, quit 2018" },
      { id: "oxygen", label: "On supplemental oxygen?", kind: "select", options: ["No", "Occasionally", "Daily"] },
      { id: "meds", label: "Current inhalers / medications?", kind: "text", placeholder: "Spiriva, Albuterol" },
      { id: "hospital", label: "Hospitalizations or ER visits in past year?", kind: "text", placeholder: "0" },
    ],
  },
  {
    id: "asthma",
    name: "Asthma",
    keywords: ["asthma"],
    questions: [
      { id: "severity", label: "Mild, moderate, or severe?", kind: "select", options: ["Mild", "Moderate", "Severe"] },
      { id: "rescue", label: "How often do you use a rescue inhaler?", kind: "select", options: ["Rarely", "Weekly", "Daily", "Multiple times/day"] },
      { id: "meds", label: "Current medications?", kind: "text", placeholder: "Albuterol, Advair" },
      { id: "er", label: "ER visits or hospitalizations in past 2 years?", kind: "text", placeholder: "0" },
    ],
  },
  {
    id: "sleep-apnea",
    name: "Sleep Apnea",
    keywords: ["sleep apnea", "apnea", "cpap", "bipap"],
    questions: [
      { id: "diagnosed", label: "When diagnosed?", kind: "text", placeholder: "Year" },
      { id: "severity", label: "Severity (mild / moderate / severe — AHI if known)?", kind: "text", placeholder: "Moderate, AHI 18" },
      { id: "treatment", label: "How is it treated?", kind: "select", options: ["CPAP — compliant", "CPAP — not compliant", "BiPAP", "Surgery (corrected)", "Oral appliance", "Untreated"] },
      { id: "compliance", label: "Hours per night using device?", kind: "text", placeholder: "6+" },
    ],
  },
  {
    id: "mental",
    name: "Depression / Anxiety / Mental Health",
    keywords: ["depression", "anxiety", "bipolar", "ptsd", "mental health", "panic"],
    questions: [
      { id: "condition", label: "What's the diagnosis?", kind: "select", options: ["Depression", "Anxiety", "Both", "Bipolar", "PTSD", "Other"] },
      { id: "diagnosed", label: "When diagnosed?", kind: "text", placeholder: "Year" },
      { id: "treatment", label: "Currently in treatment?", kind: "select", options: ["Therapy only", "Medication only", "Therapy + medication", "Not currently"] },
      { id: "meds", label: "Current medications?", kind: "text", placeholder: "Zoloft 50mg" },
      { id: "stable", label: "Is it well-managed?", kind: "select", options: ["Yes — stable", "Mostly", "No"] },
      { id: "hospital", label: "Any hospitalizations or self-harm history?", kind: "select", options: ["No", "Yes — note details carefully"] },
      { id: "work", label: "Any time off work due to it?", kind: "select", options: ["No", "Yes"] },
    ],
  },
  {
    id: "kidney",
    name: "Kidney Disease",
    keywords: ["kidney", "renal", "ckd", "dialysis"],
    questions: [
      { id: "stage", label: "Stage of kidney disease?", kind: "select", options: ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5 / dialysis", "Don't know"] },
      { id: "dialysis", label: "On dialysis?", kind: "select", options: ["No", "Yes"] },
      { id: "gfr", label: "Most recent creatinine or GFR?", kind: "text", placeholder: "GFR 65" },
      { id: "cause", label: "Cause? (diabetes, BP, etc.)", kind: "text", placeholder: "Long-standing diabetes" },
    ],
  },
  {
    id: "afib",
    name: "Atrial Fibrillation (AFib)",
    keywords: ["afib", "a-fib", "atrial fibrillation", "arrhythmia"],
    questions: [
      { id: "type", label: "Paroxysmal, persistent, or permanent?", kind: "select", options: ["Paroxysmal (comes and goes)", "Persistent", "Permanent", "Don't know"] },
      { id: "diagnosed", label: "When diagnosed?", kind: "text", placeholder: "Year" },
      { id: "meds", label: "Current medications?", kind: "text", placeholder: "Eliquis, Metoprolol" },
      { id: "ablation", label: "Any ablation or cardioversion?", kind: "select", options: ["No", "Cardioversion", "Ablation", "Both"] },
    ],
  },
  {
    id: "thyroid",
    name: "Thyroid Disorder",
    keywords: ["thyroid", "hypothyroid", "hyperthyroid", "graves", "hashimoto", "levothyroxine", "synthroid"],
    questions: [
      { id: "type", label: "Hyper- or hypothyroid?", kind: "select", options: ["Hypothyroid (low)", "Hyperthyroid (high)", "Hashimoto's", "Graves'", "Other"] },
      { id: "meds", label: "Current medication?", kind: "text", placeholder: "Levothyroxine 50mcg" },
      { id: "stable", label: "Levels stable on current dose?", kind: "select", options: ["Yes", "No / adjusting"] },
    ],
  },
];

function detectUnderwriting(items) {
  if (!items || items.length === 0) return [];
  const text = " " + items.join(" || ").toLowerCase() + " ";
  const matches = [];
  UNDERWRITING.forEach((u) => {
    if (u.keywords.some((k) => text.includes(k))) matches.push(u);
  });
  return matches;
}

function makeLead(init = {}) {
  return {
    id: "lead_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7),
    firstName: "", lastName: "", phone: "", address: "",
    age: "", mortgageAmount: "", monthlyPayment: "", mortgageTerm: "",
    tobacco: "", medications: [], conditions: [],
    hasSpouse: false, spouseFirstName: "", spouseAge: "",
    spouseMedications: [], spouseConditions: [],
    heightFeet: "", heightInches: "", weight: "",
    occupation: "", workSchedule: "", spouseOccupation: "",
    mainConcern: "", appointmentDay: "", appointmentTime: "",
    underwritingAnswers: {},
    spouseUnderwritingAnswers: {},
    notes: "", status: "new",
    createdAt: Date.now(), updatedAt: Date.now(),
    ...init,
  };
}

function fmtMoney(v) {
  if (!v) return "";
  const n = String(v).replace(/[^0-9.]/g, "");
  if (!n) return "";
  return Number(n).toLocaleString("en-US");
}

function fmtRelTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 7) return d + "d ago";
  return new Date(ts).toLocaleDateString();
}

/* ---------------- Inline & Field Inputs ---------------- */

function InlineInput({ value, onChange, placeholder, type = "text", minCh = 7, money = false }) {
  const display = money ? fmtMoney(value) : (value ?? "");
  const len = display.toString().length;
  const ch = Math.max(minCh, Math.min(len + 2, 28));
  return (
    <input
      type="text"
      inputMode={type === "number" || money ? "decimal" : type === "tel" ? "tel" : "text"}
      value={display}
      onChange={(e) => {
        const v = money ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value;
        onChange(v);
      }}
      placeholder={placeholder}
      className="inline-block px-2 py-0.5 mx-0.5 rounded-md bg-amber-50 border border-amber-200 text-stone-900 font-mono text-[0.95em] align-baseline focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:bg-white transition"
      style={{ width: `${ch}ch`, minWidth: "5ch" }}
    />
  );
}

function InlineSelect({ value, onChange, options, placeholder = "Select" }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="inline-block px-2 py-0.5 mx-0.5 rounded-md bg-amber-50 border border-amber-200 text-stone-900 font-mono text-[0.95em] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FieldChips({ label, items = [], onAdd, onRemove, placeholder, icon: Icon }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t) { onAdd(t); setDraft(""); }
  };
  return (
    <div className="my-3 p-3 rounded-xl bg-white border border-stone-200">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
        {Icon && <Icon size={13} />}
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
        {items.length === 0 && <span className="text-stone-400 text-sm italic">None yet</span>}
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
            {item}
            <button onClick={() => onRemove(i)} className="hover:bg-emerald-200 rounded-full p-0.5 -mr-1">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
        />
        <button onClick={add} className="px-4 py-2 rounded-lg bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 active:scale-95 transition">
          Add
        </button>
      </div>
    </div>
  );
}

/* ---------------- Underwriting Follow-ups ---------------- */

function MultiPicker({ value = [], onChange, options }) {
  const arr = Array.isArray(value) ? value : [];
  const toggle = (o) => {
    if (arr.includes(o)) onChange(arr.filter((x) => x !== o));
    else onChange([...arr, o]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = arr.includes(o);
        return (
          <button
            key={o}
            onClick={() => toggle(o)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition active:scale-95 ${
              active
                ? "bg-emerald-800 text-white border-emerald-800"
                : "bg-white text-stone-700 border-stone-300 hover:border-emerald-700"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function UnderwritingCard({ uw, answers = {}, onChange }) {
  const set = (qid, val) => onChange({ ...answers, [qid]: val });
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-100/60 border-b border-amber-200 flex items-center gap-2">
        <Stethoscope size={14} className="text-amber-900" />
        <h4 className="font-fraunces text-base font-semibold text-amber-950">{uw.name}</h4>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          Carrier follow-ups
        </span>
      </div>
      <div className="p-4 space-y-3">
        {uw.questions.map((q) => {
          const val = answers[q.id];
          return (
            <div key={q.id}>
              <div className="flex items-start gap-1.5 mb-1.5">
                <span className="text-amber-700 mt-0.5">›</span>
                <label className="text-sm text-stone-800 leading-snug">
                  <span className="text-amber-900 font-semibold">Ask: </span>
                  {q.label}
                </label>
              </div>
              <div className="ml-4">
                {q.kind === "text" && (
                  <div className="relative">
                    <input
                      type="text"
                      value={val || ""}
                      onChange={(e) => set(q.id, e.target.value)}
                      placeholder={q.placeholder || ""}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-200"
                    />
                    {q.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-mono">
                        {q.suffix}
                      </span>
                    )}
                  </div>
                )}
                {q.kind === "select" && (
                  <select
                    value={val || ""}
                    onChange={(e) => set(q.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-200"
                  >
                    <option value="">Select…</option>
                    {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {q.kind === "multi" && (
                  <MultiPicker
                    value={val || []}
                    onChange={(v) => set(q.id, v)}
                    options={q.options}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnderwritingPanel({ conditions, answers, onChange, label = "Carrier Underwriting Follow-ups" }) {
  const detected = detectUnderwriting(conditions);
  if (detected.length === 0) return null;
  return (
    <div className="my-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800/90 px-1">
        <ClipboardList size={13} />
        <span>{label}</span>
        <span className="text-stone-400 font-normal normal-case tracking-normal">
          · {detected.length} detected
        </span>
      </div>
      {detected.map((uw) => (
        <UnderwritingCard
          key={uw.id}
          uw={uw}
          answers={answers?.[uw.id] || {}}
          onChange={(v) => onChange({ ...answers, [uw.id]: v })}
        />
      ))}
    </div>
  );
}

/* ---------------- Status Pill & Lead Card ---------------- */

function StatusPill({ status, size = "sm" }) {
  const s = STATUSES[status] || STATUSES["new"];
  const cls = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cls} ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.short}
    </span>
  );
}

function LeadCard({ lead, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-700 hover:shadow-md transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-fraunces text-lg font-semibold text-stone-900 leading-tight truncate">
            {lead.firstName || "Unnamed"} {lead.lastName}
          </div>
          {lead.phone && (
            <div className="text-sm text-stone-500 font-mono mt-0.5">{lead.phone}</div>
          )}
        </div>
        <StatusPill status={lead.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
        {lead.mortgageAmount && (
          <span className="inline-flex items-center gap-1">
            <DollarSign size={12} />
            <span className="font-mono">{fmtMoney(lead.mortgageAmount)}</span>
          </span>
        )}
        {lead.address && (
          <span className="inline-flex items-center gap-1 min-w-0 truncate">
            <MapPin size={12} />
            <span className="truncate">{lead.address}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 ml-auto">
          <Clock size={12} />
          {fmtRelTime(lead.updatedAt)}
        </span>
      </div>
    </button>
  );
}

function FilterBar({ counts, current, onChange }) {
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="-mx-4 px-4 overflow-x-auto pb-1">
      <div className="flex gap-2 w-max">
        <button
          onClick={() => onChange("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
            current === "all" ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-700"
          }`}
        >
          All <span className="opacity-60 ml-1">{all}</span>
        </button>
        {STATUS_ORDER.map((s) => {
          const c = counts[s] || 0;
          const active = current === s;
          const st = STATUSES[s];
          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                active ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-700"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.short}
              <span className="opacity-60">{c}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function NumField({ label, value, onChange, placeholder, money = false, textType = false }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">{label}</div>
      <input
        type="text"
        inputMode={textType ? "text" : "decimal"}
        value={money ? fmtMoney(value) : (value || "")}
        onChange={(e) => {
          const v = money ? e.target.value.replace(/[^0-9.]/g, "")
                : textType ? e.target.value
                : e.target.value.replace(/[^0-9.]/g, "");
          onChange(v);
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-sm font-mono focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-200"
      />
    </div>
  );
}

/* ---------------- New Lead Modal ---------------- */

function NewLeadModal({ onSave, onClose }) {
  const [data, setData] = useState({
    firstName: "", lastName: "", phone: "", address: "",
    mortgageAmount: "", age: "",
  });
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const canSave = data.firstName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-stone-50 w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-stone-50 px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-fraunces text-xl font-semibold text-stone-900">New Lead</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-stone-200 active:scale-95">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="First Name *">
            <input
              autoFocus
              type="text"
              value={data.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="Eddie"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
            />
          </Field>
          <Field label="Last Name">
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Surname"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              inputMode="tel"
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
            />
          </Field>
          <Field label="Address">
            <input
              type="text"
              value={data.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="1017 Steeplechase Dr"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mortgage Amount">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fmtMoney(data.mortgageAmount)}
                  onChange={(e) => set("mortgageAmount", e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="569,500"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </Field>
            <Field label="Age">
              <input
                type="text"
                inputMode="numeric"
                value={data.age}
                onChange={(e) => set("age", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="64"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
              />
            </Field>
          </div>
        </div>
        <div className="sticky bottom-0 bg-stone-50 px-5 py-4 border-t border-stone-200 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-stone-300 bg-white font-semibold text-stone-700 hover:bg-stone-100 active:scale-95">
            Cancel
          </button>
          <button
            disabled={!canSave}
            onClick={() => onSave(data)}
            className="flex-1 py-3 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            Save Lead
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Underwriting Reference Sheet ---------------- */

function UnderwritingRefSheet({ onClose }) {
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState("");
  const items = filter
    ? UNDERWRITING.filter((u) => u.name.toLowerCase().includes(filter.toLowerCase()))
    : UNDERWRITING;
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-stone-50 w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col">
        <div className="sticky top-0 bg-stone-50 px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="font-fraunces text-xl font-semibold text-stone-900">Carrier Cheat Sheet</h2>
            <p className="text-xs text-stone-500">Common underwriting follow-ups by condition</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-stone-200">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search conditions..."
              className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white border border-stone-200 text-sm focus:outline-none focus:border-emerald-700"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.map((uw) => {
            const isOpen = open === uw.id;
            return (
              <div key={uw.id} className="rounded-xl bg-white border border-stone-200 overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : uw.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-stone-50"
                >
                  <span className="font-fraunces font-semibold text-stone-900">{uw.name}</span>
                  {isOpen ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                </button>
                {isOpen && (
                  <ul className="px-4 pb-3 pt-1 space-y-1.5 border-t border-stone-100">
                    {uw.questions.map((q) => (
                      <li key={q.id} className="text-sm text-stone-700 flex items-start gap-1.5">
                        <span className="text-amber-700 mt-0.5">›</span>
                        <span>{q.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- The B.E.S.T. Script ---------------- */

function ScriptSection({ title, num, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-stone-200 first:border-t-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <div className="flex items-baseline gap-3">
          {num && <span className="font-mono text-xs text-amber-700 font-semibold">{num}</span>}
          <h3 className="font-fraunces text-base font-semibold text-stone-900 tracking-tight">{title}</h3>
        </div>
        {open ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function Stage(props) {
  return <span className="font-bold text-emerald-900">{props.children}</span>;
}

function BestScript({ lead, update, agentName, onOpenRef }) {
  const u = (k) => (v) => update(k, v);
  return (
    <div className="text-stone-800 leading-relaxed text-[15px]">
      <ScriptSection title="Opening">
        <p className="my-2">
          Hey, <InlineInput value={lead.firstName} onChange={u("firstName")} placeholder="First Name" />.
        </p>
        <p className="my-2 italic text-stone-500">(Wait for response)</p>
        <p className="my-2">
          Hey, this is <span className="font-semibold">{agentName || "Gavin Morel"}</span>. I'm calling
          about your mortgage in the amount of $<InlineInput value={lead.mortgageAmount} onChange={u("mortgageAmount")} placeholder="Amount" money />
          {" "}over at <InlineInput value={lead.address} onChange={u("address")} placeholder="Address" minCh={14} />.
        </p>
        <p className="my-2"><Stage>[Pause and wait for response.]</Stage></p>
        <p className="my-2">
          I was getting back to you about the request for <span className="font-semibold">Mortgage Protection</span> coverage that is designed to pay your mortgage in the event of a death or disability. I just need to quickly verify some of the information you provided so we can get those options out to you.
        </p>
        <p className="my-2"><Stage>[Start filling out a client qualification form.]</Stage></p>
        <p className="my-2">
          I have here your age as <InlineInput value={lead.age} onChange={u("age")} placeholder="Age" type="number" minCh={4} />. Is that correct?
        </p>
      </ScriptSection>

      <ScriptSection title="Tobacco" num="Q1">
        <p className="my-2">Have you used any nicotine or tobacco in the last 12 months?</p>
        <div className="my-2">
          <InlineSelect value={lead.tobacco} onChange={u("tobacco")} options={TOBACCO_OPTIONS} placeholder="Select status" />
        </div>
      </ScriptSection>

      <ScriptSection title="Health & Family History" num="Q2">
        <p className="my-2">
          How's your health, are you in pretty good health? What medications does your doctor have you on?
          How about hospital stays, ambulance rides or major surgeries for you in the past 10 years or so?
          And how about <span className="font-semibold">your spouse</span>, anything for them?
          Is there any history of things like High Blood Pressure, Diabetes, Cancer or heart attack for either of you?
        </p>
        <FieldChips
          label="Medications"
          items={lead.medications}
          onAdd={(v) => update("medications", [...(lead.medications || []), v])}
          onRemove={(i) => update("medications", lead.medications.filter((_, idx) => idx !== i))}
          placeholder="e.g. Lisinopril 10mg"
          icon={Pill}
        />
        <FieldChips
          label="Conditions / History"
          items={lead.conditions}
          onAdd={(v) => update("conditions", [...(lead.conditions || []), v])}
          onRemove={(i) => update("conditions", lead.conditions.filter((_, idx) => idx !== i))}
          placeholder="e.g. Diabetes, High BP, Stent"
          icon={Heart}
        />

        {/* Auto-detected carrier follow-ups */}
        <UnderwritingPanel
          conditions={[...(lead.conditions || []), ...(lead.medications || [])]}
          answers={lead.underwritingAnswers || {}}
          onChange={(v) => update("underwritingAnswers", v)}
        />

        <button
          onClick={onOpenRef}
          className="my-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-200"
        >
          <ClipboardList size={14} />
          Open Carrier Cheat Sheet
        </button>

        <p className="my-2 mt-4">What's your height and weight?</p>
        <div className="grid grid-cols-3 gap-2 my-2">
          <NumField label="Feet" value={lead.heightFeet} onChange={u("heightFeet")} placeholder="5" />
          <NumField label="Inches" value={lead.heightInches} onChange={u("heightInches")} placeholder="10" />
          <NumField label="Weight (lbs)" value={lead.weight} onChange={u("weight")} placeholder="180" />
        </div>

        {!lead.hasSpouse ? (
          <button
            onClick={() => update("hasSpouse", true)}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold hover:bg-emerald-100"
          >
            <Plus size={14} /> Add Spouse
          </button>
        ) : (
          <div className="mt-3 p-3 rounded-xl bg-stone-100 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-2">
                <Users size={13} /> Spouse Details
              </div>
              <button onClick={() => update("hasSpouse", false)} className="text-stone-400 hover:text-rose-600 p-1">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <NumField label="Spouse Name" value={lead.spouseFirstName} onChange={u("spouseFirstName")} placeholder="First name" textType />
              <NumField label="Spouse Age" value={lead.spouseAge} onChange={u("spouseAge")} placeholder="62" />
            </div>
            <FieldChips
              label="Spouse Medications"
              items={lead.spouseMedications}
              onAdd={(v) => update("spouseMedications", [...(lead.spouseMedications || []), v])}
              onRemove={(i) => update("spouseMedications", lead.spouseMedications.filter((_, idx) => idx !== i))}
              placeholder="Medication"
              icon={Pill}
            />
            <FieldChips
              label="Spouse Conditions"
              items={lead.spouseConditions}
              onAdd={(v) => update("spouseConditions", [...(lead.spouseConditions || []), v])}
              onRemove={(i) => update("spouseConditions", lead.spouseConditions.filter((_, idx) => idx !== i))}
              placeholder="Condition"
              icon={Heart}
            />

            <UnderwritingPanel
              conditions={[...(lead.spouseConditions || []), ...(lead.spouseMedications || [])]}
              answers={lead.spouseUnderwritingAnswers || {}}
              onChange={(v) => update("spouseUnderwritingAnswers", v)}
              label="Spouse — Carrier Follow-ups"
            />
          </div>
        )}
      </ScriptSection>

      <ScriptSection title="Occupation" num="Q3">
        <p className="my-2">
          What do you do for work, anything dangerous, like a stunt man/rodeo clown? <Stage>[Get a laugh]</Stage>
          {" "}What does your work schedule look like? (M-F 9-5?) What about your spouse?
        </p>
        <div className="grid sm:grid-cols-2 gap-2 my-2">
          <NumField label="Occupation" value={lead.occupation} onChange={u("occupation")} placeholder="Engineer" textType />
          <NumField label="Schedule" value={lead.workSchedule} onChange={u("workSchedule")} placeholder="M-F 9-5" textType />
          {lead.hasSpouse && (
            <NumField label="Spouse Work" value={lead.spouseOccupation} onChange={u("spouseOccupation")} placeholder="Teacher" textType />
          )}
        </div>
      </ScriptSection>

      <ScriptSection title="Mortgage Details" num="Q4">
        <p className="my-2">
          It says the amount of the mortgage to be covered is $<InlineInput value={lead.mortgageAmount} onChange={u("mortgageAmount")} money placeholder="Amount" />
          {" "}is this correct? What is your monthly payment? Is that a 15-year or a 30-year?
        </p>
        <div className="grid grid-cols-2 gap-2 my-2">
          <NumField label="Monthly Payment ($)" value={lead.monthlyPayment} onChange={u("monthlyPayment")} placeholder="2,400" money />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">Term</div>
            <select
              value={lead.mortgageTerm || ""}
              onChange={(e) => update("mortgageTerm", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:border-emerald-700"
            >
              <option value="">Select term</option>
              {TERM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </ScriptSection>

      <ScriptSection title="Main Concern" num="Q5">
        <p className="my-2">
          Most importantly, when you sent in the form, what was your main concern? Was it mostly for coverage on you?
        </p>
        <p className="my-2"><Stage>[Repeat back what you hear.]</Stage></p>
        <textarea
          value={lead.mainConcern || ""}
          onChange={(e) => update("mainConcern", e.target.value)}
          placeholder="What did they say their main concern is?"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-200"
        />
      </ScriptSection>

      <ScriptSection title="Set the Appointment">
        <p className="my-2">
          Ok that makes a lot of sense. I'm going to do some homework for you and shop around with several
          of our top-rated carriers. Once I get the best options narrowed down, you and I will connect for
          a few minutes to review these options. Your job will be to pick out a plan that fits your needs
          and budget.
        </p>
        <p className="my-2 mt-4 font-fraunces font-semibold text-stone-900 text-base">Tie Down</p>
        <p className="my-2">
          I have a crazy schedule this week, I'm working with a handful of families in your area on
          {" "}<Stage>[book within 48 hours]</Stage> and I have a <Stage>[Give Two Times]</Stage> appointment available.
          {" "}<Stage>[Give alternate choice — two options]</Stage>
        </p>
        <p className="my-2">Which of those times work best for you? <Stage>[Wait for response.]</Stage></p>
        <p className="my-2">Okay so you're positive that time works for you?</p>
        <p className="my-2">
          Okay grab a pen and paper and let me know when you're ready. I am going to give you my information
          and a few things to have ready for our appointment.
        </p>
        <p className="my-2">
          My name is <span className="font-semibold">{agentName || "Gavin"}</span> and what time did we say again?
        </p>
        <p className="my-2">Okay perfect.</p>
        <p className="my-2">We will also need:</p>
        <ul className="my-2 ml-5 list-disc space-y-1">
          <li>Identification</li>
          <li>Doctor's info</li>
          <li>Medications</li>
        </ul>
        <p className="my-2 mt-4">
          Okay I have us for <InlineInput value={lead.appointmentDay} onChange={u("appointmentDay")} placeholder="Day" minCh={10} />
          {" "}at <InlineInput value={lead.appointmentTime} onChange={u("appointmentTime")} placeholder="Time" minCh={8} />?
          Sometimes the families that I am working with need a little extra time with me. Give me a 15-30 minute
          window and I will make sure I give you the time you need as well. If I am running more than 30 minutes
          behind, I will give you a call.
        </p>
        <p className="my-2">
          Have a great rest of your day and I will look forward to seeing you on
          {" "}<span className="font-semibold">{lead.appointmentDay || "[day]"}</span> at
          {" "}<span className="font-semibold">{lead.appointmentTime || "[time]"}</span>.
        </p>
      </ScriptSection>
    </div>
  );
}

/* ---------------- Call View ---------------- */

function CallView({ lead, onUpdate, onBack, onDelete, agentName, onOpenRef }) {
  const [tab, setTab] = useState("script");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (lead.updatedAt && Date.now() - lead.updatedAt < 1500) {
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 1500);
      return () => clearTimeout(t);
    }
  }, [lead.updatedAt]);

  const update = (key, value) => onUpdate({ ...lead, [key]: value, updatedAt: Date.now() });
  const setStatus = (status) => onUpdate({ ...lead, status, updatedAt: Date.now() });

  return (
    <div className="min-h-screen bg-stone-50 pb-40">
      <div className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur border-b border-stone-200">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-stone-200 active:scale-95">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-fraunces text-lg font-semibold text-stone-900 truncate leading-tight">
              {lead.firstName || "Unnamed Lead"} {lead.lastName}
            </div>
            <div className="text-xs text-stone-500 flex items-center gap-2">
              <StatusPill status={lead.status} />
              {savedFlash && (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 size={12} /> Saved
                </span>
              )}
            </div>
          </div>
          {lead.phone && (
            <a
              href={`tel:${lead.phone.replace(/[^0-9+]/g, "")}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 active:scale-95"
            >
              <PhoneCall size={14} /> Call
            </a>
          )}
        </div>

        <div className="px-4 flex gap-1 -mb-px">
          {[
            { id: "script", label: "B.E.S.T. Script", icon: FileText },
            { id: "info", label: "Lead Info", icon: User },
            { id: "notes", label: "Notes", icon: NotebookPen },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
                tab === t.id
                  ? "border-emerald-800 text-emerald-900"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        {tab === "script" && (
          <BestScript lead={lead} update={update} agentName={agentName} onOpenRef={onOpenRef} />
        )}
        {tab === "info" && (
          <LeadInfoEditor lead={lead} update={update} onDelete={onDelete} />
        )}
        {tab === "notes" && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Call Notes
            </div>
            <textarea
              value={lead.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Write anything important from this call..."
              rows={16}
              className="w-full p-4 rounded-xl border border-stone-300 bg-white text-[15px] leading-relaxed focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-200"
            />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto px-3 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5 text-center">
            Disposition
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "application", label: "Application" },
              { id: "appointment", label: "Appointment" },
              { id: "call-back", label: "Call Back" },
              { id: "no-contact", label: "No Contact" },
              { id: "no-engagement", label: "No Engage" },
              { id: "not-interested", label: "Not Interested" },
            ].map((b) => {
              const active = lead.status === b.id;
              const s = STATUSES[b.id];
              return (
                <button
                  key={b.id}
                  onClick={() => setStatus(b.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                    active
                      ? `${s.bg} ${s.text} ring-2 ring-offset-1 ${s.ring}`
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadInfoEditor({ lead, update, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <NumField label="First Name" value={lead.firstName} onChange={(v) => update("firstName", v)} placeholder="Eddie" textType />
        <NumField label="Last Name" value={lead.lastName} onChange={(v) => update("lastName", v)} placeholder="Smith" textType />
      </div>
      <NumField label="Phone" value={lead.phone} onChange={(v) => update("phone", v)} placeholder="(555) 123-4567" textType />
      <NumField label="Address" value={lead.address} onChange={(v) => update("address", v)} placeholder="1017 Steeplechase Dr" textType />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Mortgage Amount" value={lead.mortgageAmount} onChange={(v) => update("mortgageAmount", v)} placeholder="569500" money />
        <NumField label="Age" value={lead.age} onChange={(v) => update("age", v)} placeholder="64" />
      </div>

      <div className="pt-6">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-100"
          >
            <Trash2 size={14} /> Delete Lead
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-sm text-rose-900 font-semibold mb-2">Delete this lead permanently?</div>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 px-3 py-2 rounded-lg bg-white border border-stone-300 text-sm font-semibold">
                Cancel
              </button>
              <button onClick={onDelete} className="flex-1 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700">
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsModal({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile.agentName || "");
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-stone-50 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-fraunces text-xl font-semibold text-stone-900">Your Profile</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-stone-200">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">
          <Field label="Your Name (used in scripts)">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gavin Morel"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
            />
          </Field>
        </div>
        <div className="px-5 py-4 border-t border-stone-200 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-stone-300 bg-white font-semibold text-stone-700">
            Cancel
          </button>
          <button onClick={() => { onSave({ agentName: name }); onClose(); }} className="flex-1 py-3 rounded-xl bg-emerald-800 text-white font-semibold">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, accent }) {
  const accentMap = {
    emerald: "text-emerald-800",
    amber: "text-amber-800",
  };
  return (
    <div className="rounded-2xl bg-white border border-stone-200 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">{label}</div>
      <div className={`font-fraunces text-2xl font-semibold ${accentMap[accent] || "text-stone-900"} leading-tight`}>
        {value}
      </div>
    </div>
  );
}

/* ---------------- Main App ---------------- */

export default function App() {
  const [view, setView] = useState("list");
  const [leads, setLeads] = useState([]);
  const [profile, setProfile] = useState({ agentName: "Gavin Morel" });
  const [currentId, setCurrentId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) {
          const parsed = JSON.parse(res.value);
          setLeads(parsed.leads || []);
        }
      } catch (e) { /* first run */ }
      try {
        const p = await window.storage.get(PROFILE_KEY);
        if (p?.value) setProfile(JSON.parse(p.value));
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  const saveTimer = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ leads }));
      } catch (e) { console.error("Save failed", e); }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [leads, loaded]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
    })();
  }, [profile, loaded]);

  const counts = useMemo(() => {
    const c = {};
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    leads.forEach((l) => { c[l.status] = (c[l.status] || 0) + 1; });
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    let out = leads;
    if (filter !== "all") out = out.filter((l) => l.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((l) =>
        (l.firstName || "").toLowerCase().includes(q) ||
        (l.lastName || "").toLowerCase().includes(q) ||
        (l.phone || "").includes(q) ||
        (l.address || "").toLowerCase().includes(q)
      );
    }
    return out.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  }, [leads, filter, search]);

  const currentLead = leads.find((l) => l.id === currentId);

  const handleNewLead = (data) => {
    const lead = makeLead(data);
    setLeads((ls) => [lead, ...ls]);
    setShowNew(false);
    setCurrentId(lead.id);
    setView("call");
  };

  const handleUpdateLead = (updated) => {
    setLeads((ls) => ls.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleDeleteLead = () => {
    setLeads((ls) => ls.filter((l) => l.id !== currentId));
    setCurrentId(null);
    setView("list");
  };

  const seedDemo = () => {
    const demo = makeLead({
      firstName: "Eddie",
      lastName: "Castillo",
      phone: "(555) 318-2049",
      address: "1017 Steeplechase Dr",
      mortgageAmount: "569500",
      age: "64",
      tobacco: "Non-Tobacco",
      conditions: ["Type 2 Diabetes", "High Blood Pressure"],
      medications: ["Metformin 500mg", "Lisinopril 10mg"],
    });
    setLeads((ls) => [demo, ...ls]);
  };

  return (
    <>
      <div className="min-h-screen bg-stone-50" style={{ background: "#F7F4ED" }}>
        {view === "list" && (
          <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-800/80 mb-0.5">
                  Mortgage Protection
                </div>
                <h1 className="font-fraunces text-3xl font-semibold text-stone-900 tracking-tight leading-none">
                  Lead Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRef(true)}
                  className="p-2.5 rounded-full bg-white border border-stone-200 hover:bg-stone-100"
                  aria-label="Underwriting cheat sheet"
                  title="Carrier cheat sheet"
                >
                  <ClipboardList size={18} className="text-stone-700" />
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2.5 rounded-full bg-white border border-stone-200 hover:bg-stone-100"
                  aria-label="Settings"
                >
                  <Settings size={18} className="text-stone-700" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <StatBlock label="Total" value={leads.length} />
              <StatBlock
                label="Appts"
                value={counts["appointment"] + counts["application"]}
                accent="emerald"
              />
              <StatBlock label="Callbacks" value={counts["call-back"]} accent="amber" />
            </div>

            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="w-full pl-9 pr-9 py-2.5 rounded-full bg-white border border-stone-200 text-sm focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="mb-4">
              <FilterBar counts={counts} current={filter} onChange={setFilter} />
            </div>

            {loaded && filtered.length === 0 && (
              <div className="text-center py-16 px-6">
                <div className="inline-flex p-4 rounded-full bg-amber-50 border border-amber-200 mb-4">
                  <Phone size={24} className="text-amber-800" />
                </div>
                <h3 className="font-fraunces text-xl font-semibold text-stone-900 mb-1">
                  {leads.length === 0 ? "Ready to dial" : "No leads match"}
                </h3>
                <p className="text-stone-500 text-sm mb-4">
                  {leads.length === 0
                    ? "Add your first lead to start working the script."
                    : "Try a different filter or search term."}
                </p>
                {leads.length === 0 && (
                  <button
                    onClick={seedDemo}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline"
                  >
                    Or add a sample lead with diabetes + HBP to see follow-ups
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2.5">
              {filtered.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => {
                    setCurrentId(lead.id);
                    setView("call");
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setShowNew(true)}
              className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-emerald-800 text-white font-semibold shadow-xl hover:bg-emerald-900 active:scale-95 transition"
              aria-label="Add new lead"
            >
              <Plus size={18} /> New Lead
            </button>
          </div>
        )}

        {view === "call" && currentLead && (
          <CallView
            lead={currentLead}
            onUpdate={handleUpdateLead}
            onBack={() => setView("list")}
            onDelete={handleDeleteLead}
            agentName={profile.agentName}
            onOpenRef={() => setShowRef(true)}
          />
        )}

        {showNew && (
          <NewLeadModal onSave={handleNewLead} onClose={() => setShowNew(false)} />
        )}
        {showSettings && (
          <SettingsModal profile={profile} onSave={setProfile} onClose={() => setShowSettings(false)} />
        )}
        {showRef && (
          <UnderwritingRefSheet onClose={() => setShowRef(false)} />
        )}
      </div>
    </>
  );
}

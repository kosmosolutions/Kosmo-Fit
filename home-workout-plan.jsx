import { useState, useMemo } from "react";

// ── ACTIVITY (outside the gym only) ───────────────────────────────────────
const ACTIVITY = [
  { key: "desk",    label: "Desk Job",    desc: "Mostly sitting",     mult: 1.2  },
  { key: "light",   label: "Light",       desc: "Some walking",       mult: 1.3  },
  { key: "active",  label: "Active Job",  desc: "On feet most of day",mult: 1.4  },
];

const TIMEFRAMES = [12, 16, 20, 24, 30];

// ── GYM calorie burns per day (midpoint estimates for 200 lb man) ──────────
const BURNS = {
  gym:  [340, 400, 395, 270, 530, 290],   // Days 1–6
  home: [320, 385, 375, 250, 510, 360],
};
const DAY_LABELS = ["Shoulders","Back","Chest","Arms","Legs","Cardio"];

// ── CALCULATIONS ───────────────────────────────────────────────────────────
function calcStats(p, mode) {
  const kg  = p.weight   * 0.453592;
  const cm  = (p.heightFt * 12 + p.heightIn) * 2.54;
  const bmr = Math.round(10 * kg + 6.25 * cm - 5 * p.age + 5);

  const act      = ACTIVITY.find(a => a.key === p.activity) || ACTIVITY[0];
  const lifeTDEE = Math.round(bmr * act.mult);   // no gym counted here

  const lbsToLose    = Math.max(0, p.weight - p.goalWeight);
  const weeklyDeficit = lbsToLose * 3500 / p.weeks;
  const dailyDeficit  = Math.round(weeklyDeficit / 7);
  const weeklyLoss    = parseFloat((weeklyDeficit / 3500).toFixed(1));
  const aggressive    = dailyDeficit > 1000 || weeklyLoss > 2;

  const burns = BURNS[mode];

  // Each day's calorie target = lifeTDEE + workout burn - daily deficit
  const dayTargets = burns.map(b => Math.max(1400, lifeTDEE + b - dailyDeficit));
  const restTarget = Math.max(1400, lifeTDEE - dailyDeficit);

  const avgWorkoutTarget = Math.round(dayTargets.reduce((a, b) => a + b, 0) / dayTargets.length);

  // Macros — protein fixed at 0.9g/lb; fat 27%; carbs fill the rest
  const proteinG   = Math.round(p.weight * 0.9);
  const proteinCal = proteinG * 4;

  function macros(target) {
    const fatG   = Math.round(target * 0.27 / 9);
    const fatCal = fatG * 9;
    const carbG  = Math.round(Math.max(0, target - proteinCal - fatCal) / 4);
    return { fatG, fatCal, carbG, carbCal: carbG * 4 };
  }

  const weeklyBurn = burns.reduce((s, b) => s + b, 0);

  return {
    bmr, lifeTDEE, dailyDeficit, weeklyLoss, aggressive,
    dayTargets, restTarget, avgWorkoutTarget,
    lbsToLose, weeklyBurn, burns,
    proteinG, proteinCal,
    restMacros:    macros(restTarget),
    workoutMacros: macros(avgWorkoutTarget),
  };
}

// ── WORKOUT DATA ───────────────────────────────────────────────────────────
const gymDays = [
  { day:"Day 1", weekday:"Wed", focus:"Shoulders + Abs", icon:"🏋️", color:"#38bdf8", duration:"~55 min", epoc:false,
    calNote:"Shoulder isolation — moderate intensity. Abs add little.",
    exercises:[
      {name:"Seated Shoulder Press",sets:"10, 8, 8, 6"},
      {name:"DB Lateral Raise",sets:"15, 12, 12, 10"},
      {name:"Reverse Pec Deck",sets:"15, 12, 12, 10"},
      {name:"Upright Row",sets:"10, 10, 8"},
      {name:"Hanging Leg Raise",sets:"15, 15, 12"},
      {name:"Cable Crunch",sets:"20, 15, 15"},
    ]},
  { day:"Day 2", weekday:"Thu", focus:"Back + Biceps", icon:"💪", color:"#a78bfa", duration:"~60 min", epoc:true,
    calNote:"Large back muscles = high burn. EPOC adds 10–15% for hours after.",
    exercises:[
      {name:"Pull-Ups / Lat Pulldown",sets:"12, 10, 10, 8"},
      {name:"Barbell Row",sets:"10, 8, 8, 6"},
      {name:"Seated Cable Row",sets:"12, 10, 8, 8"},
      {name:"Dumbbell Pullover",sets:"12, 10, 8"},
      {name:"Barbell Curl",sets:"10, 8, 8, 6"},
      {name:"Incline Dumbbell Curl",sets:"12, 10, 8"},
    ]},
  { day:"Day 3", weekday:"Fri", focus:"Chest + Triceps", icon:"🫁", color:"#f87171", duration:"~60 min", epoc:true,
    calNote:"Compound pressing is energy-demanding. EPOC afterburn applies.",
    exercises:[
      {name:"Flat Bench Press",sets:"8, 10, 8, 6"},
      {name:"Incline Dumbbell Press",sets:"10, 10, 8, 8"},
      {name:"Cable Fly / Pec Deck",sets:"15, 12, 12, 10"},
      {name:"Tricep Pushdown",sets:"12, 10, 10, 8"},
      {name:"Overhead DB Extension",sets:"12, 10, 8"},
      {name:"Dips",sets:"3 sets to failure"},
    ]},
  { day:"Day 4", weekday:"Sat", focus:"Arms", icon:"💥", color:"#fb923c", duration:"~50 min", epoc:false,
    calNote:"Isolation exercises use smaller muscles — lowest burn day.",
    exercises:[
      {name:"Close-Grip Bench Press",sets:"10, 8, 8, 6"},
      {name:"Tricep Pushdown",sets:"12, 10, 10, 8"},
      {name:"Skull Crushers",sets:"10, 8, 8"},
      {name:"Barbell Curl",sets:"10, 8, 8, 6"},
      {name:"Hammer Curl",sets:"12, 10, 10"},
      {name:"Preacher Curl",sets:"12, 10, 8"},
    ]},
  { day:"Day 5", weekday:"Sun", focus:"Legs", icon:"🦵", color:"#4ade80", duration:"~65 min", epoc:true,
    calNote:"Highest burn — squats, lunges & RDLs crush your biggest muscles. EPOC adds 10–15% after.",
    exercises:[
      {name:"Barbell Squat / Leg Press",sets:"10, 8, 8, 6"},
      {name:"Walking Lunges",sets:"12 each leg x 3"},
      {name:"Leg Extension",sets:"15, 12, 10, 10"},
      {name:"Lying Leg Curl",sets:"12, 10, 10, 8"},
      {name:"Romanian Deadlift",sets:"10, 8, 8"},
      {name:"Standing Calf Raise",sets:"20, 15, 15"},
    ]},
  { day:"Day 6", weekday:"Mon", focus:"Cardio", icon:"🚶", color:"#fbbf24", duration:"30–45 min", epoc:false,
    calNote:"Steady incline walk. HIIT burns extra + afterburn on top.",
    exercises:[
      {name:"Incline Walk / Treadmill",sets:"30–45 mins",note:"Zone 2 pace"},
    ]},
];

const homeDays = [
  { day:"Day 1", weekday:"Wed", focus:"Shoulders + Abs", icon:"🏋️", color:"#38bdf8", duration:"~55 min", epoc:false,
    cardio:"10–15 min YESOUL · +80–110 cal",
    calNote:"Shoulder isolation — moderate intensity.",
    exercises:[
      {name:"DB Seated Shoulder Press",sets:"10, 8, 8, 6",note:"Bench upright"},
      {name:"DB Lateral Raise",sets:"15, 12, 12, 10",note:"Slow & controlled"},
      {name:"DB Front Raise",sets:"15, 12, 12, 10",note:"Replaces Pec Deck"},
      {name:"DB Upright Row",sets:"10, 10, 8",note:"Wide grip"},
      {name:"Lying Leg Raise",sets:"15, 15, 12",note:"Bench or floor"},
      {name:"DB Weighted Crunch",sets:"20, 15, 15",note:"DB on chest"},
    ]},
  { day:"Day 2", weekday:"Thu", focus:"Back + Biceps", icon:"💪", color:"#a78bfa", duration:"~60 min", epoc:true,
    cardio:"10–15 min YESOUL · +80–110 cal",
    calNote:"Large back muscles = high burn. EPOC adds 10–15% after.",
    exercises:[
      {name:"DB Bent-Over Row",sets:"12, 10, 10, 8",note:"Replaces Lat Pulldown"},
      {name:"Single-Arm DB Row",sets:"10, 8, 8, 6",note:"Brace on bench"},
      {name:"DB Seal Row",sets:"12, 10, 8, 8",note:"Face down on bench"},
      {name:"DB Pullover",sets:"12, 10, 8",note:"Full stretch"},
      {name:"DB Bicep Curl",sets:"10, 8, 8, 6",note:"Slow eccentric"},
      {name:"Incline DB Curl",sets:"12, 10, 8",note:"Bench at 45°"},
    ]},
  { day:"Day 3", weekday:"Fri", focus:"Chest + Triceps", icon:"🫁", color:"#f87171", duration:"~60 min", epoc:true,
    cardio:"10–15 min YESOUL · +80–110 cal",
    calNote:"DB pressing and compound movements are energy-demanding.",
    exercises:[
      {name:"DB Flat Bench Press",sets:"8, 10, 8, 6",note:"Full ROM"},
      {name:"DB Incline Bench Press",sets:"10, 10, 8, 8",note:"30–45° angle"},
      {name:"DB Chest Fly",sets:"15, 12, 12, 10",note:"Replaces Cable Fly"},
      {name:"DB Tricep Kickback",sets:"12, 10, 10, 8",note:"Replaces Pushdown"},
      {name:"DB Overhead Tricep Extension",sets:"12, 10, 8",note:"Both hands on DB"},
      {name:"Diamond Push-Ups",sets:"3 sets to failure",note:"Replaces Dips"},
    ]},
  { day:"Day 4", weekday:"Sat", focus:"Arms", icon:"💥", color:"#fb923c", duration:"~50 min", epoc:false,
    cardio:"10–15 min YESOUL · +80–110 cal",
    calNote:"Isolation exercises — lowest burn day.",
    exercises:[
      {name:"Close-Grip DB Press",sets:"10, 8, 8, 6",note:"Elbows tucked"},
      {name:"DB Tricep Kickback",sets:"12, 10, 10, 8",note:"Hinge at hips"},
      {name:"DB Skull Crushers",sets:"10, 8, 8",note:"Lower to forehead"},
      {name:"DB Bicep Curl",sets:"10, 8, 8, 6",note:"Supinate at top"},
      {name:"DB Hammer Curl",sets:"12, 10, 10",note:"Neutral grip"},
      {name:"DB Concentration Curl",sets:"12, 10, 8",note:"Elbow on knee"},
    ]},
  { day:"Day 5", weekday:"Sun", focus:"Legs", icon:"🦵", color:"#4ade80", duration:"~65 min", epoc:true,
    cardio:"15–20 min YESOUL · +100–140 cal",
    calNote:"Highest burn — goblet squats, lunges & RDLs. EPOC adds 10–15% after.",
    exercises:[
      {name:"DB Goblet Squat",sets:"10, 8, 8, 6",note:"Replaces Barbell Squat"},
      {name:"DB Walking Lunges",sets:"12 each leg x 3",note:"DBs at sides"},
      {name:"DB Bulgarian Split Squat",sets:"15, 12, 10, 10",note:"Rear foot on bench"},
      {name:"DB Romanian Deadlift",sets:"12, 10, 10, 8",note:"Feel hamstring stretch"},
      {name:"DB Stiff-Leg Deadlift",sets:"10, 8, 8",note:"Replaces Leg Curl"},
      {name:"Single-Leg Calf Raise",sets:"20, 15, 15",note:"Slow & full range"},
    ]},
  { day:"Day 6", weekday:"Mon", focus:"Cardio", icon:"🚴", color:"#fbbf24", duration:"30–45 min", epoc:false,
    calNote:"Steady state: 320–400 cal. HIIT (20 min): 250–320 + afterburn.",
    exercises:[
      {name:"YESOUL Bike – Steady State",sets:"30–45 min",note:"Zone 2 heart rate"},
      {name:"YESOUL Bike – HIIT",sets:"20 min",note:"30s hard / 90s easy × 8"},
    ]},
];

// ── RING ──────────────────────────────────────────────────────────────────
function Ring({ pct, color, size, stroke }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(Math.max(pct, 0), 1);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"/>
    </svg>
  );
}

const inp = {
  background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
  borderRadius:"10px", color:"#f0f4ff", fontSize:"15px", fontWeight:"600",
  padding:"10px 12px", width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"inherit",
};

// ── APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,     setTab]     = useState("profile");
  const [mode,    setMode]    = useState("gym");
  const [wDay,    setWDay]    = useState(0);
  const [showCal, setShowCal] = useState(false);

  const [profile, setProfile] = useState({
    weight:80, goalWeight:174, heightFt:6, heightIn:0, age:30, activity:"desk", weeks:20,
  });

  // Pre-fill user's actual stats on mount
  useMemo(() => {
    setProfile(p => ({ ...p, weight: 204, goalWeight: 174 }));
  }, []);

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const s   = useMemo(() => calcStats(profile, mode), [profile, mode]);
  const days = mode === "gym" ? gymDays : homeDays;
  const d    = days[wDay];
  const todayBurn   = s.burns[wDay];
  const todayTarget = s.dayTargets[wDay];

  // ── PROFILE ─────────────────────────────────────────────────────────────
  const ProfileTab = () => (
    <div style={{ padding:"16px" }}>
      <div style={{ marginBottom:"20px" }}>
        <div style={{ fontSize:"11px", color:"#64748b", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"4px" }}>Your Stats</div>
        <div style={{ fontSize:"22px", fontWeight:"800", color:"#f0f4ff" }}>Body Profile</div>
      </div>

      {/* Weight row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        {[
          { label:"Current Weight", key:"weight",     unit:"lbs", color:"#f0f4ff" },
          { label:"Goal Weight",    key:"goalWeight", unit:"lbs", color:"#22d3ee" },
        ].map(f => (
          <div key={f.key} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"14px", padding:"14px" }}>
            <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px" }}>{f.label}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:"4px" }}>
              <input type="number" value={profile[f.key]} min={80} max={500}
                onChange={e => set(f.key, +e.target.value)}
                style={{ ...inp, padding:"4px 0", border:"none", background:"transparent", fontSize:"28px", fontWeight:"900", color:f.color, width:"80px" }}/>
              <span style={{ fontSize:"12px", color:"#64748b" }}>{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Height / Age / To Lose */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"14px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px" }}>Height</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:"3px" }}>
            <input type="number" value={profile.heightFt} min={4} max={7} onChange={e => set("heightFt", +e.target.value)}
              style={{ ...inp, padding:"4px 0", border:"none", background:"transparent", fontSize:"22px", fontWeight:"800", color:"#f0f4ff", width:"30px" }}/>
            <span style={{ fontSize:"11px", color:"#64748b" }}>ft</span>
            <input type="number" value={profile.heightIn} min={0} max={11} onChange={e => set("heightIn", +e.target.value)}
              style={{ ...inp, padding:"4px 0", border:"none", background:"transparent", fontSize:"22px", fontWeight:"800", color:"#f0f4ff", width:"28px" }}/>
            <span style={{ fontSize:"11px", color:"#64748b" }}>in</span>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"14px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px" }}>Age</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:"4px" }}>
            <input type="number" value={profile.age} min={15} max={80} onChange={e => set("age", +e.target.value)}
              style={{ ...inp, padding:"4px 0", border:"none", background:"transparent", fontSize:"26px", fontWeight:"800", color:"#f0f4ff", width:"52px" }}/>
            <span style={{ fontSize:"12px", color:"#64748b" }}>yrs</span>
          </div>
        </div>
        <div style={{ background:"linear-gradient(135deg,rgba(34,211,238,0.14),rgba(34,211,238,0.04))", border:"1px solid rgba(34,211,238,0.3)", borderRadius:"14px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#22d3ee", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>To Lose</div>
          <div style={{ fontSize:"26px", fontWeight:"900", color:"#22d3ee" }}>{s.lbsToLose}</div>
          <div style={{ fontSize:"11px", color:"#64748b" }}>lbs</div>
        </div>
      </div>

      {/* Timeframe */}
      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"14px", padding:"14px", marginBottom:"10px" }}>
        <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"10px", textTransform:"uppercase", letterSpacing:"1px" }}>Timeframe</div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {TIMEFRAMES.map(w => (
            <button key={w} onClick={() => set("weeks", w)} style={{
              background:profile.weeks===w ? "#22d3ee" : "rgba(255,255,255,0.06)",
              border:`1px solid ${profile.weeks===w ? "#22d3ee" : "rgba(255,255,255,0.1)"}`,
              borderRadius:"8px", padding:"6px 14px", cursor:"pointer",
              color:profile.weeks===w ? "#000" : "#94a3b8", fontWeight:"700", fontSize:"13px", transition:"all .2s",
            }}>{w}w</button>
          ))}
        </div>
        <div style={{ marginTop:"8px", fontSize:"12px", color:"#94a3b8" }}>
          {profile.weeks} weeks · <span style={{ color:"#22d3ee", fontWeight:"700" }}>{s.weeklyLoss} lbs/week</span>
          {s.aggressive && <span style={{ color:"#fb923c", marginLeft:"8px" }}>⚠️ Aggressive — try more weeks</span>}
        </div>
      </div>

      {/* Activity (non-gym) */}
      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"14px", padding:"14px", marginBottom:"20px" }}>
        <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>Daily Life Activity <span style={{ color:"#f87171" }}>(outside the gym)</span></div>
        <div style={{ fontSize:"11px", color:"#475569", marginBottom:"10px" }}>Gym workouts are calculated separately and added on top of this.</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {ACTIVITY.map(a => (
            <button key={a.key} onClick={() => set("activity", a.key)} style={{
              background:profile.activity===a.key ? "rgba(34,211,238,0.1)" : "transparent",
              border:`1px solid ${profile.activity===a.key ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.07)"}`,
              borderRadius:"8px", padding:"8px 12px", cursor:"pointer", textAlign:"left",
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <div>
                <span style={{ color:profile.activity===a.key ? "#22d3ee" : "#f0f4ff", fontWeight:"700", fontSize:"13px" }}>{a.label}</span>
                <span style={{ color:"#64748b", fontSize:"11px", marginLeft:"8px" }}>{a.desc}</span>
              </div>
              <span style={{ color:"#64748b", fontSize:"11px" }}>×{a.mult}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div style={{ fontSize:"11px", color:"#64748b", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"10px" }}>Key Metrics</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
        {[
          { label:"BMR",                value:s.bmr.toLocaleString(),        unit:"cal/day", note:"Body at complete rest",            color:"#f0f4ff" },
          { label:"Life TDEE",          value:s.lifeTDEE.toLocaleString(),   unit:"cal/day", note:"Before gym (×"+ACTIVITY.find(a=>a.key===profile.activity)?.mult+")", color:"#f0f4ff" },
          { label:"Daily Deficit",      value:s.dailyDeficit.toLocaleString(),unit:"cal",    note:`${s.weeklyLoss} lbs/week`,         color:"#f87171" },
          { label:"Rest Day Target",    value:s.restTarget.toLocaleString(), unit:"cal",     note:"Tuesday — no workout",             color:"#94a3b8" },
        ].map(m => (
          <div key={m.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"12px" }}>
            <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"4px", letterSpacing:"1px", textTransform:"uppercase" }}>{m.label}</div>
            <div style={{ fontSize:"22px", fontWeight:"800", color:m.color }}>{m.value}</div>
            <div style={{ fontSize:"10px", color:"#475569" }}>{m.unit} · {m.note}</div>
          </div>
        ))}
      </div>

      {/* Per-day calorie targets */}
      <div style={{ fontSize:"11px", color:"#64748b", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"10px" }}>
        Your Calorie Target By Day
        <span style={{ marginLeft:"8px", color:"#22d3ee", fontSize:"10px", letterSpacing:"1px" }}>= Life TDEE + Workout Burn − Deficit</span>
      </div>
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", overflow:"hidden" }}>
        {/* Rest day */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <span style={{ fontSize:"13px", color:"#94a3b8", fontWeight:"700" }}>😴 Tuesday (Rest)</span>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"18px", fontWeight:"800", color:"#94a3b8" }}>{s.restTarget.toLocaleString()}</div>
            <div style={{ fontSize:"10px", color:"#475569" }}>cal · no workout</div>
          </div>
        </div>
        {/* Workout days */}
        {s.dayTargets.map((target, i) => {
          const dd = days[i];
          const isSelected = wDay === i;
          return (
            <div key={i} onClick={() => { setTab("workout"); setWDay(i); }}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px",
                borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.05)" : "none",
                background: isSelected ? `${dd.color}10` : "transparent",
                cursor:"pointer", transition:"background .2s",
              }}>
              <div>
                <span style={{ fontSize:"13px", color:dd.color, fontWeight:"700" }}>{dd.icon} {dd.weekday} — {dd.focus}</span>
                <div style={{ fontSize:"10px", color:"#475569" }}>burn ~{s.burns[i]} cal</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"18px", fontWeight:"800", color:dd.color }}>{target.toLocaleString()}</div>
                <div style={{ fontSize:"10px", color:"#475569" }}>cal to eat</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:"12px", background:"rgba(34,211,238,0.06)", border:"1px solid rgba(34,211,238,0.2)", borderRadius:"10px", padding:"12px 14px", fontSize:"12px", color:"#94a3b8", lineHeight:"1.6" }}>
        💡 <strong style={{ color:"#22d3ee" }}>How it works:</strong> Your life TDEE ({s.lifeTDEE.toLocaleString()} cal) is your baseline with no gym. Each workout earns you extra calories to eat that day. The net result is always a {s.dailyDeficit}-calorie deficit — the gym just lets you eat more.
      </div>
    </div>
  );

  // ── NUTRITION ────────────────────────────────────────────────────────────
  const NutritionTab = () => {
    const wm = s.workoutMacros;
    const rm = s.restMacros;
    return (
      <div style={{ padding:"16px" }}>
        <div style={{ marginBottom:"20px" }}>
          <div style={{ fontSize:"11px", color:"#64748b", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"4px" }}>Daily Plan</div>
          <div style={{ fontSize:"22px", fontWeight:"800", color:"#f0f4ff" }}>Nutrition Targets</div>
        </div>

        {/* Workout day vs rest day hero */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
          <div style={{ background:"linear-gradient(135deg,rgba(74,222,128,0.1),rgba(74,222,128,0.03))", border:"1px solid rgba(74,222,128,0.3)", borderRadius:"16px", padding:"16px" }}>
            <div style={{ fontSize:"10px", color:"#4ade80", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"6px" }}>🏋️ Workout Days</div>
            <div style={{ fontSize:"36px", fontWeight:"900", color:"#4ade80", lineHeight:1 }}>{s.avgWorkoutTarget.toLocaleString()}</div>
            <div style={{ fontSize:"11px", color:"#64748b", marginTop:"4px" }}>avg cal/day</div>
            <div style={{ fontSize:"11px", color:"#475569", marginTop:"6px" }}>Varies by workout burn</div>
            <div style={{ fontSize:"11px", color:"#4ade80", marginTop:"2px" }}>Range: {Math.min(...s.dayTargets).toLocaleString()}–{Math.max(...s.dayTargets).toLocaleString()}</div>
          </div>
          <div style={{ background:"linear-gradient(135deg,rgba(148,163,184,0.1),rgba(148,163,184,0.03))", border:"1px solid rgba(148,163,184,0.2)", borderRadius:"16px", padding:"16px" }}>
            <div style={{ fontSize:"10px", color:"#94a3b8", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"6px" }}>😴 Rest Day (Tue)</div>
            <div style={{ fontSize:"36px", fontWeight:"900", color:"#94a3b8", lineHeight:1 }}>{s.restTarget.toLocaleString()}</div>
            <div style={{ fontSize:"11px", color:"#64748b", marginTop:"4px" }}>cal/day</div>
            <div style={{ fontSize:"11px", color:"#475569", marginTop:"6px" }}>No workout bonus</div>
            <div style={{ fontSize:"11px", color:"#f87171", marginTop:"2px" }}>Eat lean today</div>
          </div>
        </div>

        {/* The math explained */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", padding:"14px", marginBottom:"14px" }}>
          <div style={{ fontSize:"11px", color:"#64748b", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"10px" }}>The Formula</div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap", fontSize:"13px" }}>
            <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"8px", padding:"8px 12px", textAlign:"center" }}>
              <div style={{ color:"#64748b", fontSize:"10px" }}>Life TDEE</div>
              <div style={{ color:"#f0f4ff", fontWeight:"700" }}>{s.lifeTDEE.toLocaleString()}</div>
            </div>
            <span style={{ color:"#4ade80", fontWeight:"700" }}>+ workout</span>
            <div style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:"8px", padding:"8px 12px", textAlign:"center" }}>
              <div style={{ color:"#4ade80", fontSize:"10px" }}>Burn</div>
              <div style={{ color:"#4ade80", fontWeight:"700" }}>varies</div>
            </div>
            <span style={{ color:"#f87171", fontWeight:"700" }}>− {s.dailyDeficit}</span>
            <div style={{ background:"rgba(34,211,238,0.1)", border:"1px solid rgba(34,211,238,0.25)", borderRadius:"8px", padding:"8px 12px", textAlign:"center" }}>
              <div style={{ color:"#22d3ee", fontSize:"10px" }}>= Eat</div>
              <div style={{ color:"#22d3ee", fontWeight:"700" }}>your target</div>
            </div>
          </div>
          <div style={{ marginTop:"10px", fontSize:"11px", color:"#475569", lineHeight:"1.6" }}>
            Net result is always the same {s.dailyDeficit}-cal deficit. The workout just earns you more food. On rest day there's no bonus — so eat less.
          </div>
        </div>

        {/* Macros - Workout Day */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", padding:"16px", marginBottom:"12px" }}>
          <div style={{ fontSize:"11px", color:"#4ade80", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"14px" }}>🏋️ Workout Day Macros (avg {s.avgWorkoutTarget.toLocaleString()} cal)</div>
          <div style={{ display:"flex", justifyContent:"space-around", marginBottom:"14px" }}>
            {[
              { label:"Protein", g:s.proteinG,  cal:s.proteinCal,      pct:s.proteinCal/s.avgWorkoutTarget,      color:"#a78bfa", note:"0.9g/lb · muscle" },
              { label:"Carbs",   g:wm.carbG,    cal:wm.carbCal,        pct:wm.carbCal/s.avgWorkoutTarget,         color:"#22d3ee", note:"Energy & perf." },
              { label:"Fat",     g:wm.fatG,     cal:wm.fatCal,         pct:wm.fatCal/s.avgWorkoutTarget,          color:"#fbbf24", note:"Hormones" },
            ].map(m => (
              <div key={m.label} style={{ textAlign:"center" }}>
                <div style={{ position:"relative", display:"inline-block" }}>
                  <Ring pct={m.pct} color={m.color} size={70} stroke={7}/>
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ fontSize:"14px", fontWeight:"800", color:m.color }}>{m.g}</div>
                    <div style={{ fontSize:"8px", color:"#64748b" }}>g</div>
                  </div>
                </div>
                <div style={{ fontSize:"12px", fontWeight:"700", color:"#f0f4ff", marginTop:"4px" }}>{m.label}</div>
                <div style={{ fontSize:"10px", color:"#64748b" }}>{m.cal} cal</div>
                <div style={{ fontSize:"9px", color:"#475569" }}>{m.note}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:"8px", padding:"10px 12px", fontSize:"11px", color:"#c4b5fd" }}>
            💪 Hitting {s.proteinG}g protein daily is the most important number for keeping muscle while cutting.
          </div>
        </div>

        {/* Macros - Rest Day */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(148,163,184,0.15)", borderRadius:"14px", padding:"16px", marginBottom:"12px" }}>
          <div style={{ fontSize:"11px", color:"#94a3b8", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"14px" }}>😴 Rest Day Macros ({s.restTarget.toLocaleString()} cal)</div>
          <div style={{ display:"flex", justifyContent:"space-around" }}>
            {[
              { label:"Protein", g:s.proteinG, cal:s.proteinCal,   color:"#a78bfa" },
              { label:"Carbs",   g:rm.carbG,   cal:rm.carbCal,     color:"#64748b" },
              { label:"Fat",     g:rm.fatG,    cal:rm.fatCal,      color:"#94a3b8" },
            ].map(m => (
              <div key={m.label} style={{ textAlign:"center" }}>
                <div style={{ position:"relative", display:"inline-block" }}>
                  <Ring pct={m.cal/s.restTarget} color={m.color} size={60} stroke={6}/>
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ fontSize:"13px", fontWeight:"800", color:m.color }}>{m.g}</div>
                    <div style={{ fontSize:"8px", color:"#64748b" }}>g</div>
                  </div>
                </div>
                <div style={{ fontSize:"11px", fontWeight:"700", color:"#94a3b8", marginTop:"4px" }}>{m.label}</div>
                <div style={{ fontSize:"10px", color:"#64748b" }}>{m.cal} cal</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly summary */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#64748b", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"10px" }}>Weekly Summary</div>
          {[
            { label:"Projected Loss",      value:`${s.weeklyLoss} lbs/week`,                                           color:"#4ade80"  },
            { label:"Time to Goal",        value:`${profile.weeks}w (~${Math.round(profile.weeks/4.3)} months)`,       color:"#22d3ee"  },
            { label:"Weekly Workout Burn", value:`~${s.weeklyBurn.toLocaleString()} cal`,                              color:"#fbbf24"  },
            { label:"Weekly Food Intake",  value:`~${(s.dayTargets.reduce((a,b)=>a+b,0)+s.restTarget).toLocaleString()} cal`,color:"#f0f4ff" },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize:"13px", color:"#94a3b8" }}>{r.label}</span>
              <span style={{ fontSize:"13px", fontWeight:"700", color:r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── WORKOUT ──────────────────────────────────────────────────────────────
  const WorkoutTab = () => (
    <div style={{ padding:"16px" }}>
      <div style={{ marginBottom:"16px", display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:"11px", color:"#64748b", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"4px" }}>6-Day Split</div>
          <div style={{ fontSize:"22px", fontWeight:"800", color:"#f0f4ff" }}>Workout Plan</div>
        </div>
        <div style={{ display:"flex", background:"rgba(255,255,255,0.06)", borderRadius:"10px", padding:"3px" }}>
          {[{k:"gym",l:"🏟️"},{k:"home",l:"🏠"}].map(t => (
            <button key={t.k} onClick={() => setMode(t.k)} style={{
              background:mode===t.k ? "rgba(255,255,255,0.12)" : "transparent",
              border:"none", borderRadius:"8px", padding:"6px 14px",
              color:mode===t.k ? "#f0f4ff" : "#64748b", fontWeight:"700",
              fontSize:"14px", cursor:"pointer", transition:"all .2s",
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"14px" }}>
        {days.map((dd, i) => (
          <button key={i} onClick={() => { setWDay(i); setShowCal(false); }} style={{
            background:wDay===i ? dd.color : "rgba(255,255,255,0.05)",
            border:`2px solid ${wDay===i ? dd.color : "rgba(255,255,255,0.08)"}`,
            borderRadius:"10px", padding:"6px 11px", cursor:"pointer",
            color:wDay===i ? "#000" : "#777", fontWeight:"700",
            fontSize:"11px", transition:"all .2s", whiteSpace:"nowrap",
          }}>
            <div style={{ fontSize:"14px" }}>{dd.icon}</div>
            <div>{dd.day}</div>
            <div style={{ fontSize:"9px", opacity:0.8 }}>{dd.weekday}</div>
          </button>
        ))}
      </div>

      {/* Calorie banner — today's personalised target */}
      <div onClick={() => setShowCal(!showCal)} style={{
        background:`linear-gradient(135deg,${d.color}12,${d.color}05)`,
        border:`1px solid ${d.color}40`,
        borderRadius:"14px", padding:"14px 16px", marginBottom:"10px",
        cursor:"pointer",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          {/* Left: eat this */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <span style={{ fontSize:"26px" }}>🍽️</span>
            <div>
              <div style={{ fontSize:"10px", color:d.color, letterSpacing:"2px", textTransform:"uppercase" }}>Eat Today · {d.focus}</div>
              <div style={{ fontSize:"32px", fontWeight:"900", color:d.color, lineHeight:1 }}>{todayTarget.toLocaleString()}</div>
              <div style={{ fontSize:"11px", color:"#64748b" }}>cal target</div>
            </div>
          </div>
          {/* Right: breakdown */}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"2px" }}>🔥 Burn</div>
            <div style={{ fontSize:"16px", fontWeight:"800", color:"#fbbf24" }}>~{todayBurn}</div>
            <div style={{ fontSize:"10px", color:"#64748b", marginTop:"4px" }}>Net deficit</div>
            <div style={{ fontSize:"13px", fontWeight:"700", color:"#4ade80" }}>{s.dailyDeficit} cal</div>
          </div>
        </div>

        {showCal && (
          <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:`1px solid ${d.color}25` }}>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", fontSize:"12px", marginBottom:"8px" }}>
              <span style={{ color:"#f0f4ff" }}>Life TDEE: {s.lifeTDEE.toLocaleString()}</span>
              <span style={{ color:"#4ade80" }}>+ burn: {todayBurn}</span>
              <span style={{ color:"#f87171" }}>− deficit: {s.dailyDeficit}</span>
              <span style={{ color:d.color, fontWeight:"700" }}>= eat: {todayTarget.toLocaleString()}</span>
            </div>
            <div style={{ fontSize:"11px", color:"#94a3b8" }}>{d.calNote}</div>
            {d.epoc && <div style={{ marginTop:"6px", color:"#fbbf24", fontSize:"11px" }}>⚡ EPOC: this session keeps burning 10–15% extra for hours after.</div>}
          </div>
        )}
      </div>

      {/* Day card */}
      <div style={{ background:`${d.color}18`, border:`1px solid ${d.color}44`, borderRadius:"14px 14px 0 0", padding:"14px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ width:"40px", height:"40px", background:`${d.color}25`, border:`2px solid ${d.color}`, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>{d.icon}</div>
        <div>
          <div style={{ fontSize:"10px", color:d.color, letterSpacing:"3px", textTransform:"uppercase" }}>{d.day} · {d.weekday}</div>
          <div style={{ fontSize:"17px", fontWeight:"800", color:"#f0f4ff" }}>{d.focus}</div>
          <div style={{ fontSize:"10px", color:"#475569" }}>{mode==="gym" ? "🏟️ GYM" : "🏠 HOME"} · {d.duration}</div>
        </div>
      </div>
      <div style={{ background:"#0c1020", border:`1px solid ${d.color}22`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:"10px 14px", marginBottom:"10px" }}>
        {d.exercises.map((ex, i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"10px", padding:"11px 0", borderBottom:i < d.exercises.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ width:"24px", height:"24px", background:`${d.color}18`, border:`1px solid ${d.color}44`, borderRadius:"6px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"800", color:d.color, flexShrink:0, fontFamily:"monospace" }}>{i+1}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"8px", flexWrap:"wrap" }}>
                <div style={{ fontSize:"13px", fontWeight:"700", color:"#e8edf5" }}>{ex.name}</div>
                <div style={{ background:`${d.color}18`, border:`1px solid ${d.color}33`, borderRadius:"5px", padding:"2px 8px", fontSize:"10px", fontFamily:"monospace", color:d.color, whiteSpace:"nowrap" }}>{ex.sets}</div>
              </div>
              {ex.note && <div style={{ fontSize:"11px", color:"#475569", marginTop:"2px" }}>💡 {ex.note}</div>}
            </div>
          </div>
        ))}
      </div>

      {d.cardio && (
        <div style={{ background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:"12px", padding:"11px 14px", display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"16px" }}>🚴</span>
          <div>
            <div style={{ fontSize:"9px", color:"#fbbf24", letterSpacing:"2px", textTransform:"uppercase" }}>YESOUL Bike · Post-Workout Cardio</div>
            <div style={{ fontSize:"12px", color:"#94a3b8", marginTop:"2px" }}>{d.cardio}</div>
          </div>
        </div>
      )}
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#07080f", color:"#e8edf5", fontFamily:"system-ui,sans-serif", paddingBottom:"72px" }}>
      <style>{`* { box-sizing:border-box; } input::-webkit-inner-spin-button { opacity:1; }`}</style>

      {/* Top bar */}
      <div style={{ background:"rgba(7,8,15,0.97)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:10 }}>
        <div>
          <div style={{ fontSize:"16px", fontWeight:"800", color:"#f0f4ff", letterSpacing:"0.5px" }}>FitPlan Pro</div>
          <div style={{ fontSize:"10px", color:"#475569" }}>{profile.weight} → {profile.goalWeight} lbs · {s.weeklyLoss} lbs/wk</div>
        </div>
        <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"10px", color:"#475569" }}>Rest day</div>
            <div style={{ fontSize:"14px", fontWeight:"800", color:"#94a3b8" }}>{s.restTarget.toLocaleString()}</div>
          </div>
          <div style={{ width:"1px", height:"28px", background:"rgba(255,255,255,0.1)" }}/>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"10px", color:"#475569" }}>Workout days</div>
            <div style={{ fontSize:"14px", fontWeight:"800", color:"#22d3ee" }}>{Math.min(...s.dayTargets).toLocaleString()}–{Math.max(...s.dayTargets).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {tab === "profile"   && <ProfileTab />}
      {tab === "nutrition" && <NutritionTab />}
      {tab === "workout"   && <WorkoutTab />}

      {/* Bottom nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(7,8,15,0.98)", borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", zIndex:20 }}>
        {[
          { key:"profile",   icon:"👤", label:"Profile"   },
          { key:"nutrition", icon:"🥗", label:"Nutrition"  },
          { key:"workout",   icon:"🏋️", label:"Workout"   },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex:1, background:"transparent", border:"none", cursor:"pointer",
            padding:"10px 4px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px",
            borderTop:`2px solid ${tab===t.key ? "#22d3ee" : "transparent"}`, transition:"all .2s",
          }}>
            <span style={{ fontSize:"20px" }}>{t.icon}</span>
            <span style={{ fontSize:"10px", fontWeight:"700", color:tab===t.key ? "#22d3ee" : "#475569", letterSpacing:"0.5px" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

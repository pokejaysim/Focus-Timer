/* Timer Tree — The Almanac · main app
   Static React timer with reducer state, SVG plant plate, and modal sheets. */
(function () {
  const e = React.createElement;
  const { useReducer, useEffect, useState } = React;

  const STORAGE_KEY = "tt-almanac";
  const STORAGE_VERSION = 2;
  const SECOND = 1000;
  const DAY = 24 * 60 * 60 * 1000;

  const THEMES = {
    cream: { paper: "#efe7d3", p2: "#e7ddc4", p3: "#ddd1b4", ink: "#33312a" },
    oat:   { paper: "#f4efe2", p2: "#ece4d0", p3: "#e0d6bd", ink: "#2f2c24" },
    sage:  { paper: "#e8e9d8", p2: "#dde0c9", p3: "#d0d4b8", ink: "#2f3328" },
    dusk:  { paper: "#2c2a24", p2: "#26241d", p3: "#1f1d17", ink: "#e9dec8" },
  };
  const THEME = THEMES.sage;
  const ACCENT = "#45634a";
  const DISPLAY_FACE = "DM Serif Display";
  const DIAL_FACE = "ticks";

  /* ---- plants ---- */
  const PLANTS = [
    { key: "heartleaf", name: "Heartleaf Philodendron", latin: "Philodendron hederaceum" },
    { key: "snake", name: "Snake Plant", latin: "Dracaena trifasciata" },
    { key: "pothos", name: "Pothos", latin: "Epipremnum aureum" },
    { key: "monstera", name: "Monstera", latin: "Monstera deliciosa" },
  ];
  const SOUNDS = ["Forest Morning", "Quiet Rain", "Library Hum", "Hearth & Embers", "Silence"];
  const STAGES = ["Seed", "Sprout", "Growing", "Mature", "Flowering"];
  const STAGE_WORD = ["One", "Two", "Three", "Four", "Five"];
  const STAGE_EVERY = 2; // focus sessions per stage

  function dateKey(date = new Date()) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function dayDiff(from, to) {
    if (!from || !to) return Infinity;
    const a = new Date(from + "T00:00:00");
    const b = new Date(to + "T00:00:00");
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return Infinity;
    return Math.round((b - a) / DAY);
  }

  function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function toRoman(n) {
    const m = [["X",10],["IX",9],["V",5],["IV",4],["I",1]];
    let r = ""; n = Math.max(0, n|0);
    for (const [s, v] of m) while (n >= v) { r += s; n -= v; }
    return r || "0";
  }
  function fmt(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  /* ---- timer reducer ---- */
  const dur = (phase, s) =>
    (phase === "focus" ? s.focusMin : phase === "long" ? s.longMin : s.breakMin) * 60;

  function freshState() {
    const today = dateKey();
    return {
      version: STORAGE_VERSION,
      focusMin: 25, breakMin: 5, longMin: 15, longEvery: 4,
      plantKey: "heartleaf", sound: "Forest Morning",
      phase: "focus", remaining: 25 * 60,
      sessionInRound: 0, completedFocus: 0, today: 0, todayDate: today,
      totalFocusSeconds: 0, longestFocusSeconds: 0,
      streak: 0, lastFocusDate: null,
      running: false, lastTickAt: null,
    };
  }

  function sanitizeState(raw) {
    const base = freshState();
    if (!raw || typeof raw !== "object" || raw.version !== STORAGE_VERSION) return base;

    const phase = ["focus", "break", "long"].includes(raw.phase) ? raw.phase : base.phase;
    const state = {
      ...base,
      focusMin: clampNumber(raw.focusMin, 5, 90, base.focusMin),
      breakMin: clampNumber(raw.breakMin, 1, 30, base.breakMin),
      longMin: clampNumber(raw.longMin, 5, 45, base.longMin),
      longEvery: clampNumber(raw.longEvery, 2, 8, base.longEvery),
      plantKey: PLANTS.some((p) => p.key === raw.plantKey) ? raw.plantKey : base.plantKey,
      sound: SOUNDS.includes(raw.sound) ? raw.sound : base.sound,
      phase,
      sessionInRound: clampNumber(raw.sessionInRound, 0, 8, base.sessionInRound),
      completedFocus: clampNumber(raw.completedFocus, 0, 100000, base.completedFocus),
      today: clampNumber(raw.today, 0, 100000, base.today),
      todayDate: typeof raw.todayDate === "string" ? raw.todayDate : base.todayDate,
      totalFocusSeconds: clampNumber(raw.totalFocusSeconds, 0, 1000000000, base.totalFocusSeconds),
      longestFocusSeconds: clampNumber(raw.longestFocusSeconds, 0, 24 * 60 * 60, base.longestFocusSeconds),
      streak: clampNumber(raw.streak, 0, 100000, base.streak),
      lastFocusDate: typeof raw.lastFocusDate === "string" ? raw.lastFocusDate : null,
      running: false,
      lastTickAt: null,
    };
    state.remaining = clampNumber(raw.remaining, 0, dur(state.phase, state), dur(state.phase, state));
    return syncToday(state);
  }

  function loadInitialState() {
    try {
      return sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch (e) {
      return freshState();
    }
  }

  function syncToday(s, today = dateKey()) {
    let next = s;
    if (next.todayDate !== today) {
      next = { ...next, today: 0, todayDate: today };
    }
    if (next.lastFocusDate && dayDiff(next.lastFocusDate, today) > 1 && next.streak !== 0) {
      next = { ...next, streak: 0 };
    }
    return next;
  }

  function completeFocus(s) {
    const today = dateKey();
    const todayCount = s.todayDate === today ? s.today : 0;
    const sessionInRound = s.sessionInRound + 1;
    const nextPhase = sessionInRound % s.longEvery === 0 ? "long" : "break";
    const focusSeconds = dur("focus", s);
    let streak = s.streak;

    if (s.lastFocusDate !== today) {
      streak = dayDiff(s.lastFocusDate, today) === 1 ? s.streak + 1 : 1;
    }

    return {
      ...s,
      phase: nextPhase,
      sessionInRound,
      completedFocus: s.completedFocus + 1,
      today: todayCount + 1,
      todayDate: today,
      totalFocusSeconds: s.totalFocusSeconds + focusSeconds,
      longestFocusSeconds: Math.max(s.longestFocusSeconds, focusSeconds),
      streak,
      lastFocusDate: today,
      remaining: dur(nextPhase, s),
      running: true,
    };
  }

  function completeRest(s) {
    const sessionInRound = s.phase === "long" ? 0 : s.sessionInRound;
    return {
      ...s,
      phase: "focus",
      sessionInRound,
      remaining: dur("focus", s),
      running: false,
      lastTickAt: null,
    };
  }

  function advanceElapsed(s, seconds, tickAt) {
    let next = s;
    let remainingSeconds = seconds;

    while (remainingSeconds > 0 && next.running) {
      if (remainingSeconds < next.remaining) {
        return {
          ...next,
          remaining: next.remaining - remainingSeconds,
          lastTickAt: tickAt,
        };
      }

      remainingSeconds -= next.remaining;
      next = next.phase === "focus" ? completeFocus(next) : completeRest(next);
    }

    return {
      ...next,
      lastTickAt: next.running ? tickAt : null,
    };
  }

  function reducer(s, a) {
    switch (a.type) {
      case "TOGGLE": {
        const now = a.now || Date.now();
        const ns = syncToday(s);
        if (ns.remaining <= 0) {
          return { ...ns, remaining: dur(ns.phase, ns), running: true, lastTickAt: now };
        }
        return { ...ns, running: !ns.running, lastTickAt: ns.running ? null : now };
      }
      case "RESET": {
        const ns = syncToday(s);
        return { ...ns, remaining: dur(ns.phase, ns), running: false, lastTickAt: null };
      }
      case "SKIP": {
        const ns = syncToday(s);
        if (ns.phase === "focus") {
          return { ...ns, phase: "break", remaining: dur("break", ns), running: false, lastTickAt: null };
        }
        const sessionInRound = ns.phase === "long" ? 0 : ns.sessionInRound;
        return { ...ns, phase: "focus", sessionInRound, remaining: dur("focus", ns), running: false, lastTickAt: null };
      }
      case "TICK": {
        const ns = syncToday(s);
        if (!ns.running) return ns;
        const now = a.now || Date.now();
        const lastTickAt = Number.isFinite(ns.lastTickAt) ? ns.lastTickAt : now;
        const elapsed = Math.floor((now - lastTickAt) / SECOND);
        if (elapsed < 1) return ns.lastTickAt ? ns : { ...ns, lastTickAt: now };
        return advanceElapsed(ns, elapsed, lastTickAt + elapsed * SECOND);
      }
      case "SET": {
        const updates = {};
        if (a.key === "focusMin") updates.focusMin = clampNumber(a.value, 5, 90, s.focusMin);
        if (a.key === "breakMin") updates.breakMin = clampNumber(a.value, 1, 30, s.breakMin);
        if (a.key === "longMin") updates.longMin = clampNumber(a.value, 5, 45, s.longMin);
        if (a.key === "longEvery") updates.longEvery = clampNumber(a.value, 2, 8, s.longEvery);
        if (a.key === "plantKey" && PLANTS.some((p) => p.key === a.value)) updates.plantKey = a.value;
        if (a.key === "sound" && SOUNDS.includes(a.value)) updates.sound = a.value;

        const ns = syncToday({ ...s, ...updates });
        if (!ns.running && ["focusMin", "breakMin", "longMin"].includes(a.key)) {
          ns.remaining = dur(ns.phase, ns);
        }
        return ns;
      }
      case "SYNC_TODAY":
        return syncToday(s, a.today || dateKey());
      default:
        return s;
    }
  }

  /* ---- stepper field ---- */
  function Stepper({ label, value, unit, min, max, onChange }) {
    const clamp = (v) => Math.max(min, Math.min(max, v));
    return e("div", { className: "field" },
      e("label", null, label),
      e("div", { className: "stepper" },
        e("input", {
          type: "number", value, min, max,
          onChange: (ev) => onChange(clamp(parseInt(ev.target.value || "0", 10))),
        }),
        e("span", { className: "unit" }, unit),
        e("div", { style: { display: "flex", flexDirection: "column" } },
          e("button", { className: "nudge", onClick: () => onChange(clamp(value + 1)), style: { flex: 1 } }, "\u2039".replace("\u2039", "+")),
          e("button", { className: "nudge", onClick: () => onChange(clamp(value - 1)), style: { flex: 1, borderTop: "1px solid var(--rule)" } }, "\u2212")
        )
      )
    );
  }

  function Select({ label, value, options, onChange, wide, getLabel }) {
    return e("div", { className: "field" + (wide ? " field-wide" : "") },
      e("label", null, label),
      e("select", { className: "select", value, onChange: (ev) => onChange(ev.target.value) },
        options.map((o) => e("option", { key: o, value: o }, getLabel ? getLabel(o) : o))
      )
    );
  }

  /* ---- main app ---- */
  function App() {
    const [s, dispatch] = useReducer(reducer, null, loadInitialState);
    const [overlay, setOverlay] = useState(null);
    const [drawer, setDrawer] = useState(false);

    // persist
    useEffect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, version: STORAGE_VERSION }));
      } catch (e) {}
    }, [s]);

    // keep the "today" counter honest if the app stays open across midnight
    useEffect(() => {
      const id = setInterval(() => dispatch({ type: "SYNC_TODAY", today: dateKey() }), 60 * SECOND);
      return () => clearInterval(id);
    }, []);

    // ticking
    useEffect(() => {
      if (!s.running) return;
      const id = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), SECOND);
      return () => clearInterval(id);
    }, [s.running]);

    useEffect(() => {
      if (!overlay) return;
      const onKeyDown = (ev) => {
        if (ev.key === "Escape") setOverlay(null);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [overlay]);

    const total = dur(s.phase, s);
    const progress = 1 - s.remaining / total;
    const plant = PLANTS.find((p) => p.key === s.plantKey) || PLANTS[0];
    const stageIdx = Math.min(4, Math.floor(s.completedFocus / STAGE_EVERY));
    const intoStage = s.completedFocus - stageIdx * STAGE_EVERY;
    const toNext = STAGE_EVERY - intoStage;
    const modeLabel = s.phase === "focus" ? "Focus" : s.phase === "long" ? "Long Rest" : "Short Rest";
    const displayToday = s.todayDate === dateKey() ? s.today : 0;
    const totalFocusSeconds = Math.max(0, s.totalFocusSeconds);
    const gardenUnlockedCount = Math.max(1, Math.min(6, stageIdx + 1));
    const stats = {
      today: displayToday,
      totalH: Math.floor(totalFocusSeconds / 3600),
      totalM: Math.floor((totalFocusSeconds % 3600) / 60),
      longest: Math.round(Math.max(0, s.longestFocusSeconds) / 60),
      streak: s.streak,
      plates: gardenUnlockedCount,
    };

    const rootStyle = {
      "--paper": THEME.paper,
      "--paper-2": THEME.p2,
      "--paper-3": THEME.p3,
      "--ink": THEME.ink,
      "--accent": ACCENT,
      "--font-display": '"' + DISPLAY_FACE + '", Georgia, serif',
    };

    const primaryLabel = s.running
      ? "Pause"
      : s.phase === "focus"
        ? (progress > 0 ? "Resume" : "Plant")
        : "Begin Rest";

    return e("div", { className: "almanac-root", style: rootStyle },
      e("div", { className: "page grain" },
        /* masthead */
        e("div", { className: "masthead" },
          e("div", { className: "brand" },
            e("div", { className: "leaf-mark" }),
            e("div", { className: "wordmark" }, "Timer Tree")
          ),
          e("nav", { className: "nav" },
            e("button", { onClick: () => setOverlay("about") }, "About"),
            e("button", { onClick: () => setOverlay("stats") }, "Stats"),
            e("button", { onClick: () => setOverlay("garden") }, "Garden")
          )
        ),
        e("div", { className: "rule-row" }),

        /* spread */
        e("div", { className: "spread" },
          /* left — plate */
          e("div", { className: "plate-col" },
            e("div", { className: "plate-frame" },
              e(window.PlantPlate, { stage: stageIdx })
            ),
            e("div", { className: "plate-cap" }, "Plate " + toRoman(stageIdx + 1) + " \u00b7 " + plant.latin),
            e("div", { className: "plant-name" }, plant.name),
            e("div", { className: "stage-meta" }, "Stage " + STAGE_WORD[stageIdx] + " \u00b7 " + STAGES[stageIdx]),
            e("div", { className: "stage-track" },
              STAGES.map((st, i) =>
                e(React.Fragment, { key: i },
                  i > 0 ? e("div", { className: "stage-link" + (i <= stageIdx ? " filled" : "") }) : null,
                  e("div", {
                    className: "stage-dot" + (i < stageIdx ? " done" : "") + (i === stageIdx ? " current" : ""),
                    title: STAGES[i],
                  }, toRoman(i + 1))
                )
              )
            ),
            e("div", { className: "next-plate" },
              stageIdx >= 4
                ? "This plant has flowered \u2014 a plate well pressed."
                : toNext + (toNext === 1 ? " session" : " sessions") + " until Plate " + toRoman(stageIdx + 2) + ".")
          ),

          e("div", { className: "divider" }),

          /* right — dial */
          e("div", { className: "dial-col" },
            e("div", { className: "dial-wrap" },
              e(window.Dial, { progress, style: DIAL_FACE }),
              e("div", { className: "dial-center" },
                e("div", { className: "mode-pill" + (s.phase !== "focus" ? " break" : "") },
                  e("span", { className: "dot" }), modeLabel),
                e("div", { className: "dial-time" }, fmt(s.remaining)),
                e("div", { className: "dial-sub" }, "Session " + toRoman(s.sessionInRound + 1) + " of " + toRoman(s.longEvery))
              )
            ),
            e("div", { className: "controls" },
              e("button", { className: "btn-ghost", onClick: () => dispatch({ type: "RESET" }), title: "Reset" },
                e("span", { className: "lab" }, "Reset")),
              e("button", { className: "btn-primary", onClick: () => dispatch({ type: "TOGGLE" }) }, primaryLabel),
              e("button", { className: "btn-ghost", onClick: () => dispatch({ type: "SKIP" }), title: "Skip" },
                e("span", { className: "lab" }, "Skip"))
            )
          )
        ),

        /* tucked settings */
        e("div", { className: "tuck" },
          e("div", { className: "tuck-bar" },
            e("span", { className: "lbl" }, "Settings"),
            e("span", { className: "tuck-chip" }, "Focus ", e("b", null, s.focusMin + "m")),
            e("span", { className: "tuck-chip" }, "Rest ", e("b", null, s.breakMin + "m")),
            e("span", { className: "tuck-chip" }, "Long ", e("b", null, s.longMin + "m")),
            e("span", { className: "tuck-chip" }, "Sound ", e("b", null, s.sound)),
            e("button", { className: "tuck-pull", onClick: () => setDrawer((d) => !d) },
              drawer ? "Close \u25BE" : "Adjust \u25B4")
          ),
          e("div", { className: "drawer" + (drawer ? " open" : "") },
            e("div", { className: "drawer-inner" },
              e(Stepper, { label: "Focus", value: s.focusMin, unit: "min", min: 5, max: 90, onChange: (v) => dispatch({ type: "SET", key: "focusMin", value: v }) }),
              e(Stepper, { label: "Short rest", value: s.breakMin, unit: "min", min: 1, max: 30, onChange: (v) => dispatch({ type: "SET", key: "breakMin", value: v }) }),
              e(Stepper, { label: "Long rest", value: s.longMin, unit: "min", min: 5, max: 45, onChange: (v) => dispatch({ type: "SET", key: "longMin", value: v }) }),
              e(Stepper, { label: "Long rest after", value: s.longEvery, unit: "\u00d7", min: 2, max: 8, onChange: (v) => dispatch({ type: "SET", key: "longEvery", value: v }) }),
              e(Select, { label: "Plant", wide: true, value: s.plantKey, options: PLANTS.map((p) => p.key),
                getLabel: (key) => (PLANTS.find((p) => p.key === key) || PLANTS[0]).name,
                onChange: (v) => dispatch({ type: "SET", key: "plantKey", value: v }) }),
              e(Select, { label: "Sound theme", wide: true, value: s.sound, options: SOUNDS,
                onChange: (v) => dispatch({ type: "SET", key: "sound", value: v }) })
            )
          )
        )
      ),

      /* overlays */
      overlay === "stats" && e(window.StatsSheet, {
        onClose: () => setOverlay(null),
        stats,
      }),
      overlay === "garden" && e(window.GardenSheet, { onClose: () => setOverlay(null), unlockedCount: gardenUnlockedCount }),
      overlay === "about" && e(window.AboutSheet, { onClose: () => setOverlay(null) })
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(e(App));
})();

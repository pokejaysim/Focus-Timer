/* Timer Tree — The Almanac · main app
   Static React timer with reducer state, SVG plant plate, and modal sheets. */
(function () {
  const e = React.createElement;
  const { useReducer, useEffect, useState, useRef } = React;

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

  const INIT = {
    focusMin: 25, breakMin: 5, longMin: 15, longEvery: 4,
    plantKey: "heartleaf", sound: "Forest Morning",
    phase: "focus", remaining: 25 * 60,
    sessionInRound: 0, completedFocus: 4, today: 3, running: false,
  };

  function reducer(s, a) {
    switch (a.type) {
      case "LOAD":
        return { ...s, ...a.state, running: false };
      case "TOGGLE": {
        if (s.remaining <= 0) return { ...s, remaining: dur(s.phase, s), running: true };
        return { ...s, running: !s.running };
      }
      case "RESET":
        return { ...s, remaining: dur(s.phase, s), running: false };
      case "SKIP": {
        if (s.phase === "focus")
          return { ...s, phase: "break", remaining: dur("break", s), running: false };
        const sr = s.phase === "long" ? 0 : s.sessionInRound;
        return { ...s, phase: "focus", sessionInRound: sr, remaining: dur("focus", s), running: false };
      }
      case "TICK": {
        if (s.remaining > 1) return { ...s, remaining: s.remaining - 1 };
        // phase boundary
        if (s.phase === "focus") {
          const sr = s.sessionInRound + 1;
          const isLong = sr % s.longEvery === 0;
          const next = isLong ? "long" : "break";
          return {
            ...s, phase: next, sessionInRound: sr,
            completedFocus: s.completedFocus + 1, today: s.today + 1,
            remaining: dur(next, s), running: true, // breaks auto-start
          };
        } else {
          const sr = s.phase === "long" ? 0 : s.sessionInRound;
          return { ...s, phase: "focus", sessionInRound: sr, remaining: dur("focus", s), running: false };
        }
      }
      case "SET": {
        const ns = { ...s, [a.key]: a.value };
        if (!ns.running && ["focusMin", "breakMin", "longMin"].includes(a.key))
          ns.remaining = dur(ns.phase, ns);
        return ns;
      }
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
    const [s, dispatch] = useReducer(reducer, INIT);
    const [overlay, setOverlay] = useState(null);
    const [drawer, setDrawer] = useState(false);
    const loaded = useRef(false);

    // load once
    useEffect(() => {
      try {
        const raw = localStorage.getItem("tt-almanac");
        if (raw) dispatch({ type: "LOAD", state: JSON.parse(raw) });
      } catch (e) {}
      loaded.current = true;
    }, []);
    // persist
    useEffect(() => {
      if (loaded.current) localStorage.setItem("tt-almanac", JSON.stringify(s));
    }, [s]);
    // ticking
    useEffect(() => {
      if (!s.running) return;
      const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
      return () => clearInterval(id);
    }, [s.running]);

    const total = dur(s.phase, s);
    const progress = 1 - s.remaining / total;
    const plant = PLANTS.find((p) => p.key === s.plantKey) || PLANTS[0];
    const stageIdx = Math.min(4, Math.floor(s.completedFocus / STAGE_EVERY));
    const intoStage = s.completedFocus - stageIdx * STAGE_EVERY;
    const toNext = STAGE_EVERY - intoStage;
    const modeLabel = s.phase === "focus" ? "Focus" : s.phase === "long" ? "Long Rest" : "Short Rest";

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
        stats: { today: s.today, totalH: 12, totalM: 48, longest: 60, streak: 5, plates: 3 },
      }),
      overlay === "garden" && e(window.GardenSheet, { onClose: () => setOverlay(null) }),
      overlay === "about" && e(window.AboutSheet, { onClose: () => setOverlay(null) })
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(e(App));
})();

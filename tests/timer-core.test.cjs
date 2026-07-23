const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadTimerCore() {
  const appPath = path.join(__dirname, "..", "docs", "almanac", "app.js");
  const source = fs.readFileSync(appPath, "utf8");
  const boot = [
    '  const root = ReactDOM.createRoot(document.getElementById("root"));',
    "  root.render(e(App));",
    "})();",
  ].join("\n");
  const exposed = [
    "  window.__TimerTreeTest = { freshState, sanitizeState, reducer, dur };",
    "})();",
  ].join("\n");

  assert.ok(source.includes(boot), "app boot block should remain testable");

  const sandbox = {
    React: {
      createElement() {},
      useEffect() {},
      useReducer() {},
      useRef() {},
      useState() {},
    },
    Date,
    Math,
    JSON,
    Number,
    String,
    Object,
    Array,
    localStorage: {
      getItem() { return null; },
      setItem() {},
    },
    navigator: {},
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    window: {},
  };
  sandbox.window.window = sandbox.window;

  vm.runInNewContext(source.replace(boot, exposed), sandbox, { filename: appPath });
  return sandbox.window.__TimerTreeTest;
}

const core = loadTimerCore();

test("older saved state keeps statistics and receives safe alert defaults", () => {
  const saved = {
    ...core.freshState(),
    completedFocus: 17,
    today: 3,
    totalFocusSeconds: 25500,
  };
  delete saved.alertLevel;
  delete saved.alertSetupComplete;
  delete saved.vibrationEnabled;
  delete saved.completionPending;

  const restored = core.sanitizeState(saved);

  assert.equal(restored.completedFocus, 17);
  assert.equal(restored.today, 3);
  assert.equal(restored.totalFocusSeconds, 25500);
  assert.equal(restored.alertLevel, "Clear");
  assert.equal(restored.alertSetupComplete, false);
  assert.equal(restored.vibrationEnabled, true);
  assert.equal(restored.completionPending, null);
});

test("focus completion records once and waits at the full break duration", () => {
  const initial = {
    ...core.freshState(),
    focusMin: 5,
    breakMin: 2,
    remaining: 1,
    running: true,
    lastTickAt: 1000,
  };

  const completed = core.reducer(initial, { type: "TICK", now: 2000 });

  assert.equal(completed.phase, "break");
  assert.equal(completed.remaining, 120);
  assert.equal(completed.completionPending, "focus");
  assert.equal(completed.running, false);
  assert.equal(completed.completedFocus, 1);
  assert.equal(completed.totalFocusSeconds, 300);

  const laterTick = core.reducer(completed, { type: "TICK", now: 122000 });
  assert.equal(laterTick.completedFocus, 1);
  assert.equal(laterTick.remaining, 120);
});

test("background catch-up stops at the focus boundary", () => {
  const initial = {
    ...core.freshState(),
    focusMin: 5,
    breakMin: 1,
    remaining: 1,
    running: true,
    lastTickAt: 1000,
  };

  const completed = core.reducer(initial, { type: "TICK", now: 181000 });

  assert.equal(completed.phase, "break");
  assert.equal(completed.remaining, 60);
  assert.equal(completed.completionPending, "focus");
  assert.equal(completed.running, false);
});

test("acknowledging a completion starts the waiting phase", () => {
  const waiting = {
    ...core.freshState(),
    phase: "break",
    remaining: 300,
    completionPending: "focus",
  };

  const begun = core.reducer(waiting, { type: "BEGIN_NEXT_PHASE", now: 5000 });

  assert.equal(begun.completionPending, null);
  assert.equal(begun.phase, "break");
  assert.equal(begun.remaining, 300);
  assert.equal(begun.running, true);
  assert.equal(begun.lastTickAt, 5000);
});

test("skipping a pending rest returns to a fresh stopped focus", () => {
  const waiting = {
    ...core.freshState(),
    phase: "break",
    remaining: 300,
    completionPending: "focus",
    sessionInRound: 2,
  };

  const skipped = core.reducer(waiting, { type: "SKIP" });

  assert.equal(skipped.completionPending, null);
  assert.equal(skipped.phase, "focus");
  assert.equal(skipped.remaining, 1500);
  assert.equal(skipped.running, false);
  assert.equal(skipped.sessionInRound, 2);
});

test("rest completion uses its own waiting state and resets a long-rest round", () => {
  const initial = {
    ...core.freshState(),
    phase: "long",
    remaining: 1,
    running: true,
    lastTickAt: 1000,
    sessionInRound: 4,
  };

  const completed = core.reducer(initial, { type: "TICK", now: 2000 });

  assert.equal(completed.phase, "focus");
  assert.equal(completed.remaining, 1500);
  assert.equal(completed.completionPending, "rest");
  assert.equal(completed.running, false);
  assert.equal(completed.sessionInRound, 0);
});

test("reset and persisted-state validation clear stale completion prompts", () => {
  const waiting = {
    ...core.freshState(),
    phase: "break",
    completionPending: "focus",
    remaining: 200,
  };
  const reset = core.reducer(waiting, { type: "RESET" });
  assert.equal(reset.completionPending, null);
  assert.equal(reset.remaining, 300);

  const invalidSaved = {
    ...core.freshState(),
    phase: "focus",
    completionPending: "focus",
  };
  assert.equal(core.sanitizeState(invalidSaved).completionPending, null);
});

/* Overlays: Stats ledger, Garden of plates, About colophon, and timer alerts.
   Exported to window for the main app. */
(function () {
  const e = React.createElement;

  function romanYear(year) {
    const numerals = [["M",1000],["CM",900],["D",500],["CD",400],["C",100],["XC",90],["L",50],["XL",40],["X",10],["IX",9],["V",5],["IV",4],["I",1]];
    let value = year;
    let result = "";
    for (const [symbol, amount] of numerals) {
      while (value >= amount) {
        result += symbol;
        value -= amount;
      }
    }
    return result;
  }

  function Sheet({ kicker, title, onClose, children, dismissible = true }) {
    return e(
      "div",
      {
        className: "scrim",
        onClick: (ev) => {
          if (dismissible && ev.target === ev.currentTarget && onClose) onClose();
        },
      },
      e(
        "div",
        { className: "sheet", role: "dialog", "aria-modal": "true", "aria-label": title },
        dismissible && onClose
          ? e("button", { type: "button", className: "sheet-close", onClick: onClose, "aria-label": "Close" }, "\u2715")
          : null,
        e(
          "div",
          { className: "sheet-head" },
          e("div", null,
            e("div", { className: "kick" }, kicker),
            e("h2", null, title)
          )
        ),
        children
      )
    );
  }

  function Row({ k, sub, v, unit }) {
    return e(
      "div",
      { className: "ledger-row" },
      e("div", { className: "k" }, k, sub ? e("small", null, sub) : null),
      e("div", { className: "v" }, v, unit ? e("small", null, " " + unit) : null)
    );
  }

  function StatsSheet({ stats, onClose }) {
    return e(
      Sheet,
      { kicker: "Field Record \u00b7 Anno " + romanYear(new Date().getFullYear()), title: "The Ledger", onClose },
      e(
        "div",
        { className: "ledger" },
        e(Row, { k: "Sessions tended today", sub: "Focus periods completed", v: stats.today }),
        e(Row, { k: "Total focus tended", sub: "All time", v: stats.totalH, unit: "h " + stats.totalM + "m" }),
        e(Row, { k: "Longest single sitting", sub: "Personal best", v: stats.longest, unit: "min" }),
        e(Row, { k: "Current streak", sub: "Consecutive days", v: stats.streak, unit: stats.streak === 1 ? "day" : "days" }),
        e(Row, { k: "Plates pressed", sub: "Unlocked in collection", v: stats.plates })
      ),
      e("div", { style: { marginTop: "20px", fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: "15px", color: "var(--ink-soft)", textAlign: "center" } },
        "\u275B  Steady hands keep the fullest garden  \u275C")
    );
  }

  const PLANTS = [
    { nm: "Heartleaf Philodendron", on: true },
    { nm: "Snake Plant", on: true },
    { nm: "Pothos", on: true },
    { nm: "Fiddle-leaf Fig", on: false },
    { nm: "Monstera", on: false },
    { nm: "Calathea", on: false },
  ];

  function GardenSheet({ onClose, unlockedCount = 1 }) {
    const unlocked = Math.max(0, Math.min(PLANTS.length, unlockedCount));
    const waiting = PLANTS.length - unlocked;
    const footer = unlocked + " " + (unlocked === 1 ? "plate" : "plates") +
      " pressed \u00b7 " + waiting + " awaiting cultivation";

    return e(
      Sheet,
      { kicker: "Pressed Collection \u00b7 Plates I\u2013VI", title: "The Garden", onClose },
      e(
        "div",
        { className: "garden-grid" },
        PLANTS.map((p, i) => {
          const isUnlocked = i < unlocked;
          return (
          e(
            "div",
            { key: i, className: "garden-cell" + (isUnlocked ? "" : " locked") },
            e("div", { className: "ph" }, e("span", null, isUnlocked ? "Plate " + ["I", "II", "III", "IV", "V", "VI"][i] : "\u2014 locked \u2014")),
            e("div", { className: "nm" }, p.nm)
          )
          );
        })
      ),
      e("div", { style: { marginTop: "18px", fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-faint)", textAlign: "center" } },
        footer)
    );
  }

  function AboutSheet({ onClose }) {
    return e(
      Sheet,
      { kicker: "Colophon", title: "About the Almanac", onClose },
      e(
        "div",
        { className: "colophon" },
        e("p", null, "Timer Tree is a focus timer in the shape of an old field almanac. Each working session is one pressed leaf; tend enough of them and the plant on your page advances, plate by plate, until it flowers."),
        e("p", null, "Work in measured sittings \u2014 a focused stretch, then a short rest \u2014 and let the dial keep time so your attention doesn\u2019t have to. The garden remembers what you grow."),
        e("p", { className: "sig" }, "\u275B  Stay consistent, stay present, grow your best self.")
      )
    );
  }

  function AlertSetupSheet({
    permission,
    audioStatus,
    onTest,
    onEnableAndStart,
    onSoundOnlyAndStart,
    onClose,
  }) {
    const notificationBlocked = permission === "denied";
    const notificationUnsupported = permission === "unsupported";
    const notificationReady = permission === "granted";
    const notificationLabel = notificationReady
      ? "Notifications On & Start"
      : notificationBlocked
        ? "Notifications Blocked"
        : notificationUnsupported
          ? "Notifications Unavailable"
          : "Enable Notifications & Start";
    const audioLabel = audioStatus === "ready"
      ? "Sound ready"
      : audioStatus === "failed" || audioStatus === "unavailable"
        ? "Sound needs attention"
        : audioStatus === "muted"
          ? "Sound muted"
          : "Sound not yet tested";

    return e(
      Sheet,
      { kicker: "Before Your First Sitting", title: "Prepare Your Alerts", onClose },
      e("div", { className: "transition-copy" },
        e("p", null, "A Pomodoro only works if you notice the transition. Test the bell now, then choose whether Timer Tree may also send a desktop notice."),
        e("div", { className: "readiness-ledger", role: "status", "aria-live": "polite" },
          e("div", null, e("span", null, "Completion bell"), e("b", null, audioLabel)),
          e("div", null, e("span", null, "Desktop notice"), e("b", null,
            notificationReady ? "Ready" : notificationBlocked ? "Blocked" : notificationUnsupported ? "Unavailable" : "Not enabled"))
        ),
        notificationBlocked
          ? e("p", { className: "permission-help" }, "Notifications are blocked by the browser. Allow notifications for timertree.ca in site settings and reload, or continue with sound only.")
          : null
      ),
      e("div", { className: "sheet-actions setup-actions" },
        e("button", { type: "button", className: "sheet-action secondary", onClick: onTest }, "Test Sound"),
        e("button", {
          type: "button",
          className: "sheet-action primary",
          onClick: onEnableAndStart,
          disabled: notificationBlocked || notificationUnsupported,
        }, notificationLabel),
        e("button", { type: "button", className: "sheet-action secondary", onClick: onSoundOnlyAndStart }, "Sound Only & Start")
      )
    );
  }

  function CompletionSheet({ completedPhase, nextPhase, onBegin, onSkip }) {
    const focusComplete = completedPhase === "focus";
    const longRest = nextPhase === "long";
    const title = focusComplete ? "Time to Rest" : "Ready to Focus";
    const kicker = focusComplete ? "Focus Complete" : "Rest Complete";
    const copy = focusComplete
      ? "Your session has been recorded and your tree has grown. The break timer will wait until you are ready to step away."
      : "Your rest is complete. The next focus session will wait until you choose to begin.";

    return e(
      Sheet,
      { kicker, title, dismissible: false },
      e("div", { className: "transition-copy" },
        e("div", { className: "transition-mark", "aria-hidden": "true" }, focusComplete ? "\u275B" : "\u275C"),
        e("p", null, copy)
      ),
      e("div", { className: "sheet-actions" },
        e("button", { type: "button", className: "sheet-action primary", onClick: onBegin },
          focusComplete ? (longRest ? "Begin Long Rest" : "Begin Rest") : "Begin Focus"),
        focusComplete && onSkip
          ? e("button", { type: "button", className: "sheet-action secondary", onClick: onSkip }, "Skip Rest")
          : null
      )
    );
  }

  Object.assign(window, {
    StatsSheet,
    GardenSheet,
    AboutSheet,
    AlertSetupSheet,
    CompletionSheet,
  });
})();

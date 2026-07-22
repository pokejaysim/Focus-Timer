/* Overlays: Stats ledger, Garden of plates, About colophon.
   Exported to window.{StatsSheet,GardenSheet,AboutSheet}. */
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

  function Sheet({ kicker, title, onClose, children }) {
    return e(
      "div",
      { className: "scrim", onClick: (ev) => { if (ev.target === ev.currentTarget) onClose(); } },
      e(
        "div",
        { className: "sheet", role: "dialog", "aria-modal": "true", "aria-label": title },
        e("button", { type: "button", className: "sheet-close", onClick: onClose, "aria-label": "Close" }, "\u2715"),
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

  Object.assign(window, { StatsSheet, GardenSheet, AboutSheet });
})();

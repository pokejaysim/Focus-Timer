/* PlantPlate — a growing botanical "engraving" rendered as minimal ink
   line-work to match the almanac aesthetic. 5 stages.
   Exported to window.PlantPlate({stage}). */
(function () {
  const e = React.createElement;

  // unit leaf: base at (0,0), tip pointing up to (0,-33)
  const LEAF = "M0,0 C-7,-9 -7,-25 0,-33 C7,-25 7,-9 0,0 Z";

  function Leaf({ y, a, s }) {
    return e(
      "g",
      { transform: `translate(100,${y}) rotate(${a}) scale(${s})` },
      e("path", { className: "leaf", d: LEAF }),
      e("path", { className: "rib", d: "M0,-2 L0,-28" })
    );
  }

  const STAGES = {
    1: { top: 124, leaves: [ {y:132,a:-52,s:.55},{y:132,a:52,s:.55} ] },
    2: { top: 98,  leaves: [ {y:143,a:-62,s:.68},{y:143,a:62,s:.68},{y:121,a:-48,s:.82},{y:121,a:48,s:.82},{y:102,a:-30,s:.7},{y:102,a:30,s:.7} ] },
    3: { top: 76,  leaves: [ {y:147,a:-70,s:.78},{y:147,a:70,s:.78},{y:128,a:-56,s:.95},{y:128,a:56,s:.95},{y:109,a:-44,s:.95},{y:109,a:44,s:.95},{y:91,a:-30,s:.8},{y:91,a:30,s:.8} ] },
    4: { top: 70,  leaves: [ {y:147,a:-70,s:.78},{y:147,a:70,s:.78},{y:128,a:-56,s:.92},{y:128,a:56,s:.92},{y:110,a:-44,s:.9},{y:110,a:44,s:.9} ] },
  };

  function Stem({ top }) {
    const midY = 150 - (150 - top) * 0.5;
    return e("path", {
      className: "stem",
      d: `M100,151 C97,${(150 + midY) / 2} 103,${(midY + top) / 2} 100,${top}`,
    });
  }

  function Flower() {
    const petals = [];
    for (let k = 0; k < 6; k++) {
      petals.push(
        e("ellipse", {
          key: k, cx: 0, cy: -12, rx: 4.6, ry: 9.5,
          className: "petal", transform: `rotate(${k * 60})`,
        })
      );
    }
    return e(
      "g",
      { transform: "translate(100,62)" },
      petals,
      e("circle", { cx: 0, cy: 0, r: 5.2, className: "flower-core" })
    );
  }

  function Pot() {
    return e(
      "g",
      { className: "pot" },
      // soil surface
      e("path", { className: "soil", d: "M71,151 C84,147 116,147 129,151" }),
      // rim band
      e("path", { className: "ink-fill", d: "M64,140 L136,140 L132,151 L68,151 Z" }),
      // body
      e("path", { className: "ink-fill", d: "M68,151 L132,151 L121,189 L79,189 Z" }),
      // hatching
      e("path", { className: "hatch", d: "M89,154 L85,186" }),
      e("path", { className: "hatch", d: "M100,154 L100,187" }),
      e("path", { className: "hatch", d: "M111,154 L115,186" }),
      // base line
      e("path", { className: "base", d: "M82,189 L118,189" })
    );
  }

  function PlantPlate({ stage }) {
    const st = Math.max(0, Math.min(4, stage | 0));
    let plant = null;
    if (st === 0) {
      // a seed nestled in the soil
      plant = e(
        "g",
        null,
        e("path", { className: "hatch", d: "M88,148 L92,151" }),
        e("path", { className: "hatch", d: "M112,148 L108,151" }),
        e("ellipse", { cx: 100, cy: 131, rx: 5.6, ry: 8.2, className: "seed", transform: "rotate(-20 100 131)" }),
        e("path", { className: "rib", d: "M99,126 C95,129 95,134 99,137" })
      );
    } else {
      const cfg = STAGES[st];
      plant = e(
        "g",
        null,
        e(Stem, { top: cfg.top }),
        cfg.leaves.map((l, i) => e(Leaf, { key: i, ...l })),
        st === 4 ? e(Flower, null) : null
      );
    }
    return e(
      "svg",
      { className: "plant-plate", viewBox: "0 0 200 200", role: "img", "aria-label": "Plant at stage " + (st + 1) },
      e("g", { className: "grow", key: st }, plant),
      e(Pot, null)
    );
  }

  window.PlantPlate = PlantPlate;
})();

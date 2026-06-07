/* Dial — clock-style timer ring.
   Two stacked SVGs: a static face (track + ticks + numerals) and a
   rotated arc for live progress. Exported to window.Dial. */
(function () {
  const R = 84;              // progress + track radius
  const C = 2 * Math.PI * R; // circumference
  const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

  function polar(cx, cy, r, deg) {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function Ticks({ style }) {
    if (style === "minimal") {
      // four cardinal hairlines only
      return [0, 90, 180, 270].map((d, i) => {
        const [x1, y1] = polar(100, 100, 91, d - 90);
        const [x2, y2] = polar(100, 100, 85, d - 90);
        return React.createElement("line", {
          key: i, x1, y1, x2, y2, className: "dial-tick major",
        });
      });
    }
    const out = [];
    for (let i = 0; i < 60; i++) {
      const major = i % 5 === 0;
      if (style === "roman" && !major) continue; // roman face: only minute majors
      const deg = i * 6 - 90;
      const inner = major ? 81 : 86;
      const [x1, y1] = polar(100, 100, 91, deg);
      const [x2, y2] = polar(100, 100, inner, deg);
      out.push(
        React.createElement("line", {
          key: i, x1, y1, x2, y2,
          className: "dial-tick" + (major ? " major" : ""),
        })
      );
    }
    return out;
  }

  function Numerals({ style }) {
    if (style !== "roman") return null;
    return ROMAN.map((n, k) => {
      const [x, y] = polar(100, 100, 67, k * 30 - 90);
      return React.createElement(
        "text",
        {
          key: k, x, y, className: "dial-roman",
          textAnchor: "middle", dominantBaseline: "central",
        },
        n
      );
    });
  }

  function Dial({ progress, style }) {
    const offset = C * (1 - Math.max(0, Math.min(1, progress)));
    return React.createElement(
      React.Fragment,
      null,
      // static face
      React.createElement(
        "svg",
        { viewBox: "0 0 200 200", className: "face-svg" },
        React.createElement("circle", { cx: 100, cy: 100, r: R, className: "dial-track" }),
        React.createElement(Ticks, { style }),
        React.createElement(Numerals, { style })
      ),
      // rotated progress arc
      React.createElement(
        "svg",
        { viewBox: "0 0 200 200", className: "prog-svg" },
        React.createElement("circle", {
          cx: 100, cy: 100, r: R, className: "dial-progress",
          strokeDasharray: C, strokeDashoffset: offset,
        })
      )
    );
  }

  window.Dial = Dial;
})();

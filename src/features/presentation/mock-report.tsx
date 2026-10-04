/**
 * Fake 1280×720 Power BI page (SVG, scales with its width).
 * Layout (page px): slicers y 72–118 · KPI cards y 136–236 · line chart x 24–776 y 252–504 ·
 * bar chart x 792–1256 y 252–504 · table x 24–776 y 520–700 · donut x 792–1256 y 520–700.
 */
export function MockReport({ style }: { style?: React.CSSProperties }) {
  const brand = "#26221d";
  const gold = "#b08d57";
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const current = [180, 200, 170, 215, 205, 160, 150, 120, 110, 95, 80, 70];
  const previous = [190, 205, 195, 200, 190, 180, 175, 165, 150, 140, 130, 120];
  const toPath = (values: number[]) =>
    values.map((v, i) => `${i ? "L" : "M"}${60 + i * 62},${v + 260}`).join(" ");
  const regions = [
    ["Category A", 0.92],
    ["Category B", 0.74],
    ["Category C", 0.61],
    ["Category D", 0.48],
    ["Category E", 0.39],
    ["Category F", 0.27],
  ] as const;
  const kpis = [
    ["Total", "4.82K", "+6.4%", true],
    ["Completed", "1.37K", "+2.1%", true],
    ["Items", "12,480", "-1.8%", false],
    ["Average", "386", "+8.3%", true],
  ] as const;

  return (
    <svg
      viewBox="0 0 1280 720"
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      fontFamily="Segoe UI, Inter, sans-serif"
    >
      <rect width="1280" height="720" fill="#faf7f1" />
      {/* header */}
      <rect width="1280" height="56" fill={brand} />
      <text x="24" y="36" fill="#fff" fontSize="20" fontWeight="600">
        Dashboard — Overview
      </text>
      <text x="1256" y="36" fill="#d8c5a3" fontSize="13" textAnchor="end">
        Data as of 10/03/2026 06:00
      </text>

      {/* slicers */}
      {["Period: 2026", "Category: All", "Type: All"].map((label, i) => (
        <g key={label} transform={`translate(${24 + i * 292},72)`}>
          <rect width="276" height="46" rx="6" fill="#fff" stroke="#d9dee5" />
          <text x="14" y="29" fontSize="14" fill="#334">
            {label}
          </text>
          <path
            d="M250 20 l6 7 l6 -7"
            stroke="#889"
            strokeWidth="2"
            fill="none"
          />
        </g>
      ))}

      {/* KPI cards */}
      {kpis.map(([label, value, delta, up], i) => (
        <g key={label} transform={`translate(${24 + i * 312},136)`}>
          <rect width="296" height="100" rx="8" fill="#fff" stroke="#e1e5eb" />
          <rect width="4" height="100" rx="2" fill={gold} />
          <text x="20" y="30" fontSize="13" fill="#667">
            {label}
          </text>
          <text x="20" y="70" fontSize="30" fontWeight="600" fill="#1d2633">
            {value}
          </text>
          <text
            x="276"
            y="70"
            fontSize="15"
            fontWeight="600"
            textAnchor="end"
            fill={up ? "#16a34a" : "#dc2626"}
          >
            {delta}
          </text>
        </g>
      ))}

      {/* line chart */}
      <g>
        <rect
          x="24"
          y="252"
          width="752"
          height="252"
          rx="8"
          fill="#fff"
          stroke="#e1e5eb"
        />
        <text x="40" y="280" fontSize="14" fontWeight="600" fill="#1d2633">
          Monthly trend
        </text>
        <rect x="562" y="300" width="200" height="180" fill="#eef1f5" />
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="44"
            x2="756"
            y1={320 + i * 45}
            y2={320 + i * 45}
            stroke="#eef0f3"
          />
        ))}
        <path
          d={`${toPath(current)} L742,480 L60,480 Z`}
          fill={gold}
          opacity="0.12"
        />
        <path
          d={toPath(previous)}
          fill="none"
          stroke="#9aa6b5"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        <path d={toPath(current)} fill="none" stroke={gold} strokeWidth="3" />
        {months.map((m, i) => (
          <text
            key={i}
            x={60 + i * 62}
            y="498"
            fontSize="11"
            fill="#889"
            textAnchor="middle"
          >
            {m}
          </text>
        ))}
      </g>

      {/* bar chart */}
      <g>
        <rect
          x="792"
          y="252"
          width="464"
          height="252"
          rx="8"
          fill="#fff"
          stroke="#e1e5eb"
        />
        <text x="808" y="280" fontSize="14" fontWeight="600" fill="#1d2633">
          By category
        </text>
        {regions.map(([name, ratio], i) => (
          <g key={name} transform={`translate(808,${300 + i * 32})`}>
            <text y="16" fontSize="12" fill="#556">
              {name}
            </text>
            <rect
              x="110"
              y="3"
              width={310 * ratio}
              height="18"
              rx="1"
              fill={gold}
              opacity={1 - i * 0.12}
            />
            <text x={118 + 310 * ratio} y="17" fontSize="11" fill="#556">
              {(ratio * 1.6).toFixed(2)}K
            </text>
          </g>
        ))}
      </g>

      {/* table */}
      <g>
        <rect
          x="24"
          y="520"
          width="752"
          height="180"
          rx="8"
          fill="#fff"
          stroke="#e1e5eb"
        />
        <text x="40" y="546" fontSize="14" fontWeight="600" fill="#1d2633">
          Top items
        </text>
        {[
          ["Name", "Category", "Value", "Change"],
          ["Item one", "Category A", "412", "+12%"],
          ["Item two", "Category C", "298", "+4%"],
          ["Item three", "Category D", "251", "-3%"],
          ["Item four", "Category E", "187", "+9%"],
        ].map((row, r) => (
          <g key={r} transform={`translate(40,${568 + r * 27})`}>
            {r === 0 && (
              <rect x="-8" y="-16" width="728" height="24" fill="#f1f4f7" />
            )}
            {row.map((cell, c) => (
              <text
                key={c}
                x={[0, 240, 480, 640][c]}
                y="0"
                fontSize="12"
                fontWeight={r === 0 ? 600 : 400}
                fill={
                  c === 3 && r
                    ? cell.startsWith("-")
                      ? "#dc2626"
                      : "#16a34a"
                    : "#334"
                }
              >
                {cell}
              </text>
            ))}
          </g>
        ))}
      </g>

      {/* donut */}
      <g>
        <rect
          x="792"
          y="520"
          width="464"
          height="180"
          rx="8"
          fill="#fff"
          stroke="#e1e5eb"
        />
        <text x="808" y="546" fontSize="14" fontWeight="600" fill="#1d2633">
          Split by type
        </text>
        <g transform="translate(900,622)">
          {[
            [0, 0.52, brand],
            [0.52, 0.8, "#b08d57"],
            [0.8, 1, "#d8c5a3"],
          ].map(([from, to, color], i) => {
            const arc = (t: number) => [
              Math.cos(2 * Math.PI * t - Math.PI / 2) * 52,
              Math.sin(2 * Math.PI * t - Math.PI / 2) * 52,
            ];
            const [x1, y1] = arc(from as number);
            const [x2, y2] = arc(to as number);
            return (
              <path
                key={i}
                d={`M${x1},${y1} A52,52 0 ${(to as number) - (from as number) > 0.5 ? 1 : 0} 1 ${x2},${y2}`}
                stroke={color as string}
                strokeWidth="22"
                fill="none"
              />
            );
          })}
        </g>
        {[
          ["Type A", "52%", brand],
          ["Type B", "28%", "#b08d57"],
          ["Type C", "20%", "#d8c5a3"],
        ].map(([label, value, color], i) => (
          <g key={label} transform={`translate(1010,${588 + i * 30})`}>
            <rect width="12" height="12" rx="3" fill={color} />
            <text x="22" y="11" fontSize="13" fill="#334">
              {label}
            </text>
            <text
              x="220"
              y="11"
              fontSize="13"
              fontWeight="600"
              fill="#1d2633"
              textAnchor="end"
            >
              {value}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

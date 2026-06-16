/**
 * Hand-drawn (SVG) illustrations of the iOS "Add to Home Screen" flow, styled
 * to look like real iPhone screens, with the brand volt color highlighting the
 * exact thing to tap at each step. Pure SVG (no hooks) so they can render
 * anywhere. Used by <InstallGuide>.
 */

const VOLT = "#C6F806";
const SCREEN = "#0A0A0B";
const SHEET = "#1c1c1e";
const SHEET2 = "#2c2c2e";
const HAIR = "#3a3a3c";
const TXT = "#f5f5f7";
const MUT = "#8e8e93";

function Frame({
  clipId,
  label,
  children,
}: {
  clipId: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 320 640"
      className="h-auto w-full"
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="24" y="24" width="272" height="592" rx="40" />
        </clipPath>
      </defs>
      {/* phone body */}
      <rect
        x="14"
        y="14"
        width="292"
        height="612"
        rx="48"
        fill="#0b0b0d"
        stroke="#2c2c30"
        strokeWidth="2"
      />
      <g clipPath={`url(#${clipId})`}>
        <rect x="24" y="24" width="272" height="592" fill={SCREEN} />
        {children}
      </g>
      {/* dynamic island */}
      <rect x="132" y="40" width="56" height="16" rx="8" fill="#000" />
    </svg>
  );
}

function StatusBar() {
  return (
    <g className="font-sans">
      <text x="50" y="52" fill={TXT} fontSize="12" fontWeight={600}>
        9:41
      </text>
      <rect x="248" y="44" width="22" height="11" rx="3" fill="none" stroke={TXT} strokeWidth="1.2" opacity="0.8" />
      <rect x="250" y="46" width="16" height="7" rx="1.5" fill={TXT} opacity="0.8" />
    </g>
  );
}

/** The Stack "summit stack" mark, scaled into a rounded square at (x,y,size). */
function StackMark({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size / 1024;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect width="1024" height="1024" rx="230" fill="#0A0A0B" />
      <rect x="212" y="614" width="600" height="104" rx="52" fill="#3A3A40" />
      <rect x="322" y="460" width="380" height="104" rx="52" fill="#6E6E78" />
      <rect x="422" y="306" width="180" height="104" rx="52" fill={VOLT} />
    </g>
  );
}

/** Mini "Stack." wordmark, left edge at x, baseline at y. */
function MiniWordmark({ x, y, fs }: { x: number; y: number; fs: number }) {
  return (
    <g className="font-sans">
      <text x={x} y={y} fill={TXT} fontSize={fs} fontWeight={800} letterSpacing="-0.02em">
        Stack
      </text>
      <rect x={x + fs * 2.55} y={y - fs * 0.16} width={fs * 0.16} height={fs * 0.16} rx={fs * 0.03} fill={VOLT} />
    </g>
  );
}

/** iOS share glyph (square + up arrow). */
function ShareGlyph({ cx, cy, c }: { cx: number; cy: number; c: string }) {
  return (
    <g stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x={cx - 8} y={cy - 3} width="16" height="15" rx="4" />
      <path d={`M${cx} ${cy + 4} V${cy - 11}`} />
      <path d={`M${cx - 4} ${cy - 7} L${cx} ${cy - 11} L${cx + 4} ${cy - 7}`} />
    </g>
  );
}

/** iOS "Add to Home Screen" glyph (rounded square + plus). */
function BoxPlusGlyph({ cx, cy, c }: { cx: number; cy: number; c: string }) {
  return (
    <g stroke={c} strokeWidth="2" fill="none" strokeLinecap="round">
      <rect x={cx - 9} y={cy - 9} width="18" height="18" rx="5" />
      <path d={`M${cx} ${cy - 4} V${cy + 4} M${cx - 4} ${cy} H${cx + 4}`} />
    </g>
  );
}

function SafariToolbar({ highlightShare }: { highlightShare?: boolean }) {
  return (
    <g className="font-sans">
      <rect x="24" y="536" width="272" height="80" fill="#1a1a1c" />
      <rect x="24" y="536" width="272" height="1" fill={HAIR} />
      {/* address pill */}
      <rect x="64" y="548" width="192" height="32" rx="16" fill={SHEET2} />
      <text x="160" y="568" fill="#c9c9ce" fontSize="11" textAnchor="middle">
        stack-one-tawny.vercel.app
      </text>
      {/* toolbar icons */}
      <g stroke="#9a9aa0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M52 600 l-7 -6 l7 -6" />
        <path d="M88 588 l7 6 l-7 6" opacity="0.5" />
        <rect x="218" y="588" width="14" height="14" rx="3" />
        <path d="M266 588 h12 M266 594 h12 M266 600 h12" />
      </g>
      <ShareGlyph cx={160} cy={596} c={highlightShare ? VOLT : "#c9c9ce"} />
      {highlightShare && (
        <>
          <circle cx="160" cy="596" r="24" fill="none" stroke={VOLT} strokeWidth="2.5" opacity="0.9" />
          <circle cx="160" cy="596" r="24" fill={VOLT} opacity="0.12" />
        </>
      )}
    </g>
  );
}

export function StepSafari({ label }: { label: string }) {
  return (
    <Frame clipId="ill-safari" label={label}>
      <StatusBar />
      <MiniWordmark x={108} y={300} fs={30} />
      <text x="160" y="332" fill={MUT} fontSize="13" textAnchor="middle" className="font-sans">
        Show up. Every day.
      </text>
      <SafariToolbar />
      {/* gentle highlight on the address bar */}
      <rect x="62" y="546" width="196" height="36" rx="18" fill="none" stroke={VOLT} strokeWidth="2" opacity="0.85" />
    </Frame>
  );
}

export function StepShare({ label }: { label: string }) {
  return (
    <Frame clipId="ill-share" label={label}>
      <StatusBar />
      <MiniWordmark x={116} y={290} fs={26} />
      <SafariToolbar highlightShare />
      {/* tap pointer */}
      <circle cx="176" cy="612" r="13" fill={VOLT} opacity="0.25" />
      <circle cx="176" cy="612" r="13" fill="none" stroke={VOLT} strokeWidth="2" />
    </Frame>
  );
}

function ActionRow({
  y,
  text,
  glyph,
  highlight,
}: {
  y: number;
  text: string;
  glyph: "copy" | "reading" | "bookmark" | "home";
  highlight?: boolean;
}) {
  const c = highlight ? VOLT : TXT;
  return (
    <g className="font-sans">
      <text x="48" y={y + 5} fill={c} fontSize="14" fontWeight={highlight ? 600 : 400}>
        {text}
      </text>
      {glyph === "home" ? (
        <BoxPlusGlyph cx={258} cy={y} c={c} />
      ) : (
        <g stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {glyph === "copy" && (
            <>
              <rect x="250" y={y - 8} width="13" height="15" rx="3" />
              <rect x="254" y={y - 4} width="13" height="15" rx="3" />
            </>
          )}
          {glyph === "reading" && <circle cx="258" cy={y} r="8" />}
          {glyph === "bookmark" && <path d={`M252 ${y - 9} h12 v18 l-6 -5 l-6 5 z`} />}
        </g>
      )}
    </g>
  );
}

export function StepAddToHome({ label }: { label: string }) {
  return (
    <Frame clipId="ill-ath" label={label}>
      {/* dimmed page behind the sheet */}
      <rect x="24" y="24" width="272" height="592" fill="#000" opacity="0.45" />
      {/* share sheet */}
      <rect x="24" y="176" width="272" height="440" rx="30" fill={SHEET} />
      <rect x="150" y="190" width="44" height="5" rx="2.5" fill="#48484a" />
      {/* header */}
      <StackMark x={40} y={210} size={36} />
      <g className="font-sans">
        <text x="88" y="226" fill={TXT} fontSize="15" fontWeight={600}>
          Stack
        </text>
        <text x="88" y="244" fill={MUT} fontSize="11">
          stack-one-tawny.vercel.app
        </text>
      </g>
      {/* app share icons row */}
      <g>
        <circle cx="62" cy="296" r="22" fill="#0a84ff" />
        <circle cx="118" cy="296" r="22" fill="#34c759" />
        <circle cx="174" cy="296" r="22" fill="#5e5ce6" />
        <circle cx="230" cy="296" r="22" fill={SHEET2} />
      </g>
      {/* actions list */}
      <rect x="40" y="344" width="240" height="232" rx="16" fill={SHEET2} />
      <ActionRow y={372} text="Copy" glyph="copy" />
      <rect x="48" y="400" width="224" height="1" fill={HAIR} />
      <ActionRow y={428} text="Add to Reading List" glyph="reading" />
      <rect x="48" y="456" width="224" height="1" fill={HAIR} />
      <ActionRow y={484} text="Add Bookmark" glyph="bookmark" />
      <rect x="48" y="512" width="224" height="1" fill={HAIR} />
      <ActionRow y={540} text="Add to Home Screen" glyph="home" highlight />
      {/* highlight ring around the target row */}
      <rect x="44" y="520" width="232" height="40" rx="10" fill="none" stroke={VOLT} strokeWidth="2.5" />
      <rect x="44" y="520" width="232" height="40" rx="10" fill={VOLT} opacity="0.08" />
    </Frame>
  );
}

export function StepAdd({ label }: { label: string }) {
  return (
    <Frame clipId="ill-add" label={label}>
      <rect x="24" y="24" width="272" height="592" fill="#000" opacity="0.45" />
      {/* modal card */}
      <rect x="36" y="150" width="248" height="200" rx="22" fill={SHEET} />
      {/* nav bar */}
      <g className="font-sans">
        <text x="56" y="184" fill={MUT} fontSize="14">
          Cancel
        </text>
        <text x="160" y="184" fill={TXT} fontSize="14" fontWeight={600} textAnchor="middle">
          Add to Home Screen
        </text>
        <text x="264" y="184" fill={VOLT} fontSize="15" fontWeight={700} textAnchor="end">
          Add
        </text>
      </g>
      {/* highlight the Add button */}
      <rect x="238" y="168" width="34" height="24" rx="7" fill="none" stroke={VOLT} strokeWidth="2.5" />
      <rect x="60" y="206" width="1" height="1" fill="none" />
      {/* name + icon row */}
      <StackMark x={56} y={216} size={58} />
      <g className="font-sans">
        <rect x="128" y="216" width="128" height="30" rx="7" fill={SHEET2} />
        <text x="138" y="236" fill={TXT} fontSize="14" fontWeight={600}>
          Stack
        </text>
        <text x="128" y="266" fill={MUT} fontSize="11">
          stack-one-tawny.vercel.app
        </text>
      </g>
      <text x="160" y="318" fill={MUT} fontSize="11" textAnchor="middle" className="font-sans">
        An icon will be added to your Home Screen.
      </text>
    </Frame>
  );
}

export function StepHomeScreen({ label }: { label: string }) {
  const apps = [
    { x: 108, y: 150, c: "#ff6b6b" },
    { x: 166, y: 150, c: "#4dabf7" },
    { x: 224, y: 150, c: "#ffd43b" },
    { x: 50, y: 224, c: "#69db7c" },
    { x: 108, y: 224, c: "#da77f2" },
    { x: 166, y: 224, c: "#ff922b" },
    { x: 224, y: 224, c: "#3bc9db" },
  ];
  return (
    <Frame clipId="ill-home" label={label}>
      <defs>
        <linearGradient id="wallpaper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141417" />
          <stop offset="1" stopColor="#0A0A0B" />
        </linearGradient>
      </defs>
      <rect x="24" y="24" width="272" height="592" fill="url(#wallpaper)" />
      <StatusBar />
      {/* Stack icon (highlighted) top-left of the grid */}
      <g>
        <rect x="38" y="138" width="48" height="48" rx="12" fill="none" stroke={VOLT} strokeWidth="3" />
        <StackMark x={40} y={140} size={44} />
        <text x="62" y="200" fill={TXT} fontSize="11" textAnchor="middle" className="font-sans" fontWeight={600}>
          Stack
        </text>
      </g>
      {/* generic apps */}
      {apps.map((a, i) => (
        <rect key={i} x={a.x - 24} y={a.y - 24} width="48" height="48" rx="12" fill={a.c} opacity="0.85" />
      ))}
      {/* dock */}
      <rect x="44" y="540" width="232" height="74" rx="26" fill="#ffffff" opacity="0.1" />
      {[88, 140, 192, 244].map((x, i) => (
        <rect key={i} x={x - 22} y={555} width="44" height="44" rx="11" fill="#5c5c66" opacity="0.7" />
      ))}
    </Frame>
  );
}

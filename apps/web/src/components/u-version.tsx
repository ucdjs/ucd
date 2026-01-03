interface UVersionProps {
  version: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function UVersion({
  version,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  style,
  className,
}: UVersionProps) {
  // Shorten versions by removing trailing ".0" segments
  // "17.0.0" -> "17", "15.1.0" -> "15.1"
  const label = String(version).replace(/(?:\.0)+$/, "");

  // Ensure numeric size, clamp to maximum 32px
  const numericSize = typeof size === "number" ? size : Number.parseInt(String(size), 10) || 24;
  const effectiveSize = Math.min(numericSize, 32);

  const inlineSizeStyle: React.CSSProperties = {
    width: `${effectiveSize}px`,
    height: `${effectiveSize}px`,
    ...style,
  };

  // Scale font size based on effective size — use larger text so it's readable at small sizes
  const fontSize = effectiveSize >= 32 ? 20 : effectiveSize >= 28 ? 18 : effectiveSize >= 24 ? 16 : 28;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "lucide-custom-version"}
      style={inlineSizeStyle}
      width={undefined}
      height={undefined}
    >
      <rect width="60" height="60" x="2" y="2" rx="4" ry="4" />

      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="600"
        fontFamily="sans-serif"
        fill={color}
        stroke="none"
      >
        {label}
      </text>
    </svg>
  );
}

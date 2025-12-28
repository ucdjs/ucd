export function UcdLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="15 15 70 70"
      width="100%"
      height="100%"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="20" y="20" width="60" height="60" rx="8" fill="#10B981" opacity="0.2" />
      <path d="M35 40 L65 40 M35 50 L55 50 M35 60 L60 60" stroke="#059669" strokeWidth="6" strokeLinecap="round" />
      <circle cx="70" cy="30" r="8" fill="#059669" opacity="0.8" />
    </svg>
  );
}

export default function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#logoGrad)" />

      {/* Stylized HK letter mark */}
      {/* H - left vertical bar */}
      <rect x="7" y="9" width="2.5" height="14" rx="1" fill="white" />
      {/* H - right vertical bar */}
      <rect x="13.5" y="9" width="2.5" height="14" rx="1" fill="white" />
      {/* H - cross bar */}
      <rect x="7" y="14.5" width="9" height="3" rx="1" fill="white" />

      {/* K - main stroke */}
      <rect x="18" y="9" width="2.5" height="14" rx="1" fill="white" />
      {/* K - upper diagonal */}
      <polygon points="20.5,12 23,14.5 20.5,17" fill="white" />
      {/* K - lower diagonal */}
      <polygon points="20.5,17 23,19.5 23,23 20.5,20.5" fill="white" />

      {/* Small star/dot accent */}
      <circle cx="26" cy="8" r="2" fill="#FCD34D" />
    </svg>
  );
}

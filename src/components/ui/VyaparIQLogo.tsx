interface VyaparIQLogoProps {
  size?: number;
  className?: string;
}

export default function VyaparIQLogo({ size = 36, className = "" }: VyaparIQLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="VyaparIQ"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
    />
  );
}

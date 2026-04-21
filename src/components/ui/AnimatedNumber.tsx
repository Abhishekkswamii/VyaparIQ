import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  prefix = "₹",
  decimals = 2,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const controls = animate(prev.current, value, {
      duration: 0.4,
      ease: "easeOut",
      onUpdate(v) {
        node.textContent = `${prefix}${v.toFixed(decimals)}`;
      },
    });

    prev.current = value;
    return () => controls.stop();
  }, [value, prefix, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toFixed(decimals)}
    </span>
  );
}

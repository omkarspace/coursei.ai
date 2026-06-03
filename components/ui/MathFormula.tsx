"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathFormulaProps {
  formula: string;
  display?: boolean;
  className?: string;
}

export function MathFormula({
  formula,
  display = false,
  className = "",
}: MathFormulaProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(formula, ref.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
        });
      } catch (error) {
        if (ref.current) {
          ref.current.textContent = formula;
        }
      }
    }
  }, [formula, display]);

  return (
    <div
      ref={ref}
      className={`math-formula ${display ? "block text-center my-4" : "inline"} ${className}`}
    />
  );
}

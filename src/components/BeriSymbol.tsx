import type { SVGProps } from "react";

/** BERI's curled, double-stem B mark, drawn independently of the device font. */
export function BeriSymbol(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 64 90" fill="currentColor" aria-hidden="true" {...props}>
    <path fillRule="evenodd" d="M10 19 36 21C49 21 56 26 56 34 56 41 51 44 45 45 55 47 60 52 60 60 60 70 50 74 37 73L13 71 14 67C21 68 23 65 23 61L24 31C24 26 20 25 13 25ZM33 27 32 42 37 42C44 42 47 39 47 34 47 29 43 27 37 27ZM32 48 31 66 37 67C46 68 50 64 50 58 50 52 45 49 38 49Z"/>
    <path d="M34 11C42 15 45 5 36 4 24 2 22 16 27 31 32 48 36 65 30 79 27 87 17 87 16 80 15 74 23 73 23 79M12 20C20 29 22 42 18 54 15 65 8 70 4 65" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <path d="M5 18 21 21 24 28 13 24Z"/>
  </svg>;
}

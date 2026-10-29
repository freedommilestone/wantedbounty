'use client';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes } from 'react';

export function usePath() { return usePathname() || '/'; }
/** Keep the existing component API while using Next's real route navigation. */
export function Link(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
 return <NextLink {...props}/>;
}

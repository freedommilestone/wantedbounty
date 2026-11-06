'use client';
import type { ReactNode } from 'react';
import { AuthProvider } from '../auth/AuthProvider';
import { HoldingsProvider } from '../holdings/HoldingsProvider';
import { WalletProvider } from '../wallet';
import { WalletModal } from '../components/WalletModal';

export function Providers({children}:{children:ReactNode}) {
 return <AuthProvider><WalletProvider><HoldingsProvider>{children}<WalletModal/></HoldingsProvider></WalletProvider></AuthProvider>;
}

'use client';
import type { ReactNode } from 'react';
import { AuthProvider } from '../auth/AuthProvider';
import { WalletProvider } from '../wallet';
import { WalletModal } from '../components/WalletModal';

export function Providers({children}:{children:ReactNode}) {
 return <AuthProvider><WalletProvider>{children}<WalletModal/></WalletProvider></AuthProvider>;
}

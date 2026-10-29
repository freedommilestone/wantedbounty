'use client';
import type { ReactNode } from 'react';
import { WalletProvider } from '../wallet';
import { WalletModal } from '../components/WalletModal';

export function Providers({children}:{children:ReactNode}) {
 return <WalletProvider>{children}<WalletModal/></WalletProvider>;
}

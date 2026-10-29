import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import '../styles.css';

export const metadata: Metadata = {
 title: {default:'Wanted Bounty — The $BERI Fleet',template:'%s | Wanted Bounty'},
 description:'Turn your identity into a wanted poster for the BERI community.',
};
export default function RootLayout({children}:{children:ReactNode}) {
 return <html lang="en"><head>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Cinzel:wght@600;700;800;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet"/>
 </head><body><div id="root"><Providers>{children}</Providers></div></body></html>;
}

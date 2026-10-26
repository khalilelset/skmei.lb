import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from 'next/font/google';

export const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-adm-bricolage',
});

export const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-adm-figtree',
});

export const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-adm-jetbrains',
});

export const adminFontVars = `${bricolage.variable} ${figtree.variable} ${jetbrains.variable}`;

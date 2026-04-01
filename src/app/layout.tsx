import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reglado Subvenciones - Buscador de Subvenciones de España",
  description:
    "Busca y encuentra subvenciones activas del gobierno de España. Filtra por nivel administrativo, comunidad autónoma y fecha.",
  keywords:
    "subvenciones, ayudas, becas, España, gobierno, BDNS, convocatorias",
  openGraph: {
    title: "Reglado Subvenciones",
    description:
      "Buscador de subvenciones activas del gobierno de España",
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGR CBC - Sistema de Gestión de Resultados",
  description: "Sistema de gestión de resultados y flujos de trabajo para despacho contable",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

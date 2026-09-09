import './globals.css';
import { AuthProvider } from '../lib/AuthProvider';
import { DataProvider } from '../lib/DataProvider';

export const metadata = {
  title: "Dépôt Pont-d'Ain — Gestion de stock",
  description: 'Gestion de stock — dépôt de Pont-d\'Ain'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
        <div id="print-area"></div>
      </body>
    </html>
  );
}

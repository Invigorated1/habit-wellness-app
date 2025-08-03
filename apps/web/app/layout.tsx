import './globals.css';
import { ClerkProviderWrapper } from './providers/clerk-provider';

export const metadata = {
  title: 'Habit Wellness App',
  description: '',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProviderWrapper>{children}</ClerkProviderWrapper>
      </body>
    </html>
  );
}

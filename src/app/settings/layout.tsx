import { SettingsLayout } from '@/components/SettingsLayout';

export default function SettingsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SettingsLayout>
        {children}
      </SettingsLayout>
    </div>
  );
}

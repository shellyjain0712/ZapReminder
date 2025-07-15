import { SettingsLayout } from '@/components/SettingsLayout';

export default function SettingsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsLayout>{children}</SettingsLayout>;
}

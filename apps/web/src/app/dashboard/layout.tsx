import { TopNav } from '@/components/navigation/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav />
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </>
  );
}
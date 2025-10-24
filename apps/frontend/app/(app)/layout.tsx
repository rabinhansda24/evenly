export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <section className="min-h-screen">
            {children}
        </section>
    );
}

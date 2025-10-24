interface GroupSettlementsPageProps { params: { groupId: string } }

export default function GroupSettlementsPage({ params }: GroupSettlementsPageProps) {
    return (
        <main className="container mx-auto px-6 py-12">
            <h1 className="text-2xl font-semibold">Settlements</h1>
            <p className="text-muted-foreground mt-2">Placeholder screen for settlements history for group {params.groupId}.</p>
        </main>
    );
}

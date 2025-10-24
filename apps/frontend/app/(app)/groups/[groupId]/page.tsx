interface GroupPageProps { params: { groupId: string } }

export default function GroupPage({ params }: GroupPageProps) {
    const { groupId } = params;
    return (
        <main className="container mx-auto px-6 py-12">
            <h1 className="text-2xl font-semibold">Group: {groupId}</h1>
            <p className="text-muted-foreground mt-2">Placeholder screen for group overview, members, balances.</p>
        </main>
    );
}

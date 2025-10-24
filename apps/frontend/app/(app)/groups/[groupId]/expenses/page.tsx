interface GroupExpensesPageProps { params: { groupId: string } }

export default function GroupExpensesPage({ params }: GroupExpensesPageProps) {
    return (
        <main className="container mx-auto px-6 py-12">
            <h1 className="text-2xl font-semibold">Expenses</h1>
            <p className="text-muted-foreground mt-2">Placeholder screen for listing expenses for group {params.groupId}.</p>
        </main>
    );
}

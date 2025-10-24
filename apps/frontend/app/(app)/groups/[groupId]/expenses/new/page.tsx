interface NewExpensePageProps { params: { groupId: string } }

export default function NewExpensePage({ params }: NewExpensePageProps) {
    return (
        <main className="container mx-auto px-6 py-12">
            <h1 className="text-2xl font-semibold">Add Expense</h1>
            <p className="text-muted-foreground mt-2">Placeholder screen for adding a new expense to group {params.groupId}.</p>
        </main>
    );
}

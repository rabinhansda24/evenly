export function Footer() {
    return (
        <footer className="border-t mt-16">
            <div className="container py-8 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Evenly. Split expenses fairly.</p>
            </div>
        </footer>
    )
}

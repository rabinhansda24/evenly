import Link from "next/link"
import { Header } from "@/components/site/header"
import { Footer } from "@/components/site/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Receipt, Calculator, ShieldCheck, Zap, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <Header />
      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 md:px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Split expenses fairly with Evenly
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Create groups, add expenses, and settle up with friends. Real-time updates keep everyone in sync.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="group">
                <Link href="/register">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Create Groups</CardTitle>
                <CardDescription>Organize expenses by trip, event, or household.</CardDescription>
              </CardHeader>
              <CardContent>
                Invite friends and keep everyone’s balances in one place.
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Track Expenses</CardTitle>
                <CardDescription>Log purchases and split them equally.</CardDescription>
              </CardHeader>
              <CardContent>
                Add receipts, who paid, and participants in seconds.
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Settle Up</CardTitle>
                <CardDescription>See who owes what and settle effortlessly.</CardDescription>
              </CardHeader>
              <CardContent>
                Clear debts with simple, transparent settlements.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center mb-8">
            <h2 className="text-3xl font-semibold">How it works</h2>
            <p className="mt-2 text-muted-foreground">Three simple steps to split and settle.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>1. Create a group</CardTitle>
                <CardDescription>Invite friends to your trip or event.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>2. Add expenses</CardTitle>
                <CardDescription>Record who paid and split equally.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>3. Settle up</CardTitle>
                <CardDescription>Everyone sees a clear balance and settles.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="mx-auto max-w-2xl rounded-xl border bg-card text-card-foreground p-8 text-center">
            <h3 className="text-2xl font-semibold">Start splitting fairly today</h3>
            <p className="mt-2 text-muted-foreground">Create your first group in seconds and invite your friends.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">Create a group</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

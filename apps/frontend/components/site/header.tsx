"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function Header() {
    return (
        <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-4 md:px-6 flex h-14 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                    <span>Evenly</span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-6">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost">
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/register">Sign Up</Link>
                        </Button>
                    </div>
                </div>

                {/* Mobile nav */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Open menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72">
                            <nav className="mt-8 grid gap-4">
                                <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link>
                                <Link href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</Link>
                                <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</Link>
                                <div className="h-px bg-border my-2" />
                                <Button asChild variant="ghost">
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/register">Sign Up</Link>
                                </Button>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}

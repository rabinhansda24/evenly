"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false
        const stored = localStorage.getItem('theme')
        if (stored) return stored === 'dark'
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
        const root = document.documentElement
        root.classList.toggle('dark', isDark)
    }, [isDark])

    const toggle = () => {
        const root = document.documentElement
        const next = !isDark
        root.classList.toggle('dark', next)
        localStorage.setItem('theme', next ? 'dark' : 'light')
        setIsDark(next)
    }

    return (
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
    )
}

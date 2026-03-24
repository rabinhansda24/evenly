"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchGroups, createGroup } from '../../store/thunks/groupsThunks'
import { fetchCurrentUser, logoutUser } from '../../store/thunks/authThunks'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Plus, LogOut, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'

export default function Page() {
    const dispatch = useAppDispatch()
    const router = useRouter()
    const groups = useAppSelector(s => s.groups?.items ?? [])
    const user = useAppSelector(s => s.auth.user)
    const authStatus = useAppSelector(s => s.auth.status)

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loadingGroups, setLoadingGroups] = useState(true)
    const [creatingGroup, setCreatingGroup] = useState(false)
    const [showForm, setShowForm] = useState(false)

    useEffect(() => {
        if (authStatus === 'idle') void dispatch(fetchCurrentUser())
    }, [authStatus, dispatch])

    useEffect(() => {
        const load = async () => {
            setLoadingGroups(true)
            try { await dispatch(fetchGroups()) } finally { setLoadingGroups(false) }
        }
        void load()
    }, [dispatch])

    const handleLogout = async () => {
        await dispatch(logoutUser())
        router.push('/')
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        setCreatingGroup(true)
        try {
            await dispatch(createGroup({ name: name.trim(), description: description || null }))
            setName('')
            setDescription('')
            setShowForm(false)
            toast.success('Group created!')
        } catch {
            toast.error('Failed to create group')
        } finally {
            setCreatingGroup(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* App header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                        <span>Evenly</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {user && (
                            <span className="text-sm text-muted-foreground hidden sm:block">
                                {user.name}
                            </span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => void handleLogout()} className="gap-1.5 cursor-pointer">
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Sign out</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Your groups</h1>
                        {!loadingGroups && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {groups.length > 0
                                    ? `${groups.length} group${groups.length !== 1 ? 's' : ''}`
                                    : 'No groups yet'}
                            </p>
                        )}
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="gap-2 cursor-pointer">
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? 'Cancel' : 'New group'}
                    </Button>
                </div>

                {/* Create group form */}
                {showForm && (
                    <Card className="shadow-soft">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Create a new group</CardTitle>
                            <CardDescription>Give your group a name and optional description.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={e => void onSubmit(e)} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="group-name">Group name</Label>
                                    <Input
                                        id="group-name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Goa Trip"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="group-desc">
                                        Description{' '}
                                        <span className="text-muted-foreground font-normal">(optional)</span>
                                    </Label>
                                    <Input
                                        id="group-desc"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="e.g. Weekend trip expenses"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={creatingGroup} className="cursor-pointer">
                                        {creatingGroup ? 'Creating…' : 'Create group'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowForm(false)}
                                        className="cursor-pointer"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Groups list */}
                {loadingGroups ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-5 w-36" />
                                            <Skeleton className="h-4 w-52" />
                                        </div>
                                        <Skeleton className="h-5 w-5 rounded" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 flex flex-col items-center text-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-semibold text-base">No groups yet</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create your first group to start splitting expenses with friends.
                                </p>
                            </div>
                            {!showForm && (
                                <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2 cursor-pointer">
                                    <Plus className="h-4 w-4" />
                                    Create a group
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {groups.map(g => (
                            <Link key={g.id} href={`/groups/${g.id}`}>
                                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30 active:scale-[0.99]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{g.name}</p>
                                                {g.description && (
                                                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                                        {g.description}
                                                    </p>
                                                )}
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

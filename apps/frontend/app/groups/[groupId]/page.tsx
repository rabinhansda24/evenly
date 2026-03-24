"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiUrl } from '../../../src/lib/api'
import { useAppSelector, useAppDispatch } from '../../../store/hooks'
import { fetchCurrentUser } from '../../../store/thunks/authThunks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Trash2, Copy, Check, Link2 } from 'lucide-react'

type Member = { id: string; name: string; email: string; role: string }
type GroupDetail = { id: string; name: string; description: string | null; members: Member[] }
type Expense = {
    id: string; description: string; amount: string; category: string
    paidById: string; paidByName: string; createdAt: string
    participants: { userId: string; name: string; share: string }[]
}
type Balance = { userId: string; name: string; balance: number }

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function GroupDetailSkeleton() {
    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-9 w-32 mt-2" />
            </div>
            {[1, 2, 3].map(i => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default function GroupDetailPage() {
    const { groupId } = useParams<{ groupId: string }>()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const currentUser = useAppSelector(s => s.auth.user)
    const authStatus = useAppSelector(s => s.auth.status)

    const [group, setGroup] = useState<GroupDetail | null>(null)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [balances, setBalances] = useState<Balance[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Invite link
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const [inviteLoading, setInviteLoading] = useState(false)
    const [inviteCopied, setInviteCopied] = useState(false)

    // Add member form
    const [memberEmail, setMemberEmail] = useState('')
    const [memberError, setMemberError] = useState<string | null>(null)
    const [addingMember, setAddingMember] = useState(false)

    // Add expense form
    const [expDesc, setExpDesc] = useState('')
    const [expAmount, setExpAmount] = useState('')
    const [expError, setExpError] = useState<string | null>(null)
    const [addingExpense, setAddingExpense] = useState(false)

    // Settle / delete loading
    const [settlingUserId, setSettlingUserId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const loadAll = useCallback(async () => {
        try {
            const [gRes, eRes, bRes] = await Promise.all([
                fetch(apiUrl(`/api/groups/${groupId}`), { credentials: 'include' }),
                fetch(apiUrl(`/api/groups/${groupId}/expenses`), { credentials: 'include' }),
                fetch(apiUrl(`/api/groups/${groupId}/balances`), { credentials: 'include' }),
            ])

            if (gRes.status === 401 || gRes.status === 404) {
                router.replace('/groups')
                return
            }

            const [gData, eData, bData] = await Promise.all([gRes.json(), eRes.json(), bRes.json()])
            setGroup(gData)
            setExpenses(Array.isArray(eData) ? eData : [])
            setBalances(Array.isArray(bData) ? bData : [])
        } catch {
            setError('Failed to load group data')
        } finally {
            setLoading(false)
        }
    }, [groupId, router])

    useEffect(() => { void loadAll() }, [loadAll])

    useEffect(() => {
        if (authStatus === 'idle') void dispatch(fetchCurrentUser())
    }, [authStatus, dispatch])

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()
        setMemberError(null)
        setAddingMember(true)
        try {
            const res = await fetch(apiUrl(`/api/groups/${groupId}/members`), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: memberEmail }),
            })
            if (res.ok) {
                toast.success('Member added')
                setMemberEmail('')
                void loadAll()
            } else {
                const body = await res.json().catch(() => ({}))
                setMemberError(body?.error?.message || 'Failed to add member')
            }
        } finally {
            setAddingMember(false)
        }
    }

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        setExpError(null)
        if (!group || !currentUser) return

        const amount = parseFloat(expAmount)
        if (isNaN(amount) || amount <= 0) { setExpError('Enter a valid amount'); return }

        setAddingExpense(true)
        try {
            const memberIds = group.members.map(m => m.id)
            const res = await fetch(apiUrl(`/api/groups/${groupId}/expenses`), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: expDesc.trim(),
                    amount,
                    paidById: currentUser.id,
                    splitMode: 'equal',
                    participants: memberIds.map(id => ({ userId: id })),
                }),
            })
            if (res.ok) {
                toast.success('Expense added')
                setExpDesc('')
                setExpAmount('')
                void loadAll()
            } else {
                const body = await res.json().catch(() => ({}))
                setExpError(body?.error?.message || 'Failed to add expense')
            }
        } finally {
            setAddingExpense(false)
        }
    }

    const handleGetInviteLink = async () => {
        setInviteLoading(true)
        try {
            const res = await fetch(apiUrl(`/api/groups/${groupId}/invite`), {
                method: 'POST',
                credentials: 'include',
            })
            if (res.ok) {
                const { token } = await res.json() as { token: string }
                setInviteToken(token)
            } else {
                toast.error('Failed to generate invite link')
            }
        } finally {
            setInviteLoading(false)
        }
    }

    const handleCopyInvite = () => {
        if (!inviteToken) return
        void navigator.clipboard.writeText(`${window.location.origin}/join/${inviteToken}`)
        setInviteCopied(true)
        setTimeout(() => setInviteCopied(false), 2000)
    }

    const handleDeleteExpense = async (expenseId: string) => {
        setDeletingId(expenseId)
        try {
            const res = await fetch(apiUrl(`/api/groups/${groupId}/expenses/${expenseId}`), {
                method: 'DELETE',
                credentials: 'include',
            })
            if (res.ok) { toast.success('Expense deleted'); void loadAll() }
            else toast.error('Failed to delete expense')
        } finally {
            setDeletingId(null)
        }
    }

    const handleSettle = async (toUserId: string, amount: number) => {
        setSettlingUserId(toUserId)
        try {
            const res = await fetch(apiUrl(`/api/groups/${groupId}/settlements`), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toUserId, amount }),
            })
            if (res.ok) { toast.success('Settlement recorded'); void loadAll() }
            else toast.error('Failed to record settlement')
        } finally {
            setSettlingUserId(null)
        }
    }

    if (loading) return <GroupDetailSkeleton />
    if (error) return (
        <div className="p-4 max-w-2xl mx-auto pt-12 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/groups')}>
                Back to groups
            </Button>
        </div>
    )
    if (!group) return null

    const isOwner = group.members.find(m => m.id === currentUser?.id)?.role === 'owner'
    const myBalance = balances.find(b => b.userId === currentUser?.id)

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 -ml-2 mb-3 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => router.push('/groups')}
                >
                    <ArrowLeft className="h-4 w-4" />
                    All groups
                </Button>
                <h1 className="text-2xl font-bold">{group.name}</h1>
                {group.description && <p className="text-muted-foreground mt-0.5">{group.description}</p>}
            </div>

            {/* Balances */}
            <Card>
                <CardHeader className="pb-3"><CardTitle>Balances</CardTitle></CardHeader>
                <CardContent>
                    {balances.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No expenses yet — balances will appear here.</p>
                    ) : (
                        <ul className="space-y-3">
                            {balances.map(b => (
                                <li key={b.userId} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                            {getInitials(b.name)}
                                        </div>
                                        <span className="text-sm truncate">{b.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-sm font-semibold tabular-nums ${b.balance > 0 ? 'text-green-600' : b.balance < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                            {b.balance >= 0 ? `+₹${b.balance.toFixed(2)}` : `-₹${Math.abs(b.balance).toFixed(2)}`}
                                        </span>
                                        {b.userId !== currentUser?.id && b.balance < 0 && myBalance && myBalance.balance > 0 && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={settlingUserId === b.userId}
                                                className="cursor-pointer h-7 text-xs"
                                                onClick={() => void handleSettle(myBalance.userId, Math.min(Math.abs(b.balance), myBalance.balance))}
                                            >
                                                {settlingUserId === b.userId ? 'Settling…' : 'Settle'}
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {/* Members */}
            <Card>
                <CardHeader className="pb-3"><CardTitle>Members ({group.members.length})</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <ul className="space-y-2">
                        {group.members.map(m => (
                            <li key={m.id} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                                        {getInitials(m.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{m.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                                    </div>
                                </div>
                                <Badge variant={m.role === 'owner' ? 'default' : 'secondary'} className="capitalize text-xs flex-shrink-0">
                                    {m.role}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                    {isOwner && (
                        <form onSubmit={e => void handleAddMember(e)} className="flex gap-2 pt-1 border-t">
                            <Input
                                placeholder="Add member by email"
                                type="email"
                                value={memberEmail}
                                onChange={e => setMemberEmail(e.target.value)}
                                required
                            />
                            <Button type="submit" size="sm" disabled={addingMember} className="cursor-pointer whitespace-nowrap">
                                {addingMember ? 'Adding…' : 'Add'}
                            </Button>
                        </form>
                    )}
                    {memberError && (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription>{memberError}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Invite Link (owner only) */}
            {isOwner && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            Invite link
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Share this link — existing users join instantly, new users register first.
                        </p>
                        {inviteToken ? (
                            <div className="flex gap-2 items-center">
                                <Input
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteToken}`}
                                    className="text-xs font-mono"
                                />
                                <Button size="sm" variant="outline" onClick={handleCopyInvite} className="cursor-pointer gap-1.5 flex-shrink-0">
                                    {inviteCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    {inviteCopied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        ) : (
                            <Button size="sm" onClick={() => void handleGetInviteLink()} disabled={inviteLoading} className="cursor-pointer">
                                {inviteLoading ? 'Generating…' : 'Generate invite link'}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Add Expense */}
            <Card>
                <CardHeader className="pb-3"><CardTitle>Add expense</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={e => void handleAddExpense(e)} className="space-y-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="exp-desc">Description</Label>
                            <Input
                                id="exp-desc"
                                value={expDesc}
                                onChange={e => setExpDesc(e.target.value)}
                                placeholder="e.g. Dinner, Hotel, Fuel"
                                required
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="exp-amount">Amount <span className="text-muted-foreground font-normal">(split equally)</span></Label>
                            <Input
                                id="exp-amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={expAmount}
                                onChange={e => setExpAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        {expError && (
                            <Alert variant="destructive" className="py-2">
                                <AlertDescription>{expError}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" disabled={addingExpense} className="cursor-pointer">
                            {addingExpense ? 'Adding…' : 'Add expense'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Expense list */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Expenses {expenses.length > 0 && <span className="text-muted-foreground font-normal text-sm">({expenses.length})</span>}</CardTitle>
                </CardHeader>
                <CardContent>
                    {expenses.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No expenses yet. Add the first one above.</p>
                    ) : (
                        <ul className="divide-y">
                            {expenses.map(exp => (
                                <li key={exp.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{exp.description}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Paid by {exp.paidByName} · <span className="tabular-nums">₹{Number(exp.amount).toFixed(2)}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatDate(exp.createdAt)}</p>
                                    </div>
                                    {(exp.paidById === currentUser?.id || isOwner) && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 cursor-pointer flex-shrink-0 h-8 w-8 p-0"
                                            disabled={deletingId === exp.id}
                                            aria-label="Delete expense"
                                            onClick={() => void handleDeleteExpense(exp.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

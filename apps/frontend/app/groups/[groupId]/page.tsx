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
import { toast } from 'sonner'

type Member = { id: string; name: string; email: string; role: string }
type GroupDetail = { id: string; name: string; description: string | null; members: Member[] }
type Expense = {
    id: string; description: string; amount: string; category: string
    paidById: string; paidByName: string; createdAt: string
    participants: { userId: string; name: string; share: string }[]
}
type Balance = { userId: string; name: string; balance: number }

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

    // Add expense form
    const [expDesc, setExpDesc] = useState('')
    const [expAmount, setExpAmount] = useState('')
    const [expError, setExpError] = useState<string | null>(null)

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
    }

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        setExpError(null)
        if (!group || !currentUser) return

        const amount = parseFloat(expAmount)
        if (isNaN(amount) || amount <= 0) { setExpError('Enter a valid amount'); return }

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
    }

    const handleGetInviteLink = async () => {
        setInviteLoading(true)
        const res = await fetch(apiUrl(`/api/groups/${groupId}/invite`), {
            method: 'POST',
            credentials: 'include',
        })
        setInviteLoading(false)
        if (res.ok) {
            const { token } = await res.json() as { token: string }
            setInviteToken(token)
        } else {
            toast.error('Failed to generate invite link')
        }
    }

    const handleCopyInvite = () => {
        if (!inviteToken) return
        void navigator.clipboard.writeText(`${window.location.origin}/join/${inviteToken}`)
        setInviteCopied(true)
        setTimeout(() => setInviteCopied(false), 2000)
    }

    const handleDeleteExpense = async (expenseId: string) => {
        const res = await fetch(apiUrl(`/api/groups/${groupId}/expenses/${expenseId}`), {
            method: 'DELETE',
            credentials: 'include',
        })
        if (res.ok) { toast.success('Expense deleted'); void loadAll() }
        else toast.error('Failed to delete expense')
    }

    const handleSettle = async (toUserId: string, amount: number) => {
        const res = await fetch(apiUrl(`/api/groups/${groupId}/settlements`), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toUserId, amount }),
        })
        if (res.ok) { toast.success('Settlement recorded'); void loadAll() }
        else toast.error('Failed to record settlement')
    }

    if (loading) return <div className="p-4">Loading…</div>
    if (error) return <div className="p-4 text-red-600">{error}</div>
    if (!group) return null

    const isOwner = group.members.find(m => m.id === currentUser?.id)?.role === 'owner'
    const myBalance = balances.find(b => b.userId === currentUser?.id)

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">{group.name}</h1>
                {group.description && <p className="text-muted-foreground">{group.description}</p>}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/groups')}>
                    ← Back to groups
                </Button>
            </div>

            {/* Balances */}
            <Card>
                <CardHeader><CardTitle>Balances</CardTitle></CardHeader>
                <CardContent>
                    {balances.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No expenses yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {balances.map(b => (
                                <li key={b.userId} className="flex items-center justify-between">
                                    <span>{b.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={b.balance >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                            {b.balance >= 0 ? `+₹${b.balance.toFixed(2)}` : `-₹${Math.abs(b.balance).toFixed(2)}`}
                                        </span>
                                        {b.userId !== currentUser?.id && b.balance < 0 && myBalance && myBalance.balance > 0 && (
                                            <Button size="sm" variant="outline"
                                                onClick={() => void handleSettle(myBalance.userId, Math.min(Math.abs(b.balance), myBalance.balance))}>
                                                Settle
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
                <CardHeader><CardTitle>Members ({group.members.length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <ul className="space-y-1">
                        {group.members.map(m => (
                            <li key={m.id} className="flex items-center justify-between text-sm">
                                <span>{m.name} <span className="text-muted-foreground">({m.email})</span></span>
                                <span className="capitalize text-xs bg-muted px-2 py-0.5 rounded">{m.role}</span>
                            </li>
                        ))}
                    </ul>
                    {isOwner && (
                        <form onSubmit={handleAddMember} className="flex gap-2 pt-2">
                            <Input
                                placeholder="Add by email"
                                type="email"
                                value={memberEmail}
                                onChange={e => setMemberEmail(e.target.value)}
                                required
                            />
                            <Button type="submit" size="sm">Add</Button>
                        </form>
                    )}
                    {memberError && (
                        <Alert><AlertDescription className="text-red-600">{memberError}</AlertDescription></Alert>
                    )}
                </CardContent>
            </Card>

            {/* Invite Link (owner only) */}
            {isOwner && (
                <Card>
                    <CardHeader><CardTitle>Invite Members</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Share this link. Anyone who opens it can join — existing users join instantly, new users are prompted to register first.
                        </p>
                        {inviteToken ? (
                            <div className="flex gap-2 items-center">
                                <Input
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteToken}`}
                                    className="text-xs font-mono"
                                />
                                <Button size="sm" variant="outline" onClick={handleCopyInvite}>
                                    {inviteCopied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        ) : (
                            <Button size="sm" onClick={() => void handleGetInviteLink()} disabled={inviteLoading}>
                                {inviteLoading ? 'Generating…' : 'Get invite link'}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Add Expense */}
            <Card>
                <CardHeader><CardTitle>Add Expense</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleAddExpense} className="space-y-3">
                        <div className="grid gap-1">
                            <Label htmlFor="exp-desc">Description</Label>
                            <Input id="exp-desc" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="e.g. Dinner" required />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="exp-amount">Amount (split equally among all members)</Label>
                            <Input id="exp-amount" type="number" min="0.01" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" required />
                        </div>
                        {expError && <Alert><AlertDescription className="text-red-600">{expError}</AlertDescription></Alert>}
                        <Button type="submit">Add expense</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Expense list */}
            <Card>
                <CardHeader><CardTitle>Expenses ({expenses.length})</CardTitle></CardHeader>
                <CardContent>
                    {expenses.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No expenses yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {expenses.map(exp => (
                                <li key={exp.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{exp.description}</p>
                                        <p className="text-muted-foreground">
                                            Paid by {exp.paidByName} · ₹{Number(exp.amount).toFixed(2)}
                                        </p>
                                    </div>
                                    {(exp.paidById === currentUser?.id || isOwner) && (
                                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700"
                                            onClick={() => void handleDeleteExpense(exp.id)}>
                                            Delete
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

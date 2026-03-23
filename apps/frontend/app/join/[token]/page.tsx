"use client"
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchCurrentUser } from '../../../store/thunks/authThunks'
import { apiUrl } from '../../../src/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type GroupInfo = { id: string; name: string; description: string | null }

export default function JoinPage() {
    const { token } = useParams<{ token: string }>()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const user = useAppSelector(s => s.auth.user)
    const authStatus = useAppSelector(s => s.auth.status)

    const [group, setGroup] = useState<GroupInfo | null>(null)
    const [groupError, setGroupError] = useState<string | null>(null)
    const [joining, setJoining] = useState(false)
    const joinedRef = useRef(false)

    // Fetch group info from public endpoint
    useEffect(() => {
        fetch(apiUrl(`/api/invites/${token}`))
            .then(res => {
                if (!res.ok) throw new Error('invalid')
                return res.json() as Promise<GroupInfo>
            })
            .then(setGroup)
            .catch(() => setGroupError('This invite link is invalid or has expired.'))
    }, [token])

    // Ensure auth state is resolved
    useEffect(() => {
        if (authStatus === 'idle') {
            void dispatch(fetchCurrentUser())
        }
    }, [authStatus, dispatch])

    // Auto-join once both group info and auth state are ready and user is logged in
    useEffect(() => {
        if (authStatus !== 'ready' || !user || !group || joinedRef.current) return
        joinedRef.current = true
        setJoining(true)
        fetch(apiUrl(`/api/invites/${token}/join`), { method: 'POST', credentials: 'include' })
            .then(res => res.json())
            .then((data: { groupId: string }) => {
                router.replace(`/groups/${data.groupId}`)
            })
            .catch(() => {
                joinedRef.current = false
                setJoining(false)
                setGroupError('Failed to join group. Please try again.')
            })
    }, [authStatus, user, group, token, router])

    if (groupError) {
        return (
            <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Invalid Invite</CardTitle>
                        <CardDescription>{groupError}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/groups">
                            <Button variant="outline">Go to Groups</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!group || authStatus === 'idle' || authStatus === 'loading') {
        return <div className="p-4 text-muted-foreground">Loading…</div>
    }

    if (joining) {
        return <div className="p-4 text-muted-foreground">Joining {group.name}…</div>
    }

    // User is not logged in — show sign-in / register options
    return (
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Join {group.name}</CardTitle>
                    {group.description && (
                        <CardDescription>{group.description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Sign in or create a free account to join this group.
                    </p>
                    <div className="flex gap-2">
                        <Link href={`/login?next=/join/${token}`} className="flex-1">
                            <Button className="w-full">Sign in</Button>
                        </Link>
                        <Link href={`/register?next=/join/${token}`} className="flex-1">
                            <Button variant="outline" className="w-full">Create account</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

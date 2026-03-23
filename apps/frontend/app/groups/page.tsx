"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchGroups, createGroup } from '../../store/thunks/groupsThunks'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function Page() {
    const dispatch = useAppDispatch()
    const groups = useAppSelector(s => s.groups?.items ?? [])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        void dispatch(fetchGroups())
    }, [dispatch])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        await dispatch(createGroup({ name: name.trim(), description: description || null }))
        setName('')
        setDescription('')
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">Groups</h1>

            <form onSubmit={onSubmit} className="space-y-3">
                <div className="grid gap-2">
                    <Label htmlFor="group-name">Group name</Label>
                    <Input
                        id="group-name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Goa Trip"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="group-desc">Description</Label>
                    <Input
                        id="group-desc"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Optional"
                    />
                </div>
                <Button type="submit">Create group</Button>
            </form>

            <ul className="space-y-2">
                {groups.map(g => (
                    <li key={g.id}>
                        <Link href={`/groups/${g.id}`} className="text-primary hover:underline font-medium">
                            {g.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

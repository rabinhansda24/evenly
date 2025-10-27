"use client"
import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchGroups, createGroup } from '../../src/store/thunks/groupsThunks'

export default function Page() {
    const dispatch = useAppDispatch()
    const groups = useAppSelector(s => s.groups?.items ?? [])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        // load groups on mount
        // @ts-expect-error thunk type
        dispatch(fetchGroups())
    }, [dispatch])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        // @ts-expect-error thunk type
        await dispatch(createGroup({ name: name.trim(), description: description || null }))
        setName('')
        setDescription('')
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">Groups</h1>

            <form onSubmit={onSubmit} className="space-y-2">
                <div className="flex flex-col gap-1">
                    <label htmlFor="group-name">Group name</label>
                    <input
                        id="group-name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="border rounded px-2 py-1"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="group-desc">Description</label>
                    <input
                        id="group-desc"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="border rounded px-2 py-1"
                    />
                </div>
                <button type="submit" className="border rounded px-3 py-1">
                    Create group
                </button>
            </form>

            <ul className="list-disc pl-5">
                {groups.map(g => (
                    <li key={g.id}>{g.name}</li>
                ))}
            </ul>
        </div>
    )
}

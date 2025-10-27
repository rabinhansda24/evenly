// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../../../../store/store'
// Red: Page does not exist yet; implement at app/groups/page.tsx
import Page from '../../page'

describe('Groups Page (integration)', () => {
    const originalFetch = globalThis.fetch
    const groups = [{ id: 'g1', name: 'Trip', description: 'Goa', createdById: 'u1' }]
    const created = { id: 'g2', name: 'New Group', description: 'Desc', createdById: 'u1' }

    beforeEach(() => {
        vi.restoreAllMocks()
            // Mock fetch for GET and POST
            ; (globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn().mockImplementation((url: RequestInfo, init?: RequestInit) => {
                const u = typeof url === 'string' ? url : (url as URL).toString()
                if (u.endsWith('/api/groups') && init?.method === 'POST') {
                    return Promise.resolve({ ok: true, json: async () => created } as Response)
                }
                if (u.endsWith('/api/groups')) {
                    return Promise.resolve({ ok: true, json: async () => groups } as Response)
                }
                return Promise.resolve({ ok: true, json: async () => ({}) } as Response)
            })
    })

    afterEach(() => {
        vi.resetAllMocks()
            ; (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch as any
    })

    it('lists groups on load and creates a new group', async () => {
        render(
            <Provider store={store}>
                {/* @ts-expect-error next page type */}
                <Page />
            </Provider>
        )

        // Lists groups
        expect(await screen.findByText('Trip')).toBeInTheDocument()

        // Create a new group
        fireEvent.change(screen.getByLabelText('Group name'), { target: { value: 'New Group' } })
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Desc' } })
        fireEvent.click(screen.getByRole('button', { name: 'Create group' }))

        await waitFor(async () => {
            expect(await screen.findByText('New Group')).toBeInTheDocument()
        })
    })
})

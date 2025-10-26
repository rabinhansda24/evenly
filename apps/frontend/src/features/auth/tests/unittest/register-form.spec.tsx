import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../../components/register-form'

describe('RegisterForm', () => {
    it('renders fields and calls onSubmit', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn()
        render(<RegisterForm onSubmit={onSubmit} />)

        await user.type(screen.getByLabelText(/email/i), 'bob@example.com')
        await user.type(screen.getByLabelText(/name/i), 'Bob')
        await user.type(screen.getByLabelText(/password/i), 'Password123!')
        await user.click(screen.getByRole('button', { name: /sign up|register/i }))

        expect(onSubmit).toHaveBeenCalledWith({ email: 'bob@example.com', name: 'Bob', password: 'Password123!' })
    })
})

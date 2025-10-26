import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '../../components/login-form'

describe('LoginForm', () => {
    it('renders email, password inputs and submit button, and calls onSubmit', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn()
        render(<LoginForm onSubmit={onSubmit} />)

        const email = screen.getByLabelText(/email/i)
        const password = screen.getByLabelText(/password/i)
        const submit = screen.getByRole('button', { name: /log in|sign in/i })

        await user.type(email, 'alice@example.com')
        await user.type(password, 'Password123!')
        await user.click(submit)

        expect(onSubmit).toHaveBeenCalledWith({ email: 'alice@example.com', password: 'Password123!' })
    })
})

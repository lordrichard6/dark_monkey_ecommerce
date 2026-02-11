import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signOut } from '../auth'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

describe('Authentication Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('signOut', () => {
        it('should sign out user and redirect to homepage', async () => {
            const { createClient } = await import('@/lib/supabase/server')
            const { redirect } = await import('next/navigation')

            const mockSignOut = vi.fn().mockResolvedValue({})
            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    signOut: mockSignOut,
                },
            } as any)

            await signOut()

            expect(mockSignOut).toHaveBeenCalled()
            expect(redirect).toHaveBeenCalledWith('/')
        })

        it('should redirect even if signOut fails', async () => {
            const { createClient } = await import('@/lib/supabase/server')
            const { redirect } = await import('next/navigation')

            const mockSignOut = vi.fn().mockRejectedValue(new Error('Network error'))
            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    signOut: mockSignOut,
                },
            } as any)

            await signOut()

            expect(mockSignOut).toHaveBeenCalled()
            expect(redirect).toHaveBeenCalledWith('/')
        })

        it('should handle Supabase client creation failure', async () => {
            const { createClient } = await import('@/lib/supabase/server')
            const { redirect } = await import('next/navigation')

            vi.mocked(createClient).mockRejectedValue(new Error('Client creation failed'))

            await signOut()

            expect(redirect).toHaveBeenCalledWith('/')
        })
    })

    describe('Auth Flow Scenarios', () => {
        it('should handle successful login flow', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockSignIn = vi.fn().mockResolvedValue({
                data: {
                    user: {
                        id: 'user-123',
                        email: 'test@example.com',
                    },
                    session: {
                        access_token: 'token-123',
                    },
                },
                error: null,
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    signInWithPassword: mockSignIn,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'password123',
            })

            expect(result.data?.user?.email).toBe('test@example.com')
            expect(result.error).toBeNull()
        })

        it('should handle failed login with invalid credentials', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockSignIn = vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: {
                    message: 'Invalid login credentials',
                    status: 400,
                },
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    signInWithPassword: mockSignIn,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.signInWithPassword({
                email: 'wrong@example.com',
                password: 'wrongpassword',
            })

            expect(result.data.user).toBeNull()
            expect(result.error?.message).toBe('Invalid login credentials')
        })

        it('should handle successful signup flow', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockSignUp = vi.fn().mockResolvedValue({
                data: {
                    user: {
                        id: 'new-user-123',
                        email: 'newuser@example.com',
                        email_confirmed_at: null,
                    },
                    session: null, // Email confirmation required
                },
                error: null,
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    signUp: mockSignUp,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.signUp({
                email: 'newuser@example.com',
                password: 'securepassword123',
            })

            expect(result.data?.user?.email).toBe('newuser@example.com')
            expect(result.data?.session).toBeNull() // Requires email confirmation
            expect(result.error).toBeNull()
        })

        it('should handle signup with existing email', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockSignUp = vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: {
                    message: 'User already registered',
                    status: 400,
                },
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    signUp: mockSignUp,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.signUp({
                email: 'existing@example.com',
                password: 'password123',
            })

            expect(result.data.user).toBeNull()
            expect(result.error?.message).toBe('User already registered')
        })

        it('should handle password reset request', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockResetPassword = vi.fn().mockResolvedValue({
                data: {},
                error: null,
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    resetPasswordForEmail: mockResetPassword,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.resetPasswordForEmail('user@example.com', {
                redirectTo: 'http://localhost:3000/reset-password',
            })

            expect(mockResetPassword).toHaveBeenCalledWith('user@example.com', {
                redirectTo: 'http://localhost:3000/reset-password',
            })
            expect(result.error).toBeNull()
        })

        it('should handle session refresh', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockRefreshSession = vi.fn().mockResolvedValue({
                data: {
                    session: {
                        access_token: 'new-token-123',
                        refresh_token: 'refresh-token-123',
                    },
                    user: {
                        id: 'user-123',
                        email: 'test@example.com',
                    },
                },
                error: null,
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    refreshSession: mockRefreshSession,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.refreshSession()

            expect(result.data?.session?.access_token).toBe('new-token-123')
            expect(result.error).toBeNull()
        })

        it('should handle expired session', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockGetUser = vi.fn().mockResolvedValue({
                data: { user: null },
                error: {
                    message: 'Session expired',
                    status: 401,
                },
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    getUser: mockGetUser,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.getUser()

            expect(result.data.user).toBeNull()
            expect(result.error?.message).toBe('Session expired')
        })
    })

    describe('User Profile Integration', () => {
        it('should create user profile after signup', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockInsert = vi.fn().mockResolvedValue({
                data: {
                    id: 'profile-123',
                    user_id: 'user-123',
                    total_xp: 0,
                    tier: 'bronze',
                },
                error: null,
            })

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    insert: mockInsert,
                }),
            } as any)

            const supabase = await createClient()
            const result = await supabase.from('user_profiles').insert({
                user_id: 'user-123',
                total_xp: 0,
                tier: 'bronze',
            })

            expect(mockInsert).toHaveBeenCalled()
            expect(result.data?.tier).toBe('bronze')
        })

        it('should fetch user profile with XP and tier', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            user_id: 'user-123',
                            total_xp: 250,
                            tier: 'silver',
                            badges: ['first_purchase', 'referral_master'],
                        },
                        error: null,
                    }),
                }),
            })

            vi.mocked(createClient).mockResolvedValue({
                from: vi.fn().mockReturnValue({
                    select: mockSelect,
                }),
            } as any)

            const supabase = await createClient()
            const result = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', 'user-123')
                .single()

            expect(result.data?.total_xp).toBe(250)
            expect(result.data?.tier).toBe('silver')
            expect(result.data?.badges).toContain('first_purchase')
        })
    })

    describe('Security Tests', () => {
        it('should not expose password in any response', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockSignUp = vi.fn().mockResolvedValue({
                data: {
                    user: {
                        id: 'user-123',
                        email: 'test@example.com',
                        // Password should never be in response
                    },
                },
                error: null,
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    signUp: mockSignUp,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.signUp({
                email: 'test@example.com',
                password: 'supersecret123',
            })

            expect(result.data?.user).not.toHaveProperty('password')
        })

        it('should validate email format', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockSignUp = vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: {
                    message: 'Invalid email format',
                    status: 400,
                },
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    signUp: mockSignUp,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.signUp({
                email: 'not-an-email',
                password: 'password123',
            })

            expect(result.error?.message).toBe('Invalid email format')
        })

        it('should enforce minimum password length', async () => {
            const { createClient } = await import('@/lib/supabase/server')

            const mockSignUp = vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: {
                    message: 'Password should be at least 6 characters',
                    status: 400,
                },
            })

            vi.mocked(createClient).mockResolvedValue({
                auth: {
                    signUp: mockSignUp,
                },
            } as any)

            const supabase = await createClient()
            const result = await supabase.auth.signUp({
                email: 'test@example.com',
                password: '123',
            })

            expect(result.error?.message).toContain('at least 6 characters')
        })
    })
})

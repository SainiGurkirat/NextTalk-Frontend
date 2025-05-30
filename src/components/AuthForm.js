import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

const AuthForm = ({ formType }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const { login, register } = useAuth()
    const isLogin = formType === 'login'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            let result
            if (isLogin) {
                result = await login(email, password)
            } else {
                result = await register({ username, email, password })
            }

            if (!result.success) {
                throw new Error(result.error || 'authentication failed')
            }
        } catch (err) {
            setError(err.message || 'an unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md mx-auto my-10">
            <h2 className="text-3xl font-bold text-white text-center mb-6">
                {isLogin ? 'login' : 'register'}
            </h2>

            {error && (
                <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div>
                        <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
                            username
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                )}
                <div>
                    <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
                        email
                    </label>
                    <input
                        type="email"
                        id="email"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
                        password
                    </label>
                    <input
                        type="password"
                        id="password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'loading...' : (isLogin ? 'login' : 'register')}
                </button>
            </form>

            <div className="mt-6 text-center text-gray-300">
                {isLogin ? (
                    <p>
                        need an account{' '}
                        <Link href="/register" className="text-blue-400 hover:underline">
                            register
                        </Link>
                    </p>
                ) : (
                    <p>
                        already have an account{' '}
                        <Link href="/login" className="text-blue-400 hover:underline">
                            login
                        </Link>
                    </p>
                )}
            </div>
        </div>
    )
}

export default AuthForm

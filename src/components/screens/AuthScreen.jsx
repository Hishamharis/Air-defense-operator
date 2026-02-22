import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Keyboard, Loader2 } from 'lucide-react';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [identifier, setIdentifier] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, register, error } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (isLogin) {
            await login(identifier, password);
        } else {
            await register(username, email, password, confirmPassword);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-crt-black text-phosphor-green font-mono flex items-center justify-center p-4 crt">
            <div className="w-full max-w-md border border-phosphor-green/30 p-8 pt-6 relative bg-black/60 backdrop-blur-sm">

                {/* Header elements */}
                <div className="flex items-center justify-center mb-6">
                    <Shield className="w-10 h-10 text-phosphor-green mr-3 animate-pulse" />
                    <h1 className="text-2xl tracking-widest font-bold">AIR DEFENSE COMMAND</h1>
                </div>

                <div className="text-center mb-6 border-b border-phosphor-green/20 pb-4">
                    <p className="text-sm opacity-80">AUTHENTICATION GATEWAY</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                        [ERROR] {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isLogin ? (
                        <>
                            <div>
                                <label className="block text-xs mb-1 opacity-80">OPERATOR ID/EMAIL</label>
                                <div className="relative">
                                    <Keyboard className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 opacity-50" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black border border-phosphor-green/30 p-2 pl-9 focus:outline-none focus:border-phosphor-green text-phosphor-green placeholder:text-phosphor-green/30 transition-colors"
                                        placeholder="Enter credentials..."
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs mb-1 opacity-80">SECURITY CODE</label>
                                <div className="relative">
                                    <Keyboard className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 opacity-50" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-black border border-phosphor-green/30 p-2 pl-9 focus:outline-none focus:border-phosphor-green text-phosphor-green placeholder:text-phosphor-green/30 transition-colors"
                                        placeholder="Enter password..."
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs mb-1 opacity-80">DESIRED CALLSIGN</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black border border-phosphor-green/30 p-2 focus:outline-none focus:border-phosphor-green text-phosphor-green placeholder:text-phosphor-green/30 transition-colors"
                                    placeholder="Username..."
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1 opacity-80">COMMS RELAY (EMAIL)</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-black border border-phosphor-green/30 p-2 focus:outline-none focus:border-phosphor-green text-phosphor-green placeholder:text-phosphor-green/30 transition-colors"
                                    placeholder="Email..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1 opacity-80">SECURITY CODE</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black border border-phosphor-green/30 p-2 focus:outline-none focus:border-phosphor-green text-phosphor-green placeholder:text-phosphor-green/30 transition-colors"
                                    placeholder="Password..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1 opacity-80">CONFIRM SECURITY CODE</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black border border-phosphor-green/30 p-2 focus:outline-none focus:border-phosphor-green text-phosphor-green placeholder:text-phosphor-green/30 transition-colors"
                                    placeholder="Confirm Password..."
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-phosphor-green/10 hover:bg-phosphor-green/20 border border-phosphor-green text-phosphor-green font-bold tracking-widest transition-all focus:outline-none focus:ring-1 focus:ring-phosphor-green flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                isLogin ? 'INITIATE UPLINK' : 'REQUEST CLEARANCE'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="text-xs opacity-60 hover:opacity-100 hover:text-white transition-opacity underline decoration-phosphor-green/30 underline-offset-4 focus:outline-none"
                    >
                        {isLogin ? "No clearance? Register for a command code." : "Already have clearance? Initiate uplink."}
                    </button>
                </div>

                {/* Corner decorative bracket things */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-phosphor-green"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-phosphor-green"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-phosphor-green"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-phosphor-green"></div>
            </div>
        </div>
    );
}

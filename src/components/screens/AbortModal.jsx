import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AbortModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center font-display p-6 overflow-hidden">
                    {/* Background Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background-dark/90 backdrop-blur-sm z-0"
                        onClick={onClose}
                    />

                    {/* CRT Effect Overlay within modal */}
                    <div className="fixed inset-0 crt-overlay mix-blend-overlay opacity-40 z-10 pointer-events-none"></div>

                    {/* Main Modal Overlay Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="max-w-3xl w-full bg-background-dark border-2 border-primary/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden relative z-20"
                    >
                        {/* Inner Glow / Frame */}
                        <div className="absolute inset-0 border-[16px] border-background-dark pointer-events-none z-20 opacity-50"></div>

                        <div className="p-8 md:p-12 flex flex-col items-center text-center space-y-8 relative z-30">

                            {/* Alert Header */}
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-danger/20 border border-danger/40 text-danger animate-pulse">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    <span className="text-xs font-bold tracking-[0.2em] uppercase">Priority Alpha Clearance Required</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tighter uppercase leading-none drop-shadow-[0_0_8px_rgba(84,207,23,0.6)]">
                                    Mission Termination
                                </h1>
                                <p className="text-primary/60 text-sm font-medium tracking-[0.1em] uppercase">
                                    Secure Command Authorization Sequence
                                </p>
                            </div>

                            {/* Dual Key Authentication Panel */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                                {/* Key 01 */}
                                <div className="relative group">
                                    <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-primary/30 bg-primary/5 transition-all">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin duration-[3000ms]"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-primary drop-shadow-[0_0_8px_rgba(84,207,23,0.6)]">key</span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">Key 01: Engaged</p>
                                            <p className="text-[10px] font-mono text-primary/40">S/N: 992-XA-BLOCK-4</p>
                                            <div className="mt-2 text-[10px] py-1 px-2 bg-primary/20 text-primary rounded inline-block font-bold">STATUS: INSERTED</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key 02 */}
                                <div className="relative group">
                                    <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-primary/30 bg-primary/5 transition-all">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin duration-[4000ms] transition-transform"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-primary drop-shadow-[0_0_8px_rgba(84,207,23,0.6)]">key</span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">Key 02: Engaged</p>
                                            <p className="text-[10px] font-mono text-primary/40">S/N: 441-ZB-BLOCK-9</p>
                                            <div className="mt-2 text-[10px] py-1 px-2 bg-primary/20 text-primary rounded inline-block font-bold">STATUS: INSERTED</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Final Confirmation Text */}
                            <div className="space-y-4 max-w-xl">
                                <h2 className="text-3xl font-bold tracking-widest text-primary drop-shadow-[0_0_8px_rgba(84,207,23,0.6)] uppercase font-mono">
                                    Terminate Command?
                                </h2>
                                <div className="p-4 bg-danger/10 border-l-4 border-danger rounded-r-lg text-left">
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                        <strong className="text-danger uppercase tracking-wider">Warning:</strong>
                                        {' '}This operation will execute a complete wipe of all active tracking telemetry and localized engagement data. This action is{' '}
                                        <span className="text-danger underline decoration-danger/40">irreversible</span>.
                                    </p>
                                </div>
                            </div>

                            {/* Hazard Strip Framed Buttons */}
                            <div className="w-full relative py-4">
                                <div className="absolute left-0 right-0 top-0 h-2 opacity-50 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_10px,#000_10px,#000_20px)]"></div>
                                <div className="absolute left-0 right-0 bottom-0 h-2 opacity-50 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_10px,#000_10px,#000_20px)]"></div>

                                <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-6">
                                    <button
                                        onClick={onConfirm}
                                        className="w-full md:w-auto min-w-[240px] px-8 py-4 bg-danger text-white rounded-lg font-black text-lg tracking-[0.2em] uppercase hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">cancel</span>
                                        Abort Mission
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full md:w-auto min-w-[240px] px-8 py-4 bg-primary text-background-dark rounded-lg font-black text-lg tracking-[0.2em] uppercase hover:bg-[#68ff1c] transition-all shadow-[0_0_20px_rgba(84,207,23,0.3)] active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">play_arrow</span>
                                        Resume Ops
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer System Info */}
                        <div className="bg-primary/5 border-t border-primary/20 px-8 py-3 flex justify-between items-center relative z-30">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <span className="text-[10px] font-mono text-primary/60 whitespace-nowrap">ID: AD-7729-OMEGA</span>
                                <span className="text-[10px] font-mono text-primary/60 whitespace-nowrap hidden sm:block">LOCAL_TIME: 14:22:09Z</span>
                                <span className="text-[10px] font-mono text-primary/60 whitespace-nowrap hidden md:block">LAT: 34.0522 N / LONG: 118.2437 W</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                                <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

import React, { useEffect, useRef } from 'react'

export const GlobalSessionMonitor: React.FC = () => {
    const notifiedRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const checkSessions = async () => {
            if (!window.api || !window.api.getActiveSessions) return
            try {
                const res = await window.api.getActiveSessions()
                if (res.success && res.sessions) {
                    const now = Date.now()
                    res.sessions.forEach(session => {
                        if (session.limitMinutes) {
                            const start = new Date(session.startTime).getTime()
                            const elapsedSecs = Math.floor((now - start) / 1000)
                            const totalLimitSecs = session.limitMinutes * 60
                            const rem = totalLimitSecs - elapsedSecs

                            if (rem <= 0 && !notifiedRef.current.has(session.id)) {
                                notifiedRef.current.add(session.id)
                                
                                // Play sound
                                try {
                                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                    const oscillator = audioCtx.createOscillator();
                                    const gainNode = audioCtx.createGain();
                                    oscillator.type = 'sine';
                                    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
                                    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2);
                                    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                                    oscillator.connect(gainNode);
                                    gainNode.connect(audioCtx.destination);
                                    oscillator.start();
                                    oscillator.stop(audioCtx.currentTime + 0.5);
                                } catch (e) {
                                    console.error('Audio playback failed', e)
                                }

                                new Notification("Time's Up!", {
                                    body: `Session ${session.postNumber ? `at Post ${session.postNumber}` : 'has'} finished its allotted time.`,
                                    silent: false
                                })
                            }
                        }
                    })
                }
            } catch (err) {
                console.error("GlobalSessionMonitor error:", err)
            }
        }

        const interval = setInterval(checkSessions, 5000)
        checkSessions() // Initial check
        return () => clearInterval(interval)
    }, [])

    return null
}

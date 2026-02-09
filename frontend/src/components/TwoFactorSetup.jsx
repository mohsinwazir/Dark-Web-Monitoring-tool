import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TwoFactorSetup = () => {
    const { token } = useAuth();
    const [qrCode, setQrCode] = useState(null);
    const [step, setStep] = useState('start'); // start, scan, verify
    const [otp, setOtp] = useState('');
    const [msg, setMsg] = useState('');

    const startSetup = async () => {
        try {
            const response = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setQrCode(data.qr_code);
                setStep('scan');
            } else {
                setMsg('Error: ' + data.detail);
            }
        } catch (err) {
            setMsg('Connection failed');
        }
    };

    const verifySetup = async () => {
        try {
            const response = await fetch('http://localhost:8001/auth/2fa/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: otp })
            });
            const data = await response.json();
            if (response.ok) {
                setMsg('✅ 2FA Enabled Successfully!');
                setStep('done');
            } else {
                setMsg('❌ ' + data.detail);
            }
        } catch (err) {
            setMsg('Verification failed');
        }
    };

    return (
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-500/20 backdrop-blur">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Two-Factor Authentication</h2>

            {step === 'start' && (
                <div>
                    <p className="text-slate-400 mb-4">Secure your account with 2FA.</p>
                    <button
                        onClick={startSetup}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                        Enable 2FA
                    </button>
                    {msg && <p className="text-red-400 mt-2">{msg}</p>}
                </div>
            )}

            {step === 'scan' && (
                <div className="flex flex-col items-center">
                    <p className="text-slate-300 mb-4">Scan this QR Code with your Authenticator App:</p>
                    <img src={qrCode} alt="2FA QR" className="rounded-lg border-4 border-white mb-6" />

                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit Code"
                        className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-center text-xl tracking-widest text-white mb-4 w-48"
                        maxLength={6}
                    />

                    <button
                        onClick={verifySetup}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg w-full"
                    >
                        Verify & Activate
                    </button>
                    {msg && <p className="text-red-400 mt-2">{msg}</p>}
                </div>
            )}

            {step === 'done' && (
                <div className="text-center">
                    <p className="text-green-400 text-lg mb-2">Security Level Upgraded</p>
                    <p className="text-slate-400">Your account is now protected with 2FA.</p>
                </div>
            )}
        </div>
    );
};

export default TwoFactorSetup;

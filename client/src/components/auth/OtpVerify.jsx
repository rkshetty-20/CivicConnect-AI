import React, { useState } from 'react';
import { KeyRound, Loader2, AlertCircle } from 'lucide-react';

function OtpVerify({ email, onSubmit, onBack, error, loading }) {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, otp });
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Verify Account</h2>
        <p className="text-sm text-slate-400 mt-2">
          We sent a verification code to <span className="text-slate-200 font-medium">{email}</span>.
        </p>
        <p className="text-xs text-amber-400/90 mt-2 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-lg inline-block">
          💡 Check your server console for the simulated OTP code!
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">6-Digit Verification Code</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <KeyRound className="w-5 h-5" />
            </span>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xl font-bold tracking-widest text-slate-100 placeholder-slate-650 focus:outline-none focus:border-teal-500 transition"
              placeholder="000000"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>Verify OTP</span>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="text-sm font-semibold text-slate-500 hover:text-slate-350 focus:outline-none"
        >
          ← Back to Register / Sign In
        </button>
      </div>
    </div>
  );
}

export default OtpVerify;

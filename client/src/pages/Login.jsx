import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import OtpVerify from '../components/auth/OtpVerify';

function Login() {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('login'); // 'login' or 'verify'
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirect path
  const from = location.state?.from?.pathname || '/';

  const handleLoginSubmit = async ({ email: inputEmail, password }) => {
    setError(null);
    setLoading(true);
    try {
      const data = await login(inputEmail, password);
      // Success: Redirect
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response && err.response.status === 403) {
        // Unverified account
        setEmail(inputEmail);
        setStep('verify');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async ({ email: inputEmail, otp }) => {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(inputEmail, otp);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {step === 'login' ? (
        <LoginForm
          onSubmit={handleLoginSubmit}
          onRegisterRedirect={() => navigate('/register')}
          error={error}
          loading={loading}
        />
      ) : (
        <OtpVerify
          email={email}
          onSubmit={handleOtpSubmit}
          onBack={() => setStep('login')}
          error={error}
          loading={loading}
        />
      )}
    </div>
  );
}

export default Login;

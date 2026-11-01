import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import RegisterForm from '../components/auth/RegisterForm';
import OtpVerify from '../components/auth/OtpVerify';

function Register() {
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegisterSubmit = async ({ name, email: inputEmail, phone, password, role }) => {
    setError(null);
    setLoading(true);
    try {
      await register(name, inputEmail, phone, password, role);
      setEmail(inputEmail);
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async ({ email: inputEmail, otp }) => {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(inputEmail, otp);
      navigate('/');
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

      {step === 'register' ? (
        <RegisterForm
          onSubmit={handleRegisterSubmit}
          onLoginRedirect={() => navigate('/login')}
          error={error}
          loading={loading}
        />
      ) : (
        <OtpVerify
          email={email}
          onSubmit={handleOtpSubmit}
          onBack={() => setStep('register')}
          error={error}
          loading={loading}
        />
      )}
    </div>
  );
}

export default Register;

import { useState } from 'react';
import { authAPI } from '../services/api';
import '../styles/CheckoutFlow.css';

export default function CheckoutFlow({ onProceed, isLoading }) {
  const [step, setStep] = useState('email'); // email, options, login, signup, guest
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailStatus, setEmailStatus] = useState(null); // { exists, isGuest }
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const validateEmail = (emailValue) => {
    if (!emailValue.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    setIsChecking(true);
    setEmailError('');
    
    try {
      const response = await authAPI.checkEmail(email);
      setEmailStatus(response.data);
      setStep('options');
    } catch (error) {
      setEmailError('Error checking email. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setIsAuthenticating(true);
    setPasswordError('');
    
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Proceed with checkout as logged-in user
      onProceed({
        type: 'login',
        user,
        email,
        isGuest: false
      });
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsAuthenticating(true);
    setPasswordError('');
    
    try {
      const response = await authAPI.signup(email, password);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Proceed with checkout as new user
      onProceed({
        type: 'signup',
        user,
        email,
        isGuest: false
      });
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGuestCheckout = () => {
    // Proceed as guest
    onProceed({
      type: 'guest',
      email,
      isGuest: true,
      user: null
    });
  };

  const goBack = () => {
    if (step === 'options') {
      setStep('email');
      setEmailStatus(null);
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } else if (step === 'login' || step === 'signup' || step === 'guest') {
      setStep('options');
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
    }
  };

  if (step === 'email') {
    return (
      <div className="checkout-flow-container">
        <div className="checkout-flow-card">
          <h2>Start Checkout</h2>
          <p className="flow-subtitle">Enter your email to continue</p>
          
          <form onSubmit={handleEmailSubmit} className="checkout-flow-form">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                className={emailError ? 'input-error' : ''}
                placeholder="Enter your email"
                disabled={isChecking}
              />
              {emailError && <span className="error-message">{emailError}</span>}
            </div>

            <button
              type="submit"
              disabled={isChecking || !email}
              className="btn btn-primary"
            >
              {isChecking ? 'Checking...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'options') {
    return (
      <div className="checkout-flow-container">
        <div className="checkout-flow-card">
          <h2>Welcome!</h2>
          <p className="flow-subtitle">
            {emailStatus?.exists
              ? emailStatus?.isGuest
                ? `Email ${email} found as a guest. What would you like to do?`
                : `Email ${email} is already registered. Please login.`
              : `Email ${email} is new. What would you like to do?`}
          </p>

          <div className="checkout-options">
            {/* Always show login option - for existing users or if they want to try existing account */}
            <button
              onClick={() => setStep('login')}
              className="btn btn-option btn-login"
            >
              <span className="option-icon">🔐</span>
              <div>
                <h3>Login</h3>
                <p>Sign in with an existing account</p>
              </div>
            </button>

            {/* Show signup for new emails */}
            {!emailStatus?.exists && (
              <button
                onClick={() => setStep('signup')}
                className="btn btn-option btn-signup"
              >
                <span className="option-icon">✨</span>
                <div>
                  <h3>Create Account</h3>
                  <p>New customer? Create an account now</p>
                </div>
              </button>
            )}

            {/* Show signup for guest accounts that want to register */}
            {emailStatus?.exists && emailStatus?.isGuest && (
              <button
                onClick={() => setStep('signup')}
                className="btn btn-option btn-signup"
              >
                <span className="option-icon">✨</span>
                <div>
                  <h3>Create Account</h3>
                  <p>Convert guest account to registered</p>
                </div>
              </button>
            )}

            {/* Always show guest checkout option */}
            <button
              onClick={() => setStep('guest')}
              className="btn btn-option btn-guest"
            >
              <span className="option-icon">👤</span>
              <div>
                <h3>Guest Checkout</h3>
                <p>Continue without creating an account</p>
              </div>
            </button>
          </div>

          <button onClick={goBack} className="btn btn-secondary btn-back">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="checkout-flow-container">
        <div className="checkout-flow-card">
          <h2>Login</h2>
          <p className="flow-subtitle">Enter your password to continue</p>

          <form onSubmit={handleLogin} className="checkout-flow-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                className={passwordError ? 'input-error' : ''}
                placeholder="Enter your password"
                disabled={isAuthenticating}
              />
              {passwordError && <span className="error-message">{passwordError}</span>}
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || !password}
              className="btn btn-primary"
            >
              {isAuthenticating ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <button onClick={goBack} className="btn btn-secondary btn-back">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 'signup') {
    return (
      <div className="checkout-flow-container">
        <div className="checkout-flow-card">
          <h2>Create Account</h2>
          <p className="flow-subtitle">Set up your account</p>

          <form onSubmit={handleSignup} className="checkout-flow-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                className={passwordError ? 'input-error' : ''}
                placeholder="At least 6 characters"
                disabled={isAuthenticating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                className={passwordError ? 'input-error' : ''}
                placeholder="Re-enter your password"
                disabled={isAuthenticating}
              />
              {passwordError && <span className="error-message">{passwordError}</span>}
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || !password || !confirmPassword}
              className="btn btn-primary"
            >
              {isAuthenticating ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <button onClick={goBack} className="btn btn-secondary btn-back">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 'guest') {
    return (
      <div className="checkout-flow-container">
        <div className="checkout-flow-card">
          <h2>Guest Checkout</h2>
          <p className="flow-subtitle">Continue as guest</p>

          <div className="guest-info">
            <p>Email: <strong>{email}</strong></p>
            <p className="guest-note">
              You can complete your purchase without creating an account.
            </p>
          </div>

          <div className="guest-checkout-actions">
            <button
              onClick={handleGuestCheckout}
              disabled={isLoading}
              className="btn btn-primary"
            >
              Continue as Guest
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <button
              onClick={() => setStep('login')}
              className="btn btn-secondary btn-full"
            >
              Sign In to Existing Account
            </button>
          </div>

          <button onClick={goBack} className="btn btn-secondary btn-back">
            ← Back
          </button>
        </div>
      </div>
    );
  }
}

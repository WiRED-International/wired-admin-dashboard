import React, { useState } from 'react';
import { resetPassword } from '../api/authAPI';
import { globalStyles } from '../globalStyles';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
  const { token } = useParams(); // Get the token from the URL
  console.log("URL token:", token);
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    setConfirmPassword(e.target.value);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMessage('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      await resetPassword(token as string, password);

      navigate('/password-reset-success');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div style={globalStyles.pageContainer}>
      <header style={globalStyles.header}>
        <h1>Reset Password</h1>
        <p>Enter a new password for your account</p>
      </header>

      <div style={globalStyles.authMainContent}>
        <form onSubmit={handleResetPassword} style={globalStyles.authForm}>
          <div style={globalStyles.authInputGroup}>
            <label htmlFor="password" style={globalStyles.authLabel}>New Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your new password"
              style={globalStyles.authInput}
              required
            />
          </div>

          <div style={globalStyles.authInputGroup}>
            <label htmlFor="confirmPassword" style={globalStyles.authLabel}>Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm your new password"
              style={globalStyles.authInput}
              required
            />
          </div>

          {message && <p style={globalStyles.authSuccess}>{message}</p>}
          {errorMessage && <p style={globalStyles.authError}>{errorMessage}</p>}

          <button type="submit" style={globalStyles.submitButton}>Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

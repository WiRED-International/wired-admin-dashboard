import React, { useState } from 'react';
import { login as loginAPI } from '../api/authAPI';
import Auth from '../utils/auth';
import { UserLoginInterface } from '../interfaces/UserLoginInterface';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../globalStyles';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [userLogin, setUserLogin] = useState<UserLoginInterface>({email: '', password: ''});
  const [errorMessage, setErrorMessage] = useState('');
  const { setIsAuthenticated } = useAuth();



  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserLogin({ ...userLogin, email: e.target.value });
    setErrorMessage('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserLogin({ ...userLogin, password: e.target.value });
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userLogin.email || !userLogin.password) {
      setErrorMessage('Please enter both email and password.');
    } else {
      const loginData = { ...userLogin };
      try {
        const response = await loginAPI(loginData);
        Auth.login(response.token);
        setIsAuthenticated(true);
      } catch (error) {
        if (error instanceof Error) {
          if(error.message === 'Failed to fetch') {
          setErrorMessage('there was a problem with the server. Please try again.');
          }
          else {
            setErrorMessage(error.message);
          }
        } else {
          setErrorMessage('An error occurred. Please try again.');
        }
      }

    }
  };

  return (
    <div style={globalStyles.pageContainer}>
      <header style={globalStyles.header}>
        <h1>Login</h1>
        <p>Log in to access the admin dashboard</p>
      </header>

      <div style={globalStyles.authMainContent}>
        <form onSubmit={handleLogin} style={globalStyles.authForm}>
          <div style={globalStyles.authInputGroup}>
            <label htmlFor="email" style={globalStyles.authLabel}>Email:</label>
            <input
              type="email"
              id="email"
              value={userLogin.email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              style={globalStyles.authInput}
              required
            />
          </div>

          <div style={globalStyles.authInputGroup}>
            <label htmlFor="password" style={globalStyles.authLabel}>Password:</label>
            <input
              type="password"
              id="password"
              value={userLogin.password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              style={globalStyles.authInput}
              required
            />
          </div>

          {errorMessage && <p style={globalStyles.authError}>{errorMessage}</p>}

          <button type="submit" style={globalStyles.submitButton}>Log In</button>
          <Link style={globalStyles.authRedirect} to="/forgot-password">Forgot Password</Link>
        </form>
      </div>
    </div>
  );
};



export default LoginPage;

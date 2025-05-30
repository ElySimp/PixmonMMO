import React, { useState } from 'react';
import './Auth.css';
import { TOKEN_KEY } from '../../utils/config';

const Auth = ({ setIsAuthenticated }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [message, setMessage] = useState('');
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayMessage, setOverlayMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error message when user starts typing
        setMessage('');
    };

    const validateForm = () => {
        if (!formData.username.trim()) {
            setMessage('Username is required');
            return false;
        }
        if (!isLogin && !formData.email.trim()) {
            setMessage('Email is required');
            return false;
        }
        if (!formData.password.trim()) {
            setMessage('Password is required');
            return false;
        }
        if (!isLogin && formData.password.length < 6) {
            setMessage('Password must be at least 6 characters');
            return false;
        }
        if (!isLogin && !formData.email.includes('@')) {
            setMessage('Please enter a valid email');
            return false;
        }
        return true;
    };

    const showSuccessOverlay = (message) => {
        setOverlayMessage(message);
        setShowOverlay(true);
        setTimeout(() => {
            setShowOverlay(false);
            setIsLogin(true);
        }, 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        
        try {
            const response = await fetch('http://localhost:5000${endpoint}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(isLogin ? {
                    username: formData.username,
                    password: formData.password
                } : formData)
            });

            const data = await response.json();
            
            if (data.success) {
                if (isLogin) {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.setItem(TOKEN_KEY, data.data.token); // gunakan TOKEN_KEY
                    await fetchUserProfile();
                    setIsAuthenticated(true);
                } else {
                    showSuccessOverlay('Registration successful! Please login.');
                    setFormData({
                        username: '',
                        email: '',
                        password: ''
                    });
                }
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
            console.error('Auth error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            {showOverlay && (
                <div className="success-overlay">
                    <div className="success-content">
                        <div className="success-icon">✓</div>
                        <p>{overlayMessage}</p>
                    </div>
                </div>
            )}
            
            <div className="auth-box">
                <h2>{isLogin ? 'Login' : 'Register'}</h2>
                
                {message && <div className="message error">{message}</div>}
                
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="auth-username">Username</label>
                        <input
                            id="auth-username"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                            placeholder="Enter your username"
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="auth-email">Email</label>
                            <input
                                id="auth-email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                                placeholder="Enter your email"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="auth-password">Password</label>
                        <input
                            id="auth-password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                            placeholder={isLogin ? "Enter your password" : "Create a password (min. 6 characters)"}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting 
                            ? 'Processing...' 
                            : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>

                <p className="toggle-text">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        className="toggle-btn"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage('');
                            setFormData({
                                username: '',
                                email: '',
                                password: ''
                            });
                        }}
                        disabled={isSubmitting}
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;
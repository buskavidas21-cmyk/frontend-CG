import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-brand">
          <div className="logo-circle">CG</div>
          <h1>CleanGuard QC</h1>
          <p>Professional Quality Control</p>
        </div>

        <div className="login-card">
          <div className="card-header">
            <h2>Welcome Back</h2>
            <p>Please sign in to your account</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="btn btn-block" disabled={isLoading}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="btn-spinner" />
                  Signing In...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
          padding: 20px;
        }
        .login-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 420px;
          gap: 30px;
        }
        .login-brand {
          text-align: center;
        }
        .logo-circle {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 24px;
          margin: 0 auto 15px;
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
        }
        .login-brand h1 {
          font-size: 24px;
          color: var(--text);
          margin-bottom: 5px;
        }
        .login-brand p {
          color: #64748b;
          font-size: 14px;
        }
        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .card-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .card-header h2 {
          font-size: 22px;
          color: var(--text);
          margin-bottom: 5px;
        }
        .card-header p {
          color: #64748b;
          font-size: 14px;
        }
        .login-card .btn-block {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          border-radius: 12px;
          margin-top: 8px;
        }
        .error-message {
          background: #fef2f2;
          color: #991b1b;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          border: 1px solid #fecaca;
        }
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Login;

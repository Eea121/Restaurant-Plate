import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses =
    'w-full bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-gray-400 font-medium text-sm tracking-wide shadow-sm';

  return (
    <div dir="ltr" className="w-full min-h-screen bg-gray-50 font-sans flex flex-col">
      <div
        className="relative text-white py-20 text-center bg-cover bg-center bg-no-repeat border-b border-amber-500/20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.95)), url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop')",
        }}
      >
        <div className="relative z-10">
          <Link to="/" className="font-serif text-2xl md:text-3xl font-bold tracking-wider text-white hover:text-amber-500 transition-colors">
            THE PALATE
          </Link>
          <p className="text-amber-500 text-xs tracking-[0.3em] mt-2 font-medium">COLLECTIVE</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mt-6 tracking-wide">Welcome Back</h1>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 md:p-12 shadow-xl">
          <h2 className="font-serif text-2xl md:text-3xl text-gray-900 mb-8 text-center font-bold tracking-wide">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-sm">
                {error}
              </div>
            )}

            <div>
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="PASSWORD"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-sm font-serif font-bold text-lg tracking-widest shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${
                submitting
                  ? 'bg-amber-600/70 text-white cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white hover:-translate-y-0.5'
              }`}
            >
              {submitting ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-8 text-center">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-amber-500 hover:text-amber-600 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

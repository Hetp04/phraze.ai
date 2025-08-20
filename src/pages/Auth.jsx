import { useState } from 'react';
import { firebaseLogin, firebaseCreateAccount, showToast, finishSignUp } from '../funcs';
import { sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase-init';

export default function Auth() {
  const [formID, setFormID] = useState("loginForm");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (formID == "loginForm") {
        // Login flow
        await firebaseLogin(email, password);
        // Redirect or handle successful login
      } else if (formID == "signupForm") {
        // Signup flow
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        const user = await firebaseCreateAccount(email, password, inviteCode, name);
        // Show success toast message
        window.alert('Account created successfully! Page is reloading...');
        // The redirect happens inside firebaseCreateAccount function
      }
      else if (formID == "forgotPasswordForm") {
        await sendPasswordResetEmail(auth, email);
        showToast("Password reset email sent! Please check your inbox.", "success");
        setFormID("loginForm"); // Return to login form after sending reset email
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
      console.error(err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        const user = result.user;
        // Optionally show a toast or redirect
        showToast("Signed in with Google!", "success");
        finishSignUp(user, null, null, null);
      }
      else{
        showToast("Google sign-in failed", "error");
      }
    } catch (error) {
      setError(error.message || "Google sign-in failed");
      showToast(error.message || "Google sign-in failed", "error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-hero">
        {/* Grid pattern background */}
        <div className="grid-pattern"></div>

        <div className="auth-hero-content">
          <div className="auth-logo">Phraze</div>

          <h1>Develop better language models</h1>
          <p>
            Powerful tools for annotating, analyzing, and improving LLM conversations.
            Create high-quality training data from real user interactions.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="feature-icon">
                <i className="fas fa-check"></i>
              </div>
              <div className="feature-text">
                Annotate conversations with custom labels and categories
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-icon">
                <i className="fas fa-check"></i>
              </div>
              <div className="feature-text">
                Track model performance with comprehensive analytics
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-icon">
                <i className="fas fa-check"></i>
              </div>
              <div className="feature-text">
                Export structured data for model fine-tuning
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{(() => {
              switch (formID) {
                case `loginForm`:
                  return 'Sign in to Phraze';
                case 'signupForm':
                  return 'Create your account';
                case `forgotPasswordForm`:
                  return 'Reset your password';
              }
            })()}</h2>
            <p>
              {formID == `loginForm` ? '' : ''}
              {(() => {
                switch (formID) {
                  case `loginForm`:
                    return 'Welcome back';
                  case 'signupForm':
                    return 'Start improving your LLMs today';
                  case `forgotPasswordForm`:
                    return 'Send a reset email';
                }
              })()}
            </p>
          </div>

          <div className="auth-toggle">
            <button
              className={`toggle-btn ${formID == `loginForm` ? 'active' : ''}`}
              onClick={() => setFormID(`loginForm`)}
            >
              Sign in
            </button>
            <button
              className={`toggle-btn ${formID == `signupForm` ? 'active' : ''}`}
              onClick={() => setFormID(`signupForm`)}
            >
              Sign up
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>

            {formID == `signupForm` && (
              <div className="form-group">
                <label>Invite Code</label>
                <input
                  type="text"
                  id="invite-code"
                  placeholder="Invite Code (Optional)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
            )}

            {formID == `signupForm` && (
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={formID == `signupForm`}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {formID != `forgotPasswordForm` &&
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            }

            {formID == `signupForm` && (
              <div className="form-group">
                <label>Confirm password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={formID == `signupForm`}
                />
              </div>
            )}
            {formID == 'loginForm' && (
              <div id="forgot-password"
                style={{
                  cursor: `pointer`,
                  color: ` #72A1FA`,
                  marginTop: `-15px`,
                  fontSize: `12pt`,
                  marginLeft: `13px`
                }}
                onClick={() => setFormID(`forgotPasswordForm`)}
              >
                Forgot password?</div>
            )}

            <button type="submit" className="auth-submit">
              {(() => {
                switch (formID) {
                  case 'loginForm':
                    return 'Sign in';
                  case 'signupForm':
                    return 'Create account';
                  case 'forgotPasswordForm':
                    return "Send password reset email";
                  default:
                    return 'Submit';
                }
              })()}
            </button>
          </form>

          <button id="googleSignIn" className="gsi-material-button" style={{ width: "340px", marginTop: "20px" }} onClick={handleGoogleSignIn} type="button">
            <div class="gsi-material-button-state"></div>
            <div class="gsi-material-button-content-wrapper">
              <div class="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  style={{ display: "block" }}>
                  <path fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z">
                  </path>
                  <path fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z">
                  </path>
                  <path fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z">
                  </path>
                  <path fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z">
                  </path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">Sign in with
                Google</span>
              <span style={{ display: "none" }}>Sign in with Google</span>
            </div>
          </button>

          {formID != "forgotPasswordForm" &&
            <div className="auth-footer">
              <p>
                {formID == `loginForm` ? "Don't have an account? " : "Already have an account? "}
                <button
                  className="toggle-link"
                  onClick={() => setFormID(formID == `loginForm` ? 'signupForm' : 'loginForm')}
                >
                  {formID == `loginForm` ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          }
        </div>
      </div>
    </div>
  );
} 
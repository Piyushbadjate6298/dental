import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  RefreshCw,
  Server,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { api, getApiBaseUrl, setCustomApiBaseUrl } from '../services/api.js';

export default function Login({ onLogin }) {
  const [u, setU] = useState('admin');
  const [p, setP] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Backend Server URL Configuration
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!u.trim() || !p) {
      setErr('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErr('');

    try {
      const res = await api.login(u.trim(), p);
      onLogin(res.user);
    } catch (error) {
      const msg = error.message || 'Incorrect username or password.';
      setErr(msg);
      if (msg.includes('405') || msg.includes('Could not connect')) {
        setShowServerConfig(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestAndSaveServer = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await api.testConnection(serverUrl);
      setCustomApiBaseUrl(serverUrl);
      setTestStatus({
        ok: true,
        message: `Connected successfully! (Database: ${res?.database?.mode || 'online'})`,
      });
      if (err && (err.includes('405') || err.includes('Could not connect'))) {
        setErr('');
      }
    } catch (testErr) {
      setTestStatus({
        ok: false,
        message: testErr.message || 'Could not connect to this URL. Verify it is running.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-art">
        <div className="art-orb orb-one" />
        <div className="art-orb orb-two" />
        <div className="art-content">
          <div className="brand-mark big">
            <Stethoscope size={30} />
          </div>
          <div className="eyebrow light">DENTAL LAB MANAGEMENT</div>
          <h1>
            Better work.
            <br />
            <i>Beautiful smiles.</i>
          </h1>
          <p>Every customer inquiry and prescription, organized in one secure place.</p>
          <div className="art-pills">
            <span>
              <Check size={14} /> Digital prescriptions
            </span>
            <span>
              <Check size={14} /> WhatsApp transmission
            </span>
            <span>
              <Check size={14} /> Neon PostgreSQL database
            </span>
          </div>
        </div>
        <div className="art-footer">SHITAL DENTAL SERVICES · LASALGAON</div>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <div className="login-mobile-brand">
            <div className="brand-mark">
              <Stethoscope size={22} />
            </div>
            <div>
              <b>SHITAL</b>
              <span>DENTAL SERVICES</span>
            </div>
          </div>

          <div className="eyebrow">AUTHENTICATION</div>
          <h2>
            Sign in to your
            <br />
            workspace
          </h2>
          <p className="muted">Enter your admin credentials to access laboratory inquiries.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="login-username">Username</label>
            <div className="input-wrap">
              <UserRound size={17} />
              <input
                id="login-username"
                value={u}
                onChange={(e) => {
                  setU(e.target.value);
                  if (err) setErr('');
                }}
                placeholder="admin"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <label htmlFor="login-password">Password</label>
            <div className="input-wrap">
              <ShieldCheck size={17} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={p}
                onChange={(e) => {
                  setP(e.target.value);
                  if (err) setErr('');
                }}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {err && <div className="error">{err}</div>}

            <button className="primary-btn full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Backend API Server Configuration Section */}
          <div className="server-config-section" style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={() => setShowServerConfig((s) => !s)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                color: '#0d9488',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <Server size={14} />
              <span>{showServerConfig ? 'Hide Backend Server Settings' : 'Configure Backend API URL'}</span>
              <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 'auto', fontSize: '11px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {serverUrl}
              </span>
            </button>

            {showServerConfig && (
              <div style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <p style={{ margin: '0 0 6px 0', color: '#64748b', fontSize: '11px', lineHeight: 1.4 }}>
                  Enter your deployed Render backend URL (e.g. <code>https://shital-dental-backend.onrender.com</code>):
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={serverUrl}
                    onChange={(e) => {
                      setServerUrl(e.target.value);
                      setTestStatus(null);
                    }}
                    placeholder="https://your-backend.onrender.com"
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleTestAndSaveServer}
                    disabled={testing}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: '#0d9488',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {testing ? 'Testing…' : 'Save & Test'}
                  </button>
                </div>

                {testStatus && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: testStatus.ok ? '#059669' : '#dc2626', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {testStatus.ok ? <CheckCircle2 size={13} /> : null}
                    {testStatus.message}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="demo-login">
            <b>Admin Authentication</b>
            <span>Configured via backend environment (ADMIN_USERNAME / ADMIN_PASSWORD)</span>
          </div>
          <p className="login-foot">Private &amp; secure dental laboratory management desk.</p>
        </div>
      </div>
    </div>
  );
}

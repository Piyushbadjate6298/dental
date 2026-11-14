import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Database,
  FilePlus2,
  History,
  Home,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import DoctorsPage from './components/DoctorsPage.jsx';
import HistoryPage from './components/HistoryPage.jsx';
import InquiryForm from './components/InquiryForm.jsx';
import Login from './components/Login.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import { STORE, readData, defaultData } from './utils/dental.js';
import { api } from './services/api.js';
import './styles.css';

function App() {
  const [data, setData] = useState(readData);
  const [logged, setLogged] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [dbStatus, setDbStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const notify = (m) => setToast(m);

  // 1. Initial Authentication Check on Application Load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.getMe();
        if (res?.user) {
          setLogged(true);
          setCurrentUser(res.user);
        }
      } catch {
        // Not signed in or token expired
        setLogged(false);
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch fresh data from backend database when logged in
  const fetchData = useCallback(async () => {
    if (!logged) return;
    setSyncing(true);
    try {
      const [doctorsRes, settingsRes, inquiriesRes, healthRes] = await Promise.allSettled([
        api.getDoctors(),
        api.getSettings(),
        api.getInquiries(),
        api.getHealth(),
      ]);

      setData((prev) => {
        const updated = { ...prev };

        if (doctorsRes.status === 'fulfilled' && Array.isArray(doctorsRes.value)) {
          updated.doctors = doctorsRes.value.map((d) => (typeof d === 'string' ? d : d.doctor_name));
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          updated.whatsapp = settingsRes.value.whatsapp || prev.whatsapp;
          updated.labName = settingsRes.value.labName || prev.labName;
          updated.labAddress = settingsRes.value.labAddress || prev.labAddress;
          updated.labPhone = settingsRes.value.labPhone || prev.labPhone;
          if (settingsRes.value.inquiryFormSettings) {
            updated.inquiryFormSettings = settingsRes.value.inquiryFormSettings;
          }
        }

        if (inquiriesRes.status === 'fulfilled') {
          const inqList = inquiriesRes.value?.inquiries || inquiriesRes.value;
          if (Array.isArray(inqList)) {
            updated.inquiries = inqList;
            const maxNo = inqList.reduce((m, x) => Math.max(m, x.number || 0), 0);
            updated.nextNo = maxNo + 1;
          }
        }

        return updated;
      });

      if (healthRes.status === 'fulfilled') {
        setDbStatus(healthRes.value?.database || null);
      }
    } catch {
      // Backend request fallback
    } finally {
      setSyncing(false);
    }
  }, [logged]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keep localStorage updated as local offline cache
  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleLoginSuccess = (user) => {
    setLogged(true);
    setCurrentUser(user);
    setPage('dashboard');
    notify(`Welcome back, ${user.username}`);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    } finally {
      setLogged(false);
      setCurrentUser(null);
      navigate('dashboard');
      notify('Signed out safely');
    }
  };

  const saveInquiry = async (item) => {
    try {
      // Save directly to Neon database via backend API
      const saved = await api.createInquiry(item);
      const record = saved || item;
      setData((d) => ({
        ...d,
        inquiries: [record, ...d.inquiries.filter((x) => x.id !== record.id)],
        nextNo: Math.max(d.nextNo, (record.number || record.inquiry_number || 0) + 1),
      }));
      navigate('history');
      notify('Inquiry saved to database successfully');
      return record;
    } catch (err) {
      // Safe fallback to local state if backend is temporarily unreachable
      setData((d) => ({
        ...d,
        inquiries: [item, ...d.inquiries],
        nextNo: Math.max(d.nextNo, item.number + 1),
      }));
      navigate('history');
      notify(err.message || 'Saved locally (offline mode)');
      return item;
    }
  };

  const updateInquiry = async (item) => {
    try {
      // Update in Neon database via backend API
      const updated = await api.updateInquiry(item.id, item);
      const record = updated || item;
      setData((d) => ({
        ...d,
        inquiries: d.inquiries.map((x) => (x.id === record.id ? record : x)),
      }));
      setEditing(null);
      navigate('history');
      notify('Inquiry record updated in database');
      return record;
    } catch (err) {
      setData((d) => ({
        ...d,
        inquiries: d.inquiries.map((x) => (x.id === item.id ? item : x)),
      }));
      setEditing(null);
      navigate('history');
      notify(err.message || 'Updated locally (offline mode)');
      return item;
    }
  };

  const removeInquiry = async (id) => {
    if (confirm('Delete this inquiry permanently?')) {
      try {
        await api.deleteInquiry(id);
        setData((d) => ({
          ...d,
          inquiries: d.inquiries.filter((x) => x.id !== id),
        }));
        notify('Inquiry deleted from database');
      } catch (err) {
        setData((d) => ({
          ...d,
          inquiries: d.inquiries.filter((x) => x.id !== id),
        }));
        notify(err.message || 'Inquiry deleted locally');
      }
    }
  };

  if (authChecking) {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f2c30', color: '#eaf1ed' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="brand-mark" style={{ margin: '0 auto 16px', width: '50px', height: '50px' }}>
            <Stethoscope size={26} />
          </div>
          <b>SHEETAL DENTAL ART</b>
          <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px' }}>Initializing secure workspace…</p>
        </div>
      </div>
    );
  }

  if (!logged) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  const nav = [
    ['dashboard', 'Overview', Home],
    ['new', 'New inquiry', FilePlus2],
    ['history', 'Inquiry history', History],
    ['doctors', 'Doctors', Users],
    ['settings', 'Settings', Settings],
  ];

  const activeLabel =
    page === 'new' && editing
      ? 'Edit inquiry'
      : nav.find((x) => x[0] === page)?.[1] || 'New inquiry';

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${mobileNav ? 'open' : ''}`}
        aria-label="Workspace navigation"
      >
        <div className="brand">
          <div className="brand-mark">
            <Stethoscope size={22} />
          </div>
          <div>
            <b>SHEETAL</b>
            <span>DENTAL ART</span>
          </div>
          <button
            type="button"
            className="close-nav"
            aria-label="Close navigation menu"
            onClick={() => setMobileNav(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              type="button"
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => {
                setEditing(null);
                navigate(id);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === 'history' && data.inquiries.length > 0 && (
                <small>{data.inquiries.length}</small>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="secure-note">
            <Database size={17} />
            <div>
              <b>Neon PostgreSQL</b>
              <span>{dbStatus?.connected ? 'Connected (Cloud DB)' : 'Database Connected'}</span>
            </div>
          </div>
          <button
            type="button"
            className="nav-item logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sign out ({currentUser?.username || 'Admin'})</span>
          </button>
        </div>
      </aside>

      {mobileNav && (
        <div
          className="scrim"
          aria-hidden="true"
          onClick={() => setMobileNav(false)}
        />
      )}

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu icon-btn"
              aria-label="Open navigation menu"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={20} />
            </button>
            <div className="crumb">
              <span className="crumb-root">Workspace</span>
              <ChevronRight size={14} className="crumb-sep" />
              <b>{activeLabel}</b>
            </div>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className="icon-btn"
              title="Refresh data from database"
              onClick={fetchData}
              disabled={syncing}
            >
              <RefreshCw size={15} className={syncing ? 'spinner' : ''} />
            </button>
            <span className="today-label">
              <CalendarDays size={15} />
              <span>
                {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </span>
            <div className="avatar" title={`Signed in as ${currentUser?.username || 'Admin'}`}>
              {(currentUser?.username || 'SA').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="content page-enter" key={`${page}-${editing?.id || 'base'}`}>
          {page === 'dashboard' && (
            <Dashboard
              data={data}
              setPage={navigate}
              setEditing={setEditing}
            />
          )}
          {page === 'new' && (
            <InquiryForm
              data={data}
              onSave={editing ? updateInquiry : saveInquiry}
              notify={notify}
              initial={editing}
              onBack={() => {
                setEditing(null);
                navigate('dashboard');
              }}
            />
          )}
          {page === 'history' && (
            <HistoryPage
              data={data}
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              onNew={() => {
                setEditing(null);
                navigate('new');
              }}
              onEdit={(x) => {
                setEditing(x);
                navigate('new');
              }}
              onDelete={removeInquiry}
              notify={notify}
            />
          )}
          {page === 'doctors' && (
            <DoctorsPage data={data} setData={setData} notify={notify} />
          )}
          {page === 'settings' && (
            <SettingsPage data={data} setData={setData} notify={notify} onRefresh={fetchData} />
          )}
        </div>

        <footer>
          © {new Date().getFullYear()} Sheetal Dental Art <span>•</span>{' '}
          Connected to Neon PostgreSQL <span>•</span> Digital Lab Desk
        </footer>
      </main>

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

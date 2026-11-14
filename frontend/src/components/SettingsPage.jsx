import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  Check,
  Database,
  Download,
  History,
  KeyRound,
  MessageCircle,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sliders,
  UploadCloud,
} from 'lucide-react';
import {
  cleanPhone,
  defaultData,
  downloadBlob,
  readData,
} from '../utils/dental.js';
import { PageHeading } from './Common.jsx';
import { api } from '../services/api.js';
import InquiryFormSettings from './InquiryFormSettings.jsx';

export default function SettingsPage({ data, setData, notify, onRefresh }) {
  const [settingsTab, setSettingsTab] = useState('form'); // Default to Inquiry Form Settings or general
  const [phone, setPhone] = useState(data.whatsapp);
  const [lab, setLab] = useState(data.labName);
  const [address, setAddress] = useState(data.labAddress);
  const [labPhone, setLabPhone] = useState(data.labPhone);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  // Migration state
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState('');

  useEffect(() => {
    setPhone(data.whatsapp);
    setLab(data.labName);
    setAddress(data.labAddress);
    setLabPhone(data.labPhone);
  }, [data.whatsapp, data.labName, data.labAddress, data.labPhone]);

  const save = async () => {
    const normalized = cleanPhone(phone);
    setPhone(normalized);
    setSaving(true);

    const payload = {
      whatsapp: normalized,
      labName: lab.trim() || 'Shital Dental Services',
      labAddress: address,
      labPhone,
    };

    try {
      await api.updateSettings(payload);
      setData((d) => ({
        ...d,
        ...payload,
      }));
      notify('Settings saved to database successfully');
    } catch (err) {
      setData((d) => ({
        ...d,
        ...payload,
      }));
      notify(err.message || 'Settings saved locally');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!curPass || !newPass) {
      setPassErr('Please provide both current and new passwords.');
      return;
    }
    if (newPass.length < 6) {
      setPassErr('New password must be at least 6 characters.');
      return;
    }

    setPassLoading(true);
    setPassErr('');
    setPassMsg('');

    try {
      await api.changePassword(curPass, newPass);
      setPassMsg('Admin password updated successfully.');
      setCurPass('');
      setNewPass('');
      notify('Password changed successfully');
    } catch (err) {
      setPassErr(err.message || 'Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleMigrateLocalData = async () => {
    const local = readData();
    const docCount = local.doctors?.length || 0;
    const inqCount = local.inquiries?.length || 0;

    if (docCount === 0 && inqCount === 0) {
      notify('No local records found to migrate.');
      return;
    }

    if (
      !confirm(
        `Transfer ${docCount} doctor(s) and ${inqCount} inquiry record(s) from this device to the Neon database? Existing database records will not be overwritten.`
      )
    ) {
      return;
    }

    setMigrating(true);
    setMigrateResult('');

    try {
      const res = await api.importLocalData({
        doctors: local.doctors,
        inquiries: local.inquiries,
        settings: {
          whatsapp: local.whatsapp,
          labName: local.labName,
          labAddress: local.labAddress,
          labPhone: local.labPhone,
        },
      });

      setMigrateResult(res.message);
      notify(res.message);
      if (onRefresh) onRefresh();
    } catch (err) {
      setMigrateResult(`Migration error: ${err.message}`);
      notify(err.message || 'Data migration failed');
    } finally {
      setMigrating(false);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, 'shital-dental-backup.json');
    notify('Backup downloaded');
  };

  const importData = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const v = JSON.parse(r.result);
        if (!Array.isArray(v.doctors) || !Array.isArray(v.inquiries)) {
          throw Error();
        }
        if (confirm('Import this backup into your workspace and database?')) {
          setData({ ...defaultData, ...v });
          try {
            await api.importLocalData(v);
            notify('Backup restored and synchronized with database');
          } catch {
            notify('Backup restored locally');
          }
          if (onRefresh) onRefresh();
        }
      } catch {
        notify('Invalid backup JSON file');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  };

  const previewPhone = cleanPhone(phone);

  return (
    <>
      <PageHeading
        eyebrow="CONFIGURATION"
        title="Settings"
        sub="Customize inquiry form options, lab information, WhatsApp destination and security."
      />

      <div className="settings-nav-tabs">
        <button
          type="button"
          className={`settings-nav-tab ${settingsTab === 'form' ? 'active' : ''}`}
          onClick={() => setSettingsTab('form')}
        >
          <Sliders size={16} />
          <span>Inquiry Form Settings</span>
        </button>

        <button
          type="button"
          className={`settings-nav-tab ${settingsTab === 'general' ? 'active' : ''}`}
          onClick={() => setSettingsTab('general')}
        >
          <Settings size={16} />
          <span>Lab &amp; WhatsApp Settings</span>
        </button>
      </div>

      {settingsTab === 'form' && (
        <InquiryFormSettings
          settings={data.inquiryFormSettings}
          onSaveSuccess={(savedSettings) => {
            setData((d) => ({
              ...d,
              inquiryFormSettings: savedSettings,
            }));
          }}
          notify={notify}
        />
      )}

      {settingsTab === 'general' && (
        <div className="settings-grid">
        {/* Lab & WhatsApp Settings */}
        <section className="panel settings-panel">
          <div className="form-section-title">
            <span className="section-number">
              <Settings size={17} />
            </span>
            <div>
              <h3>Lab information</h3>
              <p>These details appear on customer inquiry reports</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="settings-lab-name">Business / lab name</label>
            <input
              id="settings-lab-name"
              value={lab}
              onChange={(e) => setLab(e.target.value)}
              placeholder="Shital Dental Services"
            />
          </div>

          <div className="field">
            <label htmlFor="settings-lab-address">Lab address</label>
            <textarea
              id="settings-lab-address"
              rows="2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="settings-lab-phone">Lab contact number</label>
            <input
              id="settings-lab-phone"
              value={labPhone}
              onChange={(e) => setLabPhone(e.target.value)}
              placeholder="e.g. 9370045066"
            />
          </div>

          <div className="settings-divider" />

          <div className="form-section-title">
            <span className="section-number">
              <MessageCircle size={17} />
            </span>
            <div>
              <h3>WhatsApp destination</h3>
              <p>Change where customer inquiries are transmitted</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="settings-whatsapp">
              WhatsApp number (with country code) <em>*</em>
            </label>
            <input
              id="settings-whatsapp"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 919370045066"
            />
            <small>
              Enter digits only, including country code (e.g. 91 for India). Do not add + or spaces.
            </small>
          </div>

          <div className="whatsapp-preview">
            <MessageCircle size={18} />
            <div>
              <b>Current destination</b>
              <span>
                {previewPhone ? `+${previewPhone}` : 'Not configured yet'}
              </span>
            </div>
          </div>

          <button type="button" className="primary-btn" onClick={save} disabled={saving}>
            <Check size={17} /> {saving ? 'Saving…' : 'Save settings'}
          </button>
        </section>

        {/* Database Migration, Security & Backup */}
        <section className="panel backup-panel">
          {/* Cloud Database Sync & Migration */}
          <div className="form-section-title">
            <span className="section-number">
              <Database size={17} />
            </span>
            <div>
              <h3>Cloud database migration</h3>
              <p>Transfer browser records to Neon PostgreSQL</p>
            </div>
          </div>

          <div className="backup-info">
            <div className="backup-icon">
              <UploadCloud size={20} />
            </div>
            <div>
              <b>Migrate browser data to Neon</b>
              <p>
                Transfer existing doctors, inquiries and settings saved on this browser
                into the central PostgreSQL database.
              </p>
              <button
                type="button"
                className="outline-btn"
                onClick={handleMigrateLocalData}
                disabled={migrating}
              >
                <RefreshCw size={15} className={migrating ? 'spinner' : ''} />
                {migrating ? 'Transferring data…' : 'Start data migration'}
              </button>
              {migrateResult && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--brand)', fontWeight: 600 }}>
                  {migrateResult}
                </div>
              )}
            </div>
          </div>

          <div className="settings-divider" />

          {/* Change Admin Password */}
          <div className="form-section-title">
            <span className="section-number">
              <KeyRound size={17} />
            </span>
            <div>
              <h3>Security &amp; credentials</h3>
              <p>Update administrator access password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: '10px' }}>
            <div className="field">
              <label htmlFor="settings-current-pass">Current password</label>
              <input
                id="settings-current-pass"
                type="password"
                value={curPass}
                onChange={(e) => setCurPass(e.target.value)}
                placeholder="Enter current password"
                disabled={passLoading}
              />
            </div>

            <div className="field">
              <label htmlFor="settings-new-pass">New password (min 6 characters)</label>
              <input
                id="settings-new-pass"
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter new secure password"
                disabled={passLoading}
              />
            </div>

            {passErr && <div className="error" style={{ fontSize: '12px', color: 'var(--danger)' }}>{passErr}</div>}
            {passMsg && <div style={{ fontSize: '12px', color: 'var(--whatsapp)', fontWeight: 600 }}>{passMsg}</div>}

            <button type="submit" className="outline-btn" style={{ justifySelf: 'start' }} disabled={passLoading}>
              <ShieldCheck size={16} /> {passLoading ? 'Updating…' : 'Change password'}
            </button>
          </form>

          <div className="settings-divider" />

          {/* Export & Restore JSON Backup */}
          <div className="form-section-title">
            <span className="section-number">
              <ShieldCheck size={17} />
            </span>
            <div>
              <h3>Data backup</h3>
              <p>Keep a portable offline copy of your data</p>
            </div>
          </div>

          <div className="backup-info">
            <div className="backup-icon">
              <Download size={20} />
            </div>
            <div>
              <b>Export backup</b>
              <p>
                Download doctors, inquiries and settings as a JSON file.
              </p>
              <button
                type="button"
                className="outline-btn"
                onClick={exportData}
              >
                <ArrowDownToLine size={16} /> Download backup JSON
              </button>
            </div>
          </div>

          <div className="backup-info">
            <div className="backup-icon">
              <History size={20} />
            </div>
            <div>
              <b>Restore backup</b>
              <p>
                Restore previously exported inquiries and synchronise with the database.
              </p>
              <label className="outline-btn file-label">
                <ArrowDownToLine size={16} /> Choose backup file
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={importData}
                />
              </label>
            </div>
          </div>
        </section>
      </div>
      )}
    </>
  );
}

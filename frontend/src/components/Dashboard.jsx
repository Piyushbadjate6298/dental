import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  FileText,
  History,
  Plus,
  Send,
  Settings,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { today } from '../utils/dental.js';
import { api } from '../services/api.js';
import {
  EmptyState,
  PageHeading,
  QuickAction,
  Stat,
  StatusBadge,
} from './Common.jsx';

export default function Dashboard({ data, setPage, setEditing }) {
  const [dbStats, setDbStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.getDashboardStats()
      .then((res) => {
        if (mounted && res) setDbStats(res);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [data.inquiries.length]);

  const list = data.inquiries;
  const totalInquiries = dbStats ? dbStats.totalInquiries : list.length;
  const todayCount = dbStats ? dbStats.todayInquiries : list.filter((x) => x.date === today()).length;
  const sent = dbStats ? dbStats.sentToLab : list.filter((x) => x.status === 'Sent').length;
  const patientCount = dbStats
    ? dbStats.totalPatients
    : new Set(list.map((x) => (x.patient || '').trim().toLowerCase()).filter(Boolean)).size;

  const recent = (dbStats?.recentInquiries && dbStats.recentInquiries.length > 0)
    ? dbStats.recentInquiries
    : list.slice(0, 5);

  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title="Good day, Admin"
        sub="Here's what's happening with your dental lab inquiries today."
        action={
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setEditing(null);
              setPage('new');
            }}
          >
            <Plus size={18} /> Create inquiry
          </button>
        }
      />

      <div className="welcome-strip">
        <div className="welcome-icon">
          <Sparkles size={21} />
        </div>
        <div className="welcome-copy">
          <b>Your lab desk, made simpler.</b>
          <span>
            Create customer inquiries, review prescription details and submit them
            to your lab on WhatsApp.
          </span>
        </div>
        <button
          type="button"
          className="welcome-cta"
          onClick={() => {
            setEditing(null);
            setPage('new');
          }}
        >
          <span>Start now</span> <ArrowRight size={15} />
        </button>
      </div>

      <div className="stat-grid">
        <Stat
          icon={ClipboardList}
          label="Total inquiries"
          value={totalInquiries}
          note="All recorded inquiries"
        />
        <Stat
          icon={CalendarDays}
          label="Today's inquiries"
          value={todayCount}
          note="Created today"
        />
        <Stat
          icon={UserCheck}
          label="Total patients"
          value={patientCount}
          note="Unique patient names"
        />
        <Stat
          icon={Send}
          label="Sent to lab"
          value={sent}
          note="WhatsApp shared"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <div className="panel-head">
            <div>
              <h3>Recent inquiries</h3>
              <p>Latest customer case records</p>
            </div>
            <button
              type="button"
              className="text-btn"
              onClick={() => setPage('history')}
            >
              View all <ArrowRight size={15} />
            </button>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No inquiries yet"
              text="Customer inquiries will appear here once you submit one."
              action={
                <button
                  type="button"
                  className="primary-btn small"
                  onClick={() => {
                    setEditing(null);
                    setPage('new');
                  }}
                >
                  <Plus size={15} /> New inquiry
                </button>
              }
            />
          ) : (
            <div className="recent-list">
              {recent.map((x) => (
                <button
                  type="button"
                  className="recent-row"
                  key={x.id}
                  onClick={() => {
                    setEditing(x);
                    setPage('new');
                  }}
                >
                  <div className="patient-avatar">
                    {(x.patient || 'P').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="recent-info">
                    <b>{x.patient}</b>
                    <span>
                      {x.doctor || 'No doctor selected'} · #{x.number}
                    </span>
                  </div>
                  <div className="recent-date">
                    {new Date(x.date + 'T00:00:00').toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                  <StatusBadge status={x.status} />
                  <span className="recent-chevron" aria-hidden="true">
                    <ChevronRight size={17} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="panel quick-panel">
          <div className="panel-head">
            <div>
              <h3>Quick actions</h3>
              <p>Common tasks at your fingertips</p>
            </div>
          </div>

          <QuickAction
            icon={FilePlus2}
            title="New customer inquiry"
            text="Fill in tooth details and lab instructions"
            onClick={() => {
              setEditing(null);
              setPage('new');
            }}
          />
          <QuickAction
            icon={History}
            title="View inquiry history"
            text="Find and manage previous submissions"
            onClick={() => setPage('history')}
          />
          <QuickAction
            icon={Users}
            title="Manage doctors"
            text={`${data.doctors.length} doctor${
              data.doctors.length === 1 ? '' : 's'
            } registered`}
            onClick={() => setPage('doctors')}
          />
          <QuickAction
            icon={Settings}
            title="Lab & WhatsApp settings"
            text="Configure destination and database"
            onClick={() => setPage('settings')}
          />
        </section>
      </div>

      <div className="tip-strip">
        <div className="tip-strip-icon">
          <BadgeCheck size={19} />
        </div>
        <p>
          <b>Helpful tip</b> Add your regular doctors in{' '}
          <a onClick={() => setPage('doctors')}>Doctor management</a>. Their
          names will then be available in the inquiry form.
        </p>
      </div>
    </>
  );
}

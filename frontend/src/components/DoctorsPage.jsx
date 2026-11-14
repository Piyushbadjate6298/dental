import React, { useState } from 'react';
import {
  BadgeCheck,
  Check,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { EmptyState, PageHeading } from './Common';
import { api } from '../services/api';

export default function DoctorsPage({ data, setData, notify }) {
  const [name, setName] = useState('');
  const [edit, setEdit] = useState('');
  const [editVal, setEditVal] = useState('');
  const [loading, setLoading] = useState(false);

  const getDoctorName = (d) => (typeof d === 'string' ? d : d.doctor_name);

  const add = async () => {
    const n = name.trim();
    if (!n) return;

    if (data.doctors.some((x) => getDoctorName(x).toLowerCase() === n.toLowerCase())) {
      notify('This doctor is already in your list');
      return;
    }

    setLoading(true);
    try {
      await api.addDoctor(n);
      setData((d) => ({
        ...d,
        doctors: [...d.doctors.filter((x) => getDoctorName(x) !== n), n].sort((a, b) =>
          getDoctorName(a).localeCompare(getDoctorName(b))
        ),
      }));
      setName('');
      notify('Doctor saved to database successfully');
    } catch (err) {
      // Local fallback
      setData((d) => ({
        ...d,
        doctors: [...d.doctors, n].sort((a, b) => getDoctorName(a).localeCompare(getDoctorName(b))),
      }));
      setName('');
      notify(err.message || 'Doctor added');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (d) => {
    const docName = getDoctorName(d);
    setEdit(docName);
    setEditVal(docName);
  };

  const saveEdit = async (oldName) => {
    const n = editVal.trim();
    if (!n) return;

    setLoading(true);
    try {
      // Find doctor id if stored as object, or pass oldName
      const docObj = data.doctors.find((x) => getDoctorName(x) === oldName);
      const docId = typeof docObj === 'object' && docObj?.id ? docObj.id : oldName;

      await api.updateDoctor(docId, n);
      setData((d) => ({
        ...d,
        doctors: d.doctors
          .map((x) => (getDoctorName(x) === oldName ? n : x))
          .sort((a, b) => getDoctorName(a).localeCompare(getDoctorName(b))),
      }));
      setEdit('');
      setEditVal('');
      notify('Doctor name updated in database');
    } catch (err) {
      setData((d) => ({
        ...d,
        doctors: d.doctors
          .map((x) => (getDoctorName(x) === oldName ? n : x))
          .sort((a, b) => getDoctorName(a).localeCompare(getDoctorName(b))),
      }));
      setEdit('');
      setEditVal('');
      notify(err.message || 'Doctor name updated');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (d) => {
    const docName = getDoctorName(d);
    if (
      confirm(
        `Remove ${docName} from the doctor list? Existing inquiries will remain unchanged.`
      )
    ) {
      try {
        const docObj = data.doctors.find((x) => getDoctorName(x) === docName);
        const docId = typeof docObj === 'object' && docObj?.id ? docObj.id : docName;
        await api.deleteDoctor(docId);
        setData((d) => ({
          ...d,
          doctors: d.doctors.filter((x) => getDoctorName(x) !== docName),
        }));
        notify('Doctor removed from active list');
      } catch (err) {
        setData((d) => ({
          ...d,
          doctors: d.doctors.filter((x) => getDoctorName(x) !== docName),
        }));
        notify(err.message || 'Doctor removed');
      }
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="MASTER DATA"
        title="Doctor management"
        sub="Maintain your regular doctors in the database. Changes appear immediately in inquiry forms."
      />

      <div className="doctor-layout">
        <section className="panel doctor-add">
          <div className="panel-head">
            <div>
              <h3>Add a doctor</h3>
              <p>Build your reusable database doctor directory</p>
            </div>
            <div className="stat-icon">
              <UserRound size={18} />
            </div>
          </div>

          <label htmlFor="add-doctor-input">Doctor&apos;s full name</label>
          <div className="add-doctor-row">
            <input
              id="add-doctor-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="e.g. Dr. Amit Sharma"
              disabled={loading}
            />
            <button type="button" className="primary-btn" onClick={add} disabled={loading || !name.trim()}>
              <Plus size={17} /> Add doctor
            </button>
          </div>

          <div className="tip-inline">
            <BadgeCheck size={16} />
            <span>
              All registered doctors are safely stored in your Neon PostgreSQL database.
            </span>
          </div>
        </section>

        <section className="panel doctor-list">
          <div className="panel-head">
            <div>
              <h3>Saved doctors</h3>
              <p>
                {data.doctors.length} doctor
                {data.doctors.length === 1 ? '' : 's'} available in inquiry form
              </p>
            </div>
            <span className="count-pill">{data.doctors.length}</span>
          </div>

          {data.doctors.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Your doctor list is empty"
              text="Add the doctors you work with. They will be stored in your database."
            />
          ) : (
            <div className="doctor-rows">
              {data.doctors.map((d, i) => {
                const docName = getDoctorName(d);
                return (
                  <div className="doctor-row" key={docName}>
                    <div className="doctor-avatar">
                      {docName.slice(0, 1).toUpperCase()}
                    </div>
                    {edit === docName ? (
                      <input
                        className="edit-doctor"
                        autoFocus
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(docName)}
                        disabled={loading}
                      />
                    ) : (
                      <div className="doctor-name">
                        <b>{docName}</b>
                        <small>Doctor {String(i + 1).padStart(2, '0')}</small>
                      </div>
                    )}
                    <div className="row-actions">
                      {edit === docName ? (
                        <>
                          <button
                            type="button"
                            className="icon-btn good"
                            aria-label="Save doctor name"
                            onClick={() => saveEdit(docName)}
                            disabled={loading}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="Cancel edit"
                            onClick={() => setEdit('')}
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={`Edit ${docName}`}
                            onClick={() => startEdit(d)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            aria-label={`Remove ${docName}`}
                            onClick={() => remove(d)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

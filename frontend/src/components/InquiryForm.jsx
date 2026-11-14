import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  MessageCircle,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  cleanPhone,
  getJawTeeth,
  instructions,
  shareInquiryOnWhatsApp,
  stages,
  today,
} from '../utils/dental';
import { PageHeading, SummaryRow } from './Common';
import ToothPicker from './ToothPicker';

export default function InquiryForm({ data, onSave, notify, initial, onBack }) {
  const [date, setDate] = useState(initial?.date || today());
  const [doctor, setDoctor] = useState(initial?.doctor || '');
  const [patient, setPatient] = useState(initial?.patient || '');
  const [shade, setShade] = useState(initial?.shade || '');
  const [selected, setSelected] = useState(initial?.teeth || []);
  const [chosen, setChosen] = useState(initial?.instructions || []);
  const [stage, setStage] = useState(initial?.stages || []);
  const [note, setNote] = useState(initial?.note || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) {
      setDate(initial.date || today());
      setDoctor(initial.doctor || '');
      setPatient(initial.patient || '');
      setShade(initial.shade || '');
      setSelected(initial.teeth || []);
      setChosen(initial.instructions || []);
      setStage(initial.stages || []);
      setNote(initial.note || '');
    } else {
      setDate(today());
      setDoctor('');
      setPatient('');
      setShade('');
      setSelected([]);
      setChosen([]);
      setStage([]);
      setNote('');
    }
  }, [initial?.id]);

  const toggle = (set, v) =>
    set((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));

  const payload = (statusOverride) => ({
    id: initial?.id || crypto.randomUUID(),
    number: initial?.number || data.nextNo,
    date,
    doctor,
    patient,
    shade,
    teeth: selected,
    instructions: chosen,
    stages: stage,
    note,
    status: statusOverride || initial?.status || 'Draft',
    createdAt: initial?.createdAt || new Date().toISOString(),
  });

  const validate = () => {
    if (!patient.trim()) {
      notify('Please enter the patient name');
      return false;
    }
    if (!doctor.trim()) {
      notify('Please select or enter a doctor name');
      return false;
    }
    return true;
  };

  const handleSaveOnly = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      await onSave(payload('Draft'));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitInquiry = async () => {
    if (!validate()) return;
    if (!cleanPhone(data.whatsapp)) {
      notify('Add the lab WhatsApp number in Settings first');
      return;
    }
    const item = payload('Sent');
    setBusy(true);
    try {
      // 1. Save to database first
      const savedRecord = await onSave(item);
      const recordToShare = savedRecord || item;

      // 2. Transmit to WhatsApp
      const mode = await shareInquiryOnWhatsApp(recordToShare, data);
      if (mode === 'shared') {
        notify('Customer inquiry submitted to lab via WhatsApp');
      } else {
        notify('Inquiry report downloaded. WhatsApp opened with inquiry details.');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        notify('Could not open WhatsApp sharing. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const jaws = getJawTeeth(selected);

  const getDoctorName = (d) => (typeof d === 'string' ? d : d.doctor_name);

  return (
    <>
      <PageHeading
        eyebrow="INQUIRY WORKFLOW"
        title={initial ? 'Edit inquiry' : 'Create new inquiry'}
        sub="Enter prescription details and submit the inquiry to the dental laboratory."
        action={
          <button type="button" className="outline-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <div className="form-layout">
        <div className="form-main">
          {/* Section 01: Basic Information */}
          <section className="panel form-panel">
            <div className="form-section-title">
              <span className="section-number">01</span>
              <div>
                <h3>Case information</h3>
                <p>Date, doctor, patient and shade details</p>
              </div>
            </div>

            <div className="field-grid">
              {/* 1. Inquiry date */}
              <div className="field">
                <label htmlFor="field-date">
                  Inquiry date <em>*</em>
                </label>
                <input
                  id="field-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* 2. Doctor's name */}
              <div className="field">
                <label htmlFor="field-doctor">
                  Doctor&apos;s name <em>*</em>
                </label>
                {data.doctors.length ? (
                  <select
                    id="field-doctor"
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                  >
                    <option value="">Select doctor</option>
                    {data.doctors.map((d) => {
                      const docName = getDoctorName(d);
                      return (
                        <option key={docName} value={docName}>
                          {docName}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    id="field-doctor"
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                    placeholder="Enter doctor's name"
                  />
                )}
                <small>
                  {data.doctors.length
                    ? 'Choose from your database doctor list.'
                    : 'Add doctors in Doctor management to enable quick selection.'}
                </small>
              </div>

              {/* 3. Patient's name */}
              <div className="field">
                <label htmlFor="field-patient">
                  Patient&apos;s name <em>*</em>
                </label>
                <input
                  id="field-patient"
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  placeholder="Enter patient full name"
                />
              </div>

              {/* 4. Tooth shade */}
              <div className="field">
                <label htmlFor="field-shade">Tooth shade</label>
                <input
                  id="field-shade"
                  value={shade}
                  onChange={(e) => setShade(e.target.value)}
                  placeholder="e.g. A1, A2, A3, B1"
                />
              </div>
            </div>
          </section>

          {/* Section 02: Tooth Selection (5. Upper jaw teeth & 6. Lower jaw teeth) */}
          <section className="panel form-panel">
            <div className="form-section-title">
              <span className="section-number">02</span>
              <div>
                <h3>Tooth selection</h3>
                <p>Select required upper jaw and lower jaw teeth</p>
              </div>
            </div>
            <ToothPicker selected={selected} setSelected={setSelected} />
          </section>

          {/* Section 03: Lab Instructions & Trial Requirements (7 & 8) */}
          <section className="panel form-panel">
            <div className="form-section-title">
              <span className="section-number">03</span>
              <div>
                <h3>Lab instructions &amp; trial requirements</h3>
                <p>Specify materials, work stage and any custom requirements</p>
              </div>
            </div>

            {/* 7. Lab instructions */}
            <div className="field">
              <label>Lab instructions (Materials / Work types)</label>
              <div className="choice-grid">
                {instructions.map((x) => {
                  const isChecked = chosen.includes(x);
                  return (
                    <label
                      className={`choice ${isChecked ? 'checked' : ''}`}
                      key={x}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(setChosen, x)}
                      />
                      <span className="fake-check" aria-hidden="true">
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </span>
                      <span className="choice-label">{x}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 8. Trial requirements */}
            <div className="field stages-field">
              <label>Trial requirements</label>
              <div className="stage-options">
                {stages.map((x) => {
                  const isChecked = stage.includes(x);
                  return (
                    <label
                      className={`stage-chip ${isChecked ? 'checked' : ''}`}
                      key={x}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(setStage, x)}
                      />
                      {isChecked && <Check size={13} strokeWidth={3} />} {x}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Additional instructions */}
            <div className="field note-field">
              <label htmlFor="field-note">
                Additional lab instructions <span>(optional)</span>
              </label>
              <textarea
                id="field-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any specific lab instructions or special requirements..."
                rows="3"
              />
            </div>
          </section>

          {/* Bottom Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={handleSaveOnly}
              disabled={busy}
            >
              <Save size={17} /> Save inquiry
            </button>
            <button
              type="button"
              className="primary-btn submit-inquiry-btn"
              onClick={handleSubmitInquiry}
              disabled={busy}
            >
              {busy ? (
                <span className="spinner" />
              ) : (
                <Send size={17} />
              )}
              <span>{busy ? 'Submitting…' : 'Submit Inquiry'}</span>
            </button>
          </div>
        </div>

        {/* 9. Review customer inquiry details (Live Summary Sidebar) */}
        <aside className="form-aside">
          <div className="aside-card preview-card">
            <div className="preview-head">
              <div className="preview-icon">
                <FileText size={18} />
              </div>
              <span>INQUIRY REVIEW</span>
            </div>
            <h3>{patient || 'Patient name'}</h3>
            <p>{doctor || 'Doctor not selected'}</p>
            <div className="summary-divider" />
            <SummaryRow
              label="Date"
              value={
                date
                  ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'
              }
            />
            <SummaryRow label="Tooth shade" value={shade || '—'} />
            <SummaryRow
              label="Upper jaw teeth"
              value={jaws.upper !== 'None' ? jaws.upper : 'None selected'}
            />
            <SummaryRow
              label="Lower jaw teeth"
              value={jaws.lower !== 'None' ? jaws.lower : 'None selected'}
            />
            <SummaryRow
              label="Total teeth"
              value={
                selected.length > 0
                  ? `${selected.length} tooth / teeth`
                  : 'None selected'
              }
            />
            <SummaryRow
              label="Lab instructions"
              value={chosen.length ? chosen.join(', ') : 'Not selected'}
            />
            <SummaryRow
              label="Trial requirements"
              value={stage.length ? stage.join(', ') : 'Not selected'}
            />
            {note && (
              <SummaryRow
                label="Notes"
                value={note}
              />
            )}
            <div className="summary-status-pill">
              <CheckCircle2 size={14} />
              <span>Ready for laboratory submission</span>
            </div>
          </div>

          <div className="aside-tip">
            <Sparkles size={17} className="aside-tip-icon" />
            <div>
              <b>Tooth selection tip</b>
              <p>
                Tap teeth on the dental arch to select. Upper and lower jaws can both be selected.
              </p>
            </div>
          </div>

          {/* 10. Click Submit Inquiry */}
          <div className="aside-share-box">
            <button
              type="button"
              className="whatsapp-btn"
              onClick={handleSubmitInquiry}
              disabled={busy}
            >
              <span className="whatsapp-btn-left">
                {busy ? <span className="spinner" /> : <MessageCircle size={18} />}
                <span>{busy ? 'Submitting…' : 'Submit Inquiry to Lab'}</span>
              </span>
              <ArrowRight size={16} />
            </button>
            <p className="share-caption">
              Saves the inquiry to database and transmits the formatted report to the laboratory WhatsApp destination.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

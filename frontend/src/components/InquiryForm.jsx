import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  FileText,
  MessageCircle,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  cleanPhone,
  DEFAULT_INQUIRY_FORM_SETTINGS,
  getJawTeeth,
  instructions as defaultInstructions,
  shareInquiryOnWhatsApp,
  stages as defaultStages,
  today,
} from '../utils/dental.js';
import { PageHeading, SummaryRow } from './Common.jsx';
import ToothPicker from './ToothPicker.jsx';
import InquiryReportRenderer from './InquiryReportRenderer.jsx';

export default function InquiryForm({ data, onSave, notify, initial, onBack }) {
  const [date, setDate] = useState(initial?.date || today());
  const [doctor, setDoctor] = useState(initial?.doctor || '');
  const [patient, setPatient] = useState(initial?.patient || '');
  const [shade, setShade] = useState(initial?.shade || '');
  const [selected, setSelected] = useState(initial?.teeth || []);
  const [chosen, setChosen] = useState(initial?.instructions || []);
  const [stage, setStage] = useState(initial?.stages || []);
  const [note, setNote] = useState(initial?.note || '');
  const [customFields, setCustomFields] = useState(initial?.customFields || {});
  const [otherInstruction, setOtherInstruction] = useState('');
  const [otherStage, setOtherStage] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const formSettings = data?.inquiryFormSettings || DEFAULT_INQUIRY_FORM_SETTINGS;

  // Active instructions from settings + preserve historical instructions if editing
  const availableInstructions = useMemo(() => {
    const list = (formSettings.labInstructions || [])
      .filter((x) => x.enabled !== false)
      .map((x) => x.name);
    if (initial?.instructions) {
      initial.instructions.forEach((item) => {
        const clean = item.startsWith('Others:') ? 'Others' : item;
        if (!list.includes(clean)) list.push(clean);
      });
    }
    if (!list.includes('Others')) list.push('Others');
    return list;
  }, [formSettings.labInstructions, initial?.instructions]);

  // Active trial options from settings + preserve historical trial options if editing
  const availableStages = useMemo(() => {
    const list = (formSettings.trialOptions || [])
      .filter((x) => x.enabled !== false)
      .map((x) => x.name);
    if (initial?.stages) {
      initial.stages.forEach((item) => {
        const clean = item.startsWith('Others:') ? 'Others' : item;
        if (!list.includes(clean)) list.push(clean);
      });
    }
    if (!list.includes('Others')) list.push('Others');
    return list;
  }, [formSettings.trialOptions, initial?.stages]);

  // Active tooth shades from settings
  const availableShades = useMemo(() => {
    return (formSettings.toothShades || [])
      .filter((x) => x.enabled !== false)
      .map((x) => x.name);
  }, [formSettings.toothShades]);

  // Active custom fields
  const activeCustomFields = useMemo(() => {
    return (formSettings.customFields || []).filter((f) => f.enabled !== false);
  }, [formSettings.customFields]);

  useEffect(() => {
    if (initial) {
      setDate(initial.date || today());
      setDoctor(initial.doctor || '');
      setPatient(initial.patient || '');
      setShade(initial.shade || '');
      setSelected(initial.teeth || []);

      // Check if custom other instruction exists in historical record
      const rawInst = initial.instructions || [];
      const customInstItem = rawInst.find((x) => typeof x === 'string' && x.startsWith('Others:'));
      if (customInstItem) {
        setOtherInstruction(customInstItem.replace(/^Others:\s*/, ''));
        setChosen([...rawInst.filter((x) => !x.startsWith('Others:')), 'Others']);
      } else {
        setOtherInstruction('');
        setChosen(rawInst);
      }

      // Check if custom other stage exists in historical record
      const rawStages = initial.stages || [];
      const customStageItem = rawStages.find((x) => typeof x === 'string' && x.startsWith('Others:'));
      if (customStageItem) {
        setOtherStage(customStageItem.replace(/^Others:\s*/, ''));
        setStage([...rawStages.filter((x) => !x.startsWith('Others:')), 'Others']);
      } else {
        setOtherStage('');
        setStage(rawStages);
      }

      setNote(initial.note || '');
      setCustomFields(initial.customFields || {});
    } else {
      setDate(today());
      setDoctor('');
      setPatient('');
      setShade('');
      setSelected([]);
      setChosen([]);
      setStage([]);
      setNote('');
      setCustomFields({});
      setOtherInstruction('');
      setOtherStage('');
    }
  }, [initial?.id]);

  const toggle = (set, v) =>
    set((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));

  const getFinalInstructions = () => {
    const list = chosen.filter((x) => x !== 'Others');
    if (chosen.includes('Others') && otherInstruction.trim()) {
      list.push(`Others: ${otherInstruction.trim()}`);
    }
    return list;
  };

  const getFinalStages = () => {
    const list = stage.filter((x) => x !== 'Others');
    if (stage.includes('Others') && otherStage.trim()) {
      list.push(`Others: ${otherStage.trim()}`);
    }
    return list;
  };

  const payload = (statusOverride) => ({
    id: initial?.id || crypto.randomUUID(),
    number: initial?.number || data.nextNo,
    date,
    doctor,
    patient,
    shade,
    teeth: selected,
    instructions: getFinalInstructions(),
    stages: getFinalStages(),
    customFields,
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

    // Validate required custom fields
    for (const f of activeCustomFields) {
      if (f.required) {
        const val = customFields[f.name];
        const empty =
          val === undefined ||
          val === null ||
          (typeof val === 'string' && !val.trim()) ||
          (Array.isArray(val) && val.length === 0);
        if (empty) {
          notify(`Please provide a value for required field: ${f.name}`);
          return false;
        }
      }
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
        eyebrow={initial ? `INQUIRY #${initial.number}` : `AUTOMATIC SERIAL INQUIRY #${data.nextNo}`}
        title={initial ? `Edit Inquiry #${initial.number}` : `New Inquiry #${data.nextNo}`}
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
                {availableShades.length > 0 && (
                  <div className="shade-chips-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {availableShades.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`shade-chip-btn ${shade === s ? 'selected' : ''}`}
                        onClick={() => setShade(s)}
                        style={{
                          padding: '4px 9px',
                          fontSize: '11px',
                          borderRadius: '6px',
                          border: shade === s ? '2px solid #0d9488' : '1px solid #cbd5e1',
                          background: shade === s ? '#f0fdfa' : '#ffffff',
                          color: shade === s ? '#0f766e' : '#334155',
                          cursor: 'pointer',
                          fontWeight: shade === s ? 600 : 400,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  id="field-shade"
                  value={shade}
                  onChange={(e) => setShade(e.target.value)}
                  placeholder="Select shade above or type custom shade (e.g. A2, OM3)"
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
                {availableInstructions.map((x) => {
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

              {/* Others text input for Lab Instructions */}
              {chosen.includes('Others') && (
                <div className="others-input-wrap" style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label htmlFor="other-instruction-input" style={{ fontSize: '12px', fontWeight: 600, color: '#0d9488', display: 'block', marginBottom: '4px' }}>
                    Specify other custom lab instruction:
                  </label>
                  <input
                    id="other-instruction-input"
                    value={otherInstruction}
                    onChange={(e) => setOtherInstruction(e.target.value)}
                    placeholder="Type custom material, metal grade, or specific instruction..."
                  />
                </div>
              )}
            </div>

            {/* 8. Trial requirements */}
            <div className="field stages-field">
              <label>Trial requirements</label>
              <div className="stage-options">
                {availableStages.map((x) => {
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

              {/* Others text input for Trial Options */}
              {stage.includes('Others') && (
                <div className="others-input-wrap" style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label htmlFor="other-stage-input" style={{ fontSize: '12px', fontWeight: 600, color: '#0d9488', display: 'block', marginBottom: '4px' }}>
                    Specify other custom trial requirement:
                  </label>
                  <input
                    id="other-stage-input"
                    value={otherStage}
                    onChange={(e) => setOtherStage(e.target.value)}
                    placeholder="Type custom trial stage (e.g. Coping Trial, Framework Check)..."
                  />
                </div>
              )}
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

          {/* Section 04: Custom Fields (if defined in settings) */}
          {activeCustomFields.length > 0 && (
            <section className="panel form-panel">
              <div className="form-section-title">
                <span className="section-number">04</span>
                <div>
                  <h3>Additional Custom Details</h3>
                  <p>Custom inquiry fields defined in Settings</p>
                </div>
              </div>

              <div className="field-grid">
                {activeCustomFields.map((field) => {
                  const val = customFields[field.name];
                  return (
                    <div
                      key={field.id}
                      className="field"
                      style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}
                    >
                      <label>
                        {field.name} {field.required && <em>*</em>}
                      </label>

                      {field.type === 'text' && (
                        <input
                          value={val || ''}
                          onChange={(e) =>
                            setCustomFields({ ...customFields, [field.name]: e.target.value })
                          }
                          placeholder={`Enter ${field.name}`}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <textarea
                          rows="2"
                          value={val || ''}
                          onChange={(e) =>
                            setCustomFields({ ...customFields, [field.name]: e.target.value })
                          }
                          placeholder={`Enter ${field.name}`}
                        />
                      )}

                      {field.type === 'select' && (
                        <select
                          value={val || ''}
                          onChange={(e) =>
                            setCustomFields({ ...customFields, [field.name]: e.target.value })
                          }
                        >
                          <option value="">Select {field.name}</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {field.type === 'multiselect' && (
                        <div className="choice-grid" style={{ marginTop: '6px' }}>
                          {(field.options || []).map((opt) => {
                            const isSel = Array.isArray(val) && val.includes(opt);
                            return (
                              <label key={opt} className={`choice ${isSel ? 'checked' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={isSel}
                                  onChange={() => {
                                    const cur = Array.isArray(val) ? [...val] : [];
                                    const next = cur.includes(opt)
                                      ? cur.filter((x) => x !== opt)
                                      : [...cur, opt];
                                    setCustomFields({ ...customFields, [field.name]: next });
                                  }}
                                />
                                <span className="fake-check">
                                  {isSel && <Check size={13} strokeWidth={3} />}
                                </span>
                                <span className="choice-label">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {field.type === 'radio' && (
                        <div className="choice-grid" style={{ marginTop: '6px' }}>
                          {(field.options || []).map((opt) => {
                            const isSel = val === opt;
                            return (
                              <label key={opt} className={`choice ${isSel ? 'checked' : ''}`}>
                                <input
                                  type="radio"
                                  name={`field_${field.id}`}
                                  checked={isSel}
                                  onChange={() =>
                                    setCustomFields({ ...customFields, [field.name]: opt })
                                  }
                                />
                                <span className="choice-label">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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
              className="outline-btn"
              onClick={() => setPreviewOpen(true)}
              disabled={busy}
              title="Preview anatomical dental report prescription image"
            >
              <Eye size={17} /> Preview prescription
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
              <span>INQUIRY REVIEW · INQUIRY #{initial?.number || data.nextNo}</span>
            </div>
            <h3>{patient || 'Patient name'}</h3>
            <p>{doctor || 'Doctor not selected'}</p>
            <div className="summary-divider" />
            <SummaryRow
              label="Inquiry ref"
              value={`Inquiry #${initial?.number || data.nextNo}`}
            />
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
              value={getFinalInstructions().length ? getFinalInstructions().join(', ') : 'Not selected'}
            />
            <SummaryRow
              label="Trial requirements"
              value={getFinalStages().length ? getFinalStages().join(', ') : 'Not selected'}
            />
            {Object.entries(customFields).map(([k, v]) => {
              if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return null;
              return (
                <SummaryRow
                  key={k}
                  label={k}
                  value={Array.isArray(v) ? v.join(', ') : String(v)}
                />
              );
            })}
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

      <InquiryReportRenderer
        item={payload()}
        data={data}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        notify={notify}
      />
    </>
  );
}

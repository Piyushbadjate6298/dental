import React, { useState } from 'react';
import {
  Eye,
  Filter,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  cleanPhone,
  getJawTeeth,
  shareInquiryOnWhatsApp,
} from '../utils/dental.js';
import { EmptyState, PageHeading, StatusBadge } from './Common.jsx';
import InquiryReportRenderer from './InquiryReportRenderer.jsx';

export default function HistoryPage({
  data,
  search,
  setSearch,
  filter,
  setFilter,
  onNew,
  onEdit,
  onDelete,
  notify,
}) {
  const [previewItem, setPreviewItem] = useState(null);

  const rows = data.inquiries.filter((x) => {
    const q = search.toLowerCase();
    const match = [
      x.patient,
      x.doctor,
      String(x.number),
      x.shade,
      ...(x.instructions || []),
      ...(x.stages || []),
    ].some((v) => (v || '').toLowerCase().includes(q));
    return match && (filter === 'All' || x.status === filter);
  });

  const resend = async (x) => {
    if (!cleanPhone(data.whatsapp)) {
      notify('Add the lab WhatsApp number in Settings first');
      return;
    }
    try {
      const mode = await shareInquiryOnWhatsApp(x, data);
      if (mode === 'shared') {
        notify('Customer inquiry shared successfully on WhatsApp');
      } else {
        notify('Inquiry report downloaded. Opening WhatsApp to submit.');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        notify('Unable to open WhatsApp sharing');
      }
    }
  };

  const formatDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <>
      <PageHeading
        eyebrow="RECORDS & FOLLOW-UPS"
        title="Inquiry history"
        sub="Search, review and manage every customer inquiry submission."
        action={
          <button type="button" className="primary-btn" onClick={onNew}>
            <Plus size={17} /> New inquiry
          </button>
        }
      />

      <div className="panel history-panel">
        <div className="history-tools">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, doctor, inquiry no. or instructions..."
              aria-label="Search patient, doctor or inquiry no."
            />
          </div>
          <div className="filter-box">
            <Filter size={16} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter inquiries by status"
            >
              <option>All</option>
              <option>Sent</option>
              <option>Draft</option>
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching inquiries"
            text={
              data.inquiries.length
                ? 'Try changing your search or filter.'
                : 'Your customer inquiries will appear here.'
            }
          />
        ) : (
          <>
            <div className="table-wrap desktop-history">
              <table>
                <thead>
                  <tr>
                    <th>INQUIRY</th>
                    <th>DATE</th>
                    <th>DOCTOR</th>
                    <th>PATIENT</th>
                    <th>SELECTED TEETH</th>
                    <th>LAB INSTRUCTIONS</th>
                    <th>TRIAL REQUIREMENTS</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x) => {
                    const jaws = getJawTeeth(x.teeth);
                    return (
                      <tr key={x.id}>
                        <td>
                          <b className="record-no">#{x.number}</b>
                          {x.shade && <small>Shade: {x.shade}</small>}
                        </td>
                        <td>{formatDate(x.date)}</td>
                        <td>
                          <b>{x.doctor}</b>
                        </td>
                        <td>
                          <b>{x.patient}</b>
                        </td>
                        <td>
                          <div className="table-teeth-cell">
                            <span>
                              <b>Upper:</b> {jaws.upper}
                            </span>
                            <span>
                              <b>Lower:</b> {jaws.lower}
                            </span>
                            <small>{jaws.totalCount} total tooth/teeth</small>
                          </div>
                        </td>
                        <td>
                          <div className="table-tags-cell">
                            {(x.instructions || []).length > 0
                              ? (x.instructions || []).join(', ')
                              : '—'}
                          </div>
                        </td>
                        <td>
                          <div className="table-tags-cell">
                            {(x.stages || []).length > 0
                              ? (x.stages || []).join(', ')
                              : '—'}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={x.status} />
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              title="Preview prescription report"
                              aria-label="Preview"
                              onClick={() => setPreviewItem(x)}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn good"
                              title="Send / Share on WhatsApp"
                              aria-label="Share on WhatsApp"
                              onClick={() => resend(x)}
                            >
                              <MessageCircle size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              title="Edit inquiry"
                              aria-label="Edit"
                              onClick={() => onEdit(x)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn danger"
                              title="Delete inquiry"
                              aria-label="Delete"
                              onClick={() => onDelete(x.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-history-cards">
              {rows.map((x) => {
                const jaws = getJawTeeth(x.teeth);
                return (
                  <article className="history-card" key={x.id}>
                    <div className="history-card-top">
                      <div className="history-card-id">
                        <b className="record-no">#{x.number}</b>
                        <span>{formatDate(x.date)}</span>
                      </div>
                      <StatusBadge status={x.status} />
                    </div>

                    <div className="history-card-body">
                      <div className="history-card-main">
                        <h4>{x.patient}</h4>
                        <p>{x.doctor || 'No doctor selected'}</p>
                        {x.shade && (
                          <span className="card-shade-tag">
                            Shade: <b>{x.shade}</b>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="history-card-details">
                      <div className="card-detail-line">
                        <span className="detail-label">Upper teeth:</span>
                        <span className="detail-value">{jaws.upper}</span>
                      </div>
                      <div className="card-detail-line">
                        <span className="detail-label">Lower teeth:</span>
                        <span className="detail-value">{jaws.lower}</span>
                      </div>
                      <div className="card-detail-line">
                        <span className="detail-label">Instructions:</span>
                        <span className="detail-value">
                          {(x.instructions || []).join(', ') || '—'}
                        </span>
                      </div>
                      <div className="card-detail-line">
                        <span className="detail-label">Trials:</span>
                        <span className="detail-value">
                          {(x.stages || []).join(', ') || '—'}
                        </span>
                      </div>
                      {x.note && (
                        <div className="card-detail-line">
                          <span className="detail-label">Note:</span>
                          <span className="detail-value">{x.note}</span>
                        </div>
                      )}
                    </div>

                    <div className="history-card-actions">
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={() => setPreviewItem(x)}
                      >
                        <Eye size={15} /> Preview
                      </button>
                      <button
                        type="button"
                        className="card-action-btn share"
                        onClick={() => resend(x)}
                      >
                        <MessageCircle size={15} /> WhatsApp
                      </button>
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={() => onEdit(x)}
                      >
                        <Pencil size={15} /> Edit
                      </button>
                      <button
                        type="button"
                        className="card-action-btn danger"
                        aria-label="Delete inquiry"
                        onClick={() => onDelete(x.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <div className="table-foot">
          Showing <b>{rows.length}</b> of <b>{data.inquiries.length}</b> inquiries
        </div>
      </div>

      {previewItem && (
        <InquiryReportRenderer
          item={previewItem}
          data={data}
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          notify={notify}
        />
      )}
    </>
  );
}

import React, { useEffect, useState } from 'react';
import {
  Download,
  Eye,
  FileCheck,
  MessageCircle,
  Share2,
  X,
} from 'lucide-react';
import {
  downloadBlob,
  makeInquiryReportBlob,
  shareInquiryOnWhatsApp,
} from '../utils/dental.js';

/**
 * High-resolution prescription report renderer and preview dialog.
 * Renders the generated canvas image with options to download or transmit to WhatsApp.
 */
export default function InquiryReportRenderer({
  item,
  data,
  isOpen = false,
  onClose,
  notify,
}) {
  const [imageUrl, setImageUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    if (isOpen && item) {
      setLoading(true);
      makeInquiryReportBlob(item, data)
        .then((b) => {
          if (!active) return;
          setBlob(b);
          createdUrl = URL.createObjectURL(b);
          setImageUrl(createdUrl);
        })
        .catch((err) => {
          console.error('Failed to generate inquiry report image:', err);
          notify?.('Could not generate preview image');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setImageUrl(null);
      setBlob(null);
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, item?.id, item?.teeth?.length, item?.number, item?.date]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!blob) return;
    downloadBlob(blob, `Sheetal-Inquiry-${item.number}.png`);
    notify?.('Inquiry report image downloaded');
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const mode = await shareInquiryOnWhatsApp(item, data);
      if (mode === 'shared') {
        notify?.('Prescription report shared via WhatsApp');
      } else {
        notify?.('Prescription downloaded. WhatsApp opened with inquiry report.');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        notify?.('Could not share on WhatsApp');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Prescription Report Preview"
      onClick={onClose}
    >
      <div
        className="modal-card report-preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Eye size={18} />
            </div>
            <div>
              <h3>Inquiry Prescription Preview</h3>
              <p>
                Inquiry #{item.number} • Anatomical Odontogram Chart
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="report-preview-body">
          {loading ? (
            <div className="report-loading-state">
              <span className="spinner large" />
              <p>Rendering high-resolution anatomical chart report…</p>
            </div>
          ) : imageUrl ? (
            <div className="report-image-container">
              <img
                src={imageUrl}
                alt={`Dental Inquiry #${item.number} Prescription Report with Anatomical Odontogram`}
                className="report-preview-img"
              />
            </div>
          ) : (
            <div className="report-error-state">
              <p>Unable to generate report preview.</p>
            </div>
          )}
        </div>

        <div className="modal-footer report-preview-footer">
          <button
            type="button"
            className="outline-btn"
            onClick={handleDownload}
            disabled={!blob || loading}
          >
            <Download size={16} /> Download PNG
          </button>

          <button
            type="button"
            className="primary-btn whatsapp-share-btn"
            onClick={handleShare}
            disabled={!blob || loading || sharing}
          >
            <MessageCircle size={16} />
            <span>{sharing ? 'Opening WhatsApp…' : 'Share on WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

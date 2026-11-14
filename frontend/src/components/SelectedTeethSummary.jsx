import React from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { getSelectedTeethSummary } from '../utils/toothData';

/**
 * Summary component displayed immediately below the dental anatomical chart.
 * Groups selected teeth by Upper/Lower jaw and Patient's Right/Left sides.
 */
export default function SelectedTeethSummary({ selected = [], onRemoveTooth, onClearAll }) {
  const summary = getSelectedTeethSummary(selected);
  const total = summary.totalCount;

  if (total === 0) {
    return (
      <div className="selected-teeth-summary empty-summary">
        <div className="summary-empty-box">
          <Sparkles size={20} className="summary-empty-icon" />
          <div className="summary-empty-content">
            <h4>Selected Teeth</h4>
            <p>No teeth selected yet. Tap any tooth on the anatomical chart above to select.</p>
          </div>
        </div>
      </div>
    );
  }

  const renderChipGroup = (jaw, side, numbers, jawKey) => {
    if (!numbers || numbers.length === 0) {
      return <span className="side-empty-hint">None</span>;
    }

    return (
      <div className="tooth-chip-list">
        {numbers.map((num) => {
          // Find the original key to allow remove action
          const isRight = side === 'R';
          // In teeth array: 0..7 are Right (8..1), 8..15 are Left (1..8)
          const index = isRight
            ? [8, 7, 6, 5, 4, 3, 2, 1].indexOf(num)
            : 8 + [1, 2, 3, 4, 5, 6, 7, 8].indexOf(num);
          const key = `${jawKey}-${index}`;

          return (
            <span key={key} className="tooth-chip" title={`${jaw} ${side === 'R' ? "Patient's Right" : "Patient's Left"} #${num}`}>
              <span className="tooth-chip-side">{side}</span>
              <strong className="tooth-chip-num">{num}</strong>
              {onRemoveTooth && (
                <button
                  type="button"
                  className="tooth-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTooth(key);
                  }}
                  aria-label={`Deselect tooth ${jaw} ${num}`}
                >
                  <X size={11} strokeWidth={3} />
                </button>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <section className="selected-teeth-summary" aria-label="Selected Teeth Summary">
      <div className="summary-header">
        <div className="summary-header-left">
          <div className="summary-icon-badge">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <h4 className="summary-title">Selected Teeth</h4>
            <span className="summary-subtitle">Prescription summary grouped by jaw and quadrant</span>
          </div>
        </div>

        <div className="summary-header-right">
          <span className="summary-total-badge">
            <b>{total}</b> {total === 1 ? 'tooth' : 'teeth'} selected
          </span>
          {onClearAll && (
            <button
              type="button"
              className="summary-clear-btn"
              onClick={onClearAll}
              aria-label="Clear all selected teeth"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="summary-grid">
        {/* Upper Jaw Group */}
        <div className="summary-jaw-card">
          <div className="summary-jaw-head">
            <span className="summary-jaw-name">Upper Jaw (Maxillary)</span>
            <span className="summary-jaw-count">
              {summary.upper.count} {summary.upper.count === 1 ? 'tooth' : 'teeth'}
            </span>
          </div>

          <div className="summary-sides-row">
            <div className="summary-side-col">
              <span className="summary-side-label">Patient&apos;s Right</span>
              {renderChipGroup('Upper', 'R', summary.upper.right, 'U')}
            </div>
            <div className="summary-side-col">
              <span className="summary-side-label">Patient&apos;s Left</span>
              {renderChipGroup('Upper', 'L', summary.upper.left, 'U')}
            </div>
          </div>
        </div>

        {/* Lower Jaw Group */}
        <div className="summary-jaw-card">
          <div className="summary-jaw-head">
            <span className="summary-jaw-name">Lower Jaw (Mandibular)</span>
            <span className="summary-jaw-count">
              {summary.lower.count} {summary.lower.count === 1 ? 'tooth' : 'teeth'}
            </span>
          </div>

          <div className="summary-sides-row">
            <div className="summary-side-col">
              <span className="summary-side-label">Patient&apos;s Right</span>
              {renderChipGroup('Lower', 'R', summary.lower.right, 'L')}
            </div>
            <div className="summary-side-col">
              <span className="summary-side-label">Patient&apos;s Left</span>
              {renderChipGroup('Lower', 'L', summary.lower.left, 'L')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Columns,
  Grid,
  Info,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import ToothIllustration from './ToothIllustration.jsx';
import {
  LEFT_INDICES,
  RIGHT_INDICES,
  teeth,
  TOOTH_NAMES,
} from '../utils/toothData.js';

/**
 * Calculates a vertical offset for the natural dental parabolic arch curve.
 * Teeth 8,7,6 (molars) are positioned differently than anterior teeth (1,2,3).
 */
function getArchYOffset(index, jaw) {
  // Distance from midline (index 7 or 8 is distance 0; index 0 or 15 is distance 7)
  const distFromMidline = index <= 7 ? 7 - index : index - 8;
  // Quadratic parabolic curve: 0 at midline, up to ~18px at wisdom teeth
  const curve = Math.round(Math.pow(distFromMidline, 1.35) * 1.5);
  // Upper jaw curves downward towards midline; lower jaw curves upward towards midline
  return jaw === 'U' ? 18 - curve : curve;
}

export default function DentalOdontogram({ selected = [], setSelected }) {
  const [viewMode, setViewMode] = useState('arch'); // 'arch' | 'quadrant'
  const [activeHoverTooth, setActiveHoverTooth] = useState(null);

  const toggleTooth = (jaw, index) => {
    const key = `${jaw}-${index}`;
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllJaw = (jaw) => {
    const jawKeys = Array.from({ length: 16 }, (_, i) => `${jaw}-${i}`);
    setSelected((prev) => {
      const allSelected = jawKeys.every((k) => prev.includes(k));
      if (allSelected) {
        return prev.filter((k) => !k.startsWith(`${jaw}-`));
      }
      const existingOther = prev.filter((k) => !k.startsWith(`${jaw}-`));
      return [...existingOther, ...jawKeys];
    });
  };

  const clearAll = () => setSelected([]);

  const upperCount = selected.filter((k) => k.startsWith('U-')).length;
  const lowerCount = selected.filter((k) => k.startsWith('L-')).length;

  const renderTooth = (jaw, i, archMode = false) => {
    const num = teeth[i];
    const key = `${jaw}-${i}`;
    const isSelected = selected.includes(key);
    const side = i <= 7 ? 'R' : 'L';
    const typeName = TOOTH_NAMES[num];
    const yOffset = archMode ? getArchYOffset(i, jaw) : 0;

    return (
      <div
        key={key}
        className={`odontogram-tooth-slot ${isSelected ? 'is-selected' : ''}`}
        style={archMode ? { transform: `translateY(${yOffset}px)` } : undefined}
        onMouseEnter={() =>
          setActiveHoverTooth({
            jaw: jaw === 'U' ? 'Upper' : 'Lower',
            side: side === 'R' ? "Patient's Right" : "Patient's Left",
            num,
            typeName,
            selected: isSelected,
          })
        }
        onMouseLeave={() => setActiveHoverTooth(null)}
      >
        <ToothIllustration
          toothNumber={num}
          jaw={jaw}
          side={side}
          selected={isSelected}
          size={38}
          onClick={() => toggleTooth(jaw, i)}
          className="odontogram-tooth-btn"
        />
      </div>
    );
  };

  const renderJawRow = (jaw, jawTitle, jawSubtitle, jawCount) => {
    return (
      <div className="odontogram-jaw-section" data-jaw={jaw}>
        <div className="odontogram-jaw-bar">
          <div className="jaw-title-group">
            <span className="jaw-main-title">{jawTitle}</span>
            <span className="jaw-sub-title">{jawSubtitle}</span>
          </div>

          <div className="jaw-controls-group">
            <span
              className={`jaw-pill-badge ${jawCount > 0 ? 'active-count' : ''}`}
            >
              <b>{jawCount}</b> / 16 selected
            </span>
            <button
              type="button"
              className="jaw-quick-action"
              onClick={() => selectAllJaw(jaw)}
              title={`Toggle all ${jawTitle} teeth`}
            >
              {jawCount === 16 ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        </div>

        {/* Orientation Labels */}
        <div className="odontogram-side-indicators">
          <span className="indicator-side right-side">
            ← PATIENT&apos;S RIGHT
          </span>
          <span className="indicator-midline">MIDLINE</span>
          <span className="indicator-side left-side">
            PATIENT&apos;S LEFT →
          </span>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="odontogram-mobile-hint" aria-hidden="true">
          <span>↔ Swipe horizontally to view full 16-tooth arch</span>
        </div>

        {/* Teeth Arch / Quadrants Container */}
        <div
          className={`odontogram-teeth-container ${
            viewMode === 'arch' ? 'mode-arch' : 'mode-quadrant'
          }`}
        >
          {/* Patient's Right: Teeth 8, 7, 6, 5, 4, 3, 2, 1 */}
          <div className="teeth-quadrant-group quadrant-right">
            <div className="quadrant-teeth-flex">
              {RIGHT_INDICES.map((i) => renderTooth(jaw, i, viewMode === 'arch'))}
            </div>
          </div>

          {/* Center Midline Visual Pillar */}
          <div className="odontogram-midline-pillar" aria-hidden="true">
            <span className="pillar-line" />
            <span className="pillar-tag">MIDLINE</span>
            <span className="pillar-line" />
          </div>

          {/* Patient's Left: Teeth 1, 2, 3, 4, 5, 6, 7, 8 */}
          <div className="teeth-quadrant-group quadrant-left">
            <div className="quadrant-teeth-flex">
              {LEFT_INDICES.map((i) => renderTooth(jaw, i, viewMode === 'arch'))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dental-odontogram-card" aria-label="Anatomical Dental Odontogram">
      {/* Odontogram Top Controls Bar */}
      <div className="odontogram-top-bar">
        <div className="odontogram-title-area">
          <div className="odontogram-badge-icon">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="odontogram-title">Anatomical Dental Odontogram</h4>
            <p className="odontogram-caption">
              Click individual anatomical teeth to select or deselect. Preserves standard 8 to 1 prescription numbering.
            </p>
          </div>
        </div>

        <div className="odontogram-actions">
          {/* View mode toggle */}
          <div className="view-mode-pill" role="radiogroup" aria-label="Chart view mode">
            <button
              type="button"
              className={`view-pill-btn ${viewMode === 'arch' ? 'active' : ''}`}
              onClick={() => setViewMode('arch')}
              title="Anatomical Curved Arch View"
            >
              <Layers size={13} />
              <span>Arch View</span>
            </button>
            <button
              type="button"
              className={`view-pill-btn ${viewMode === 'quadrant' ? 'active' : ''}`}
              onClick={() => setViewMode('quadrant')}
              title="Structured Quadrant Grid View"
            >
              <Grid size={13} />
              <span>Grid View</span>
            </button>
          </div>

          {/* Clear button */}
          {selected.length > 0 && (
            <button
              type="button"
              className="odontogram-clear-btn"
              onClick={clearAll}
              title="Clear all selected teeth"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* UPPER JAW (Maxillary) */}
      {renderJawRow(
        'U',
        'UPPER JAW (MAXILLARY)',
        "Viewer's Left = Patient's Right  |  Viewer's Right = Patient's Left",
        upperCount
      )}

      {/* Occlusal Plane Separator */}
      <div className="occlusal-plane-divider" aria-hidden="true">
        <span className="plane-line" />
        <span className="plane-pill">
          OCCLUSAL PLANE • BITING SURFACE
        </span>
        <span className="plane-line" />
      </div>

      {/* LOWER JAW (Mandibular) */}
      {renderJawRow(
        'L',
        'LOWER JAW (MANDIBULAR)',
        "Viewer's Left = Patient's Right  |  Viewer's Right = Patient's Left",
        lowerCount
      )}

      {/* Dynamic Hover Inspector / Legend Footer */}
      <div className="odontogram-footer-bar">
        {activeHoverTooth ? (
          <div className="tooth-inspector-active">
            <span className="inspector-pill">
              <b>{activeHoverTooth.jaw}</b> {activeHoverTooth.side}
            </span>
            <strong className="inspector-name">
              #{activeHoverTooth.num} — {activeHoverTooth.typeName}
            </strong>
            <span className={`inspector-status ${activeHoverTooth.selected ? 'is-sel' : ''}`}>
              {activeHoverTooth.selected ? '✓ Selected' : 'Tap to select'}
            </span>
          </div>
        ) : (
          <div className="odontogram-legend">
            <span className="legend-item">
              <span className="legend-swatch sel" /> Selected tooth
            </span>
            <span className="legend-item">
              <span className="legend-swatch norm" /> Normal tooth
            </span>
            <span className="legend-hint">
              Tap any tooth illustration or number to toggle
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

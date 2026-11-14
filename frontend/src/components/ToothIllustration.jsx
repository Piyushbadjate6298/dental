import React from 'react';
import { Check } from 'lucide-react';
import { TOOTH_NAMES, TOOTH_PATHS } from '../utils/toothData.js';

/**
 * Anatomical vector illustration for an individual tooth.
 *
 * Displays:
 * - Specific anatomical crown silhouette based on tooth type (incisor, canine, premolar, molar).
 * - Occlusal grooves, cusp fissures, and developmental ridges.
 * - Selection highlight with smooth pop animation and glowing teal gradients.
 * - Bold original tooth number (1-8).
 */
export default function ToothIllustration({
  toothNumber,
  jaw = 'U',
  side = 'R',
  selected = false,
  onClick,
  showNumber = true,
  showName = false,
  size = 56,
  disabled = false,
  className = '',
  ariaLabel,
}) {
  const num = Number(toothNumber);
  const paths = TOOTH_PATHS[num] || TOOTH_PATHS[1];
  const typeName = TOOTH_NAMES[num] || `Tooth ${num}`;
  const isLower = jaw === 'L';
  const isLeft = side === 'L';

  // Unique gradient IDs per instance
  const gradientId = `enamel-grad-${jaw}-${side}-${num}-${selected ? 'sel' : 'norm'}`;
  const glowFilterId = `glow-${jaw}-${side}-${num}`;

  // Default accessible label
  const label =
    ariaLabel ||
    `${jaw === 'U' ? 'Upper' : 'Lower'} ${
      side === 'R' ? "Patient's Right" : "Patient's Left"
    } ${typeName} #${num}${selected ? ' (Selected)' : ''}`;

  return (
    <div
      role={onClick ? 'button' : 'figure'}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-label={label}
      aria-pressed={onClick ? selected : undefined}
      onClick={!disabled && onClick ? onClick : undefined}
      onKeyDown={(e) => {
        if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`tooth-illustration-card ${selected ? 'is-selected' : ''} ${
        disabled ? 'is-disabled' : ''
      } ${className}`}
      data-jaw={jaw}
      data-side={side}
      data-tooth={num}
    >
      <div
        className="tooth-svg-wrap"
        style={{
          width: '100%',
          maxWidth: size ? `${size}px` : '42px',
          height: 'auto',
          aspectRatio: '50 / 58',
        }}
      >
        <svg
          viewBox="0 0 50 60"
          className="tooth-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Linear gradient for tooth enamel */}
            {selected ? (
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
            ) : (
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
            )}

            {/* Subtle glow filter when selected */}
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="#0d9488"
                floodOpacity="0.35"
              />
            </filter>
          </defs>

          {/* Group with transforms for Left mirroring or Lower jaw vertical orientation */}
          <g
            filter={selected ? `url(#${glowFilterId})` : undefined}
            transform={`translate(${isLeft ? 50 : 0}, ${isLower ? 60 : 0}) scale(${
              isLeft ? -1 : 1
            }, ${isLower ? -1 : 1})`}
          >
            {/* Outer Anatomical Crown Silhouette */}
            <path
              d={paths.crown}
              className="tooth-path-crown"
              fill={`url(#${gradientId})`}
              stroke={selected ? '#0f766e' : '#94a3b8'}
              strokeWidth={selected ? '2' : '1.5'}
              strokeLinejoin="round"
            />

            {/* Incisal / Occlusal Main Edge Line */}
            {paths.incisal && (
              <path
                d={paths.incisal}
                className="tooth-path-incisal"
                fill="none"
                stroke={selected ? '#ffffff' : '#94a3b8'}
                strokeWidth={selected ? '1.8' : '1.4'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Anatomical Cusp Fissures & Developmental Grooves */}
            {paths.grooves && (
              <path
                d={paths.grooves}
                className="tooth-path-grooves"
                fill="none"
                stroke={selected ? 'rgba(255, 255, 255, 0.9)' : '#cbd5e1'}
                strokeWidth={selected ? '1.4' : '1.1'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Cervical / Fossa Accents */}
            {paths.fossa && (
              <path
                d={paths.fossa}
                className="tooth-path-fossa"
                fill="none"
                stroke={selected ? 'rgba(255, 255, 255, 0.75)' : '#cbd5e1'}
                strokeWidth="1"
                strokeLinecap="round"
              />
            )}

            {/* Subtle natural enamel highlight specular curve */}
            <path
              d="M 16,14 C 18,11 32,11 34,14"
              fill="none"
              stroke={selected ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.85)'}
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
        </svg>

        {/* Selected Checkmark Badge (top-right overlay) */}
        {selected && (
          <span className="tooth-selected-check" aria-hidden="true">
            <Check size={11} strokeWidth={3.5} />
          </span>
        )}
      </div>

      {/* Tooth Number & Name */}
      {showNumber && (
        <div className="tooth-num-badge">
          <strong className="tooth-num-text">{num}</strong>
        </div>
      )}

      {showName && (
        <span className="tooth-name-label" title={typeName}>
          {typeName}
        </span>
      )}
    </div>
  );
}

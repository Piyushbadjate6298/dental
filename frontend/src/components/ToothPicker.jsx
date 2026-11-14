import React from 'react';
import DentalOdontogram from './DentalOdontogram';
import SelectedTeethSummary from './SelectedTeethSummary';

/**
 * Main Tooth Picker component combining:
 * 1. Realistic anatomical dental odontogram (all 32 permanent teeth).
 * 2. Dedicated Selected Teeth summary below the chart.
 *
 * Preserves standard Palmer 8 to 1 prescription numbering and React state mapping.
 */
export default function ToothPicker({ selected = [], setSelected }) {
  const handleRemoveTooth = (key) => {
    setSelected((prev) => prev.filter((k) => k !== key));
  };

  const handleClearAll = () => {
    setSelected([]);
  };

  return (
    <div className="tooth-picker-unified">
      {/* 1. Realistic Anatomical Tooth Chart */}
      <DentalOdontogram selected={selected} setSelected={setSelected} />

      {/* 2. Grouped Selected Teeth Summary immediately below */}
      <SelectedTeethSummary
        selected={selected}
        onRemoveTooth={handleRemoveTooth}
        onClearAll={selected.length > 0 ? handleClearAll : undefined}
      />
    </div>
  );
}

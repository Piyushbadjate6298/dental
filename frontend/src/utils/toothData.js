/**
 * Dental Odontogram Anatomy and Path Definitions
 * Shital Dental Services
 *
 * Implements Palmer notation tooth numbering:
 * Upper: 8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8
 * Lower: 8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8
 *
 * Patient's Right on viewer's Left, Patient's Left on viewer's Right.
 */

export const teeth = [8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8];

export const RIGHT_INDICES = [0, 1, 2, 3, 4, 5, 6, 7];
export const LEFT_INDICES = [8, 9, 10, 11, 12, 13, 14, 15];

export const TOOTH_NAMES = {
  1: 'Central Incisor',
  2: 'Lateral Incisor',
  3: 'Canine',
  4: 'First Premolar',
  5: 'Second Premolar',
  6: 'First Molar',
  7: 'Second Molar',
  8: 'Third Molar (Wisdom)',
};

/**
 * Standardized 50x60 vector paths for the 8 anatomical permanent tooth types.
 * Coordinates are normalized to a 50x60 viewBox.
 */
export const TOOTH_PATHS = {
  // 1: Central Incisor - Broad shovel/chisel incisal cutting edge, marginal ridges
  1: {
    crown: 'M 11,46 C 11,51 16,54 25,54 C 34,54 39,51 39,46 C 39,32 38,15 37,8 C 37,6 35,6 34,6 L 16,6 C 15,6 13,6 13,8 C 12,15 11,32 11,46 Z',
    incisal: 'M 15,7.5 L 35,7.5',
    grooves: 'M 19,10 L 20,32 M 31,10 L 30,32',
    fossa: 'M 16,45 C 21,48 29,48 34,45',
  },

  // 2: Lateral Incisor - Narrower incisor with distinctly rounded disto-incisal angle
  2: {
    crown: 'M 13,46 C 13,51 17,54 25,54 C 33,54 37,51 37,46 C 37,32 36,17 35,11 C 34,7.5 31,6.5 29,6.5 L 16,6.5 C 14,6.5 13,7.5 13,10 C 13,17 13,32 13,46 Z',
    incisal: 'M 15,8 L 30,8 C 33,8.5 34.5,10 35,12',
    grooves: 'M 20,11 L 21,30 M 29,13 L 28,30',
    fossa: 'M 17,45 C 21,47.5 29,47.5 33,45',
  },

  // 3: Canine (Cuspid) - Distinctive spearhead/diamond shape with prominent pointed cusp tip
  3: {
    crown: 'M 25,5.5 C 22,8.5 15,13.5 12,17.5 C 9.5,21 9.5,28 11.5,34 C 13.5,40 16,48 18.5,52 C 21,54 29,54 31.5,52 C 34,48 36.5,40 38.5,34 C 40.5,28 40.5,21 38,17.5 C 35,13.5 28,8.5 25,5.5 Z',
    incisal: 'M 25,5.5 L 25,38',
    grooves: 'M 18,20 C 18,27 21,34 25,37 M 32,20 C 32,27 29,34 25,37',
    fossa: 'M 17,47 C 21,50 29,50 33,47',
  },

  // 4: First Premolar (Bicuspid) - Two distinct cusps (buccal & lingual) with deep central groove
  4: {
    crown: 'M 25,6.5 C 16,6.5 10,12.5 9,23.5 C 8,34.5 14,51.5 25,51.5 C 36,51.5 42,34.5 41,23.5 C 40,12.5 34,6.5 25,6.5 Z',
    incisal: 'M 16,28 C 21,29 29,29 34,28',
    grooves: 'M 25,7.5 L 25,27 M 21,12 L 25,27 M 29,12 L 25,27 M 25,50.5 L 25,29 M 21,45 L 25,29 M 29,45 L 25,29',
    fossa: 'M 16,28 L 13.5,24 M 16,28 L 13.5,32 M 34,28 L 36.5,24 M 34,28 L 36.5,32',
  },

  // 5: Second Premolar - Rounded oval bicuspid with crescentic/Y-shaped groove
  5: {
    crown: 'M 25,6.5 C 15.5,6.5 9.5,13.5 9.5,25.5 C 9.5,37.5 15.5,51.5 25,51.5 C 34.5,51.5 40.5,37.5 40.5,25.5 C 40.5,13.5 34.5,6.5 25,6.5 Z',
    incisal: 'M 16.5,26 C 21.5,27.5 25,27.5 25,30 L 25,48 M 25,30 C 28.5,27.5 33.5,26 33.5,26',
    grooves: 'M 25,7.5 L 25,24 M 18.5,13 L 23,24 M 31.5,13 L 27,24',
    fossa: 'M 15,22 C 16.5,26 16.5,31 15,35 M 35,22 C 33.5,26 33.5,31 35,35',
  },

  // 6: First Molar - Largest molar, rhomboid/trapezoid crown, 4-5 cusps with oblique/Y grooves
  6: {
    crown: 'M 25,5.5 C 13.5,5.5 6.5,12.5 6.5,25.5 C 6.5,38.5 12.5,52.5 25,52.5 C 37.5,52.5 43.5,38.5 43.5,25.5 C 43.5,12.5 36.5,5.5 25,5.5 Z',
    incisal: 'M 7.5,26 L 42.5,26 M 25,6.5 L 25,51.5',
    grooves: 'M 15,15 C 21,21 29,31 35,37 M 15,37 C 21,31 29,21 35,15',
    fossa: 'M 25,26 C 23,23 23,29 25,26 M 12,21 L 14.5,26 L 12,31 M 38,21 L 35.5,26 L 38,31',
  },

  // 7: Second Molar - 4 distinct cusps with classic cruciform (+) groove pattern
  7: {
    crown: 'M 25,6.5 C 14.5,6.5 7.5,13.5 7.5,25.5 C 7.5,37.5 13.5,51.5 25,51.5 C 36.5,51.5 42.5,37.5 42.5,25.5 C 42.5,13.5 35.5,6.5 25,6.5 Z',
    incisal: 'M 8.5,26 L 41.5,26 M 25,7.5 L 25,50.5',
    grooves: 'M 17,16 L 33,36 M 17,36 L 33,16',
    fossa: 'M 12,22 L 14.5,26 L 12,30 M 38,22 L 35.5,26 L 38,30',
  },

  // 8: Third Molar (Wisdom) - Rounded compact heart/triangular crown with crenulated fissures
  8: {
    crown: 'M 25,8.5 C 15.5,8.5 9.5,15.5 9.5,26.5 C 9.5,37.5 15.5,49.5 25,49.5 C 34.5,49.5 40.5,37.5 40.5,26.5 C 40.5,15.5 34.5,8.5 25,8.5 Z',
    incisal: 'M 11,26.5 C 18,27 32,27 39,26.5 M 25,9.5 L 25,48.5',
    grooves: 'M 17,17 L 22,24 M 33,17 L 28,24 M 19,37 L 23,31 M 31,37 L 27,31',
    fossa: 'M 14,24 L 15.5,26.5 L 14,29 M 36,24 L 34.5,26.5 L 36,29',
  },
};

/**
 * Returns detailed metadata for any tooth given jaw ('U' | 'L') and index (0..15).
 */
export function getToothInfo(jaw, index) {
  const i = Number(index);
  const toothNumber = teeth[i];
  const isRight = i <= 7;
  const side = isRight ? 'R' : 'L';
  const sideLabel = isRight ? "Patient's Right" : "Patient's Left";
  const jawLabel = jaw === 'U' ? 'Upper Jaw (Maxillary)' : 'Lower Jaw (Mandibular)';
  const jawShort = jaw === 'U' ? 'Upper' : 'Lower';
  const quadCode = `${jaw}${side}`;
  const key = `${jaw}-${i}`;
  const toothName = `${jawShort} ${sideLabel} ${TOOTH_NAMES[toothNumber]} (#${toothNumber})`;

  return {
    key,
    jaw,
    jawShort,
    jawLabel,
    index: i,
    toothNumber,
    side,
    sideLabel,
    quadCode,
    toothName,
    typeName: TOOTH_NAMES[toothNumber],
  };
}

/**
 * Groups selected teeth keys into Upper and Lower jaws, separated by Patient's Right and Patient's Left.
 * Numbers are ordered naturally (1 to 8 from midline outward, or as selected).
 */
export function getSelectedTeethSummary(keys = []) {
  const summary = {
    upper: {
      right: [],
      left: [],
      count: 0,
    },
    lower: {
      right: [],
      left: [],
      count: 0,
    },
    totalCount: (keys || []).length,
  };

  (keys || []).forEach((k) => {
    const [j, rawI] = k.split('-');
    const i = Number(rawI);
    const num = teeth[i];
    const isRight = i <= 7;

    if (j === 'U') {
      if (isRight) summary.upper.right.push(num);
      else summary.upper.left.push(num);
      summary.upper.count++;
    } else if (j === 'L') {
      if (isRight) summary.lower.right.push(num);
      else summary.lower.left.push(num);
      summary.lower.count++;
    }
  });

  // Sort numbers in anatomical order (1 to 8 or preserve user view)
  summary.upper.right.sort((a, b) => a - b);
  summary.upper.left.sort((a, b) => a - b);
  summary.lower.right.sort((a, b) => a - b);
  summary.lower.left.sort((a, b) => a - b);

  return summary;
}

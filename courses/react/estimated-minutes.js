/** Minutos estimados por nivel (1–30). */
export const ESTIMATED_MINUTES_BY_LEVEL = {
  1: 15,
  2: 20,
  3: 20,
  4: 20,
  5: 25,
  6: 25,
  7: 25,
  8: 25,
  9: 30,
  10: 30,
  11: 25,
  12: 30,
  13: 25,
  14: 30,
  15: 35,
  16: 35,
  17: 35,
  18: 30,
  19: 30,
  20: 40,
  21: 35,
  22: 40,
  23: 35,
  24: 30,
  25: 25,
  26: 35,
  27: 30,
  28: 25,
  29: 30,
  30: 35,
};

export const REACT_COURSE_ESTIMATED_MINUTES = Object.values(
  ESTIMATED_MINUTES_BY_LEVEL
).reduce((sum, m) => sum + m, 0);

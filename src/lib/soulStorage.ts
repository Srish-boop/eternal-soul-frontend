export function saveSoulData(reflections: any, scores: any) {
  localStorage.setItem('soul_reflections', JSON.stringify(reflections));
  localStorage.setItem('soul_scores', JSON.stringify(scores));
}

export function getSoulReflections() {
  const data = localStorage.getItem('soul_reflections');
  return data ? JSON.parse(data) : null;
}

export function getSoulScores() {
  const data = localStorage.getItem('soul_scores');
  return data ? JSON.parse(data) : null;
}

export function clearSoulData() {
  localStorage.removeItem('soul_reflections');
  localStorage.removeItem('soul_scores');
}

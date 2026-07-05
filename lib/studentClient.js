const LOCAL_KEY = "glory_current_student";

export function getSavedStudentId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_KEY);
}

export function saveStudentId(id) {
  if (typeof window !== "undefined") localStorage.setItem(LOCAL_KEY, id);
}

export function clearSavedStudent() {
  if (typeof window !== "undefined") localStorage.removeItem(LOCAL_KEY);
}

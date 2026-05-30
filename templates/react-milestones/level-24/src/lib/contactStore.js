const KEY = "portfolio-contact-messages";

export function saveContactMessage({ name, email, message }) {
  const list = JSON.parse(localStorage.getItem(KEY) || "[]");
  list.push({ name, email, message, at: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(list));
}


export async function signupUser(name, email, password, type) {
  const res = await fetch(`${SERVER_URL}/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, type }),
  });
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${SERVER_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function saveVoice(userId, uri, emergencyType) {
  const res = await fetch(`${SERVER_URL}/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, uri, emergencyType }),
  });
  return res.json();
}

export async function saveGesture(userId, gesture, emergencyType) {
  const res = await fetch(`${SERVER_URL}/gesture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, gesture, emergencyType }),
  });
  return res.json();
}

export async function saveEmergencyContact(userId, type, number) {
  const res = await fetch(`${SERVER_URL}/emergency`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, type, number }),
  });
  return res.json();
}

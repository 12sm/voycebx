const K = {
  apiKey:     'voycebx:apiKey',
  voiceId:    'voycebx:voiceId',
  voiceName:  'voycebx:voiceName',
  favorites:  'voycebx:favorites',
  transcript: 'voycebx:transcript',
}

const DEFAULT_FAVORITES = [
  'Yes',
  'No',
  'Thank you',
  'I need water',
  'I am in pain',
  'Please call the nurse',
  'I need a moment',
  'Can you repeat that?',
  'I love you',
  'I am okay',
  'Please call my family',
  'I need to rest',
]

export function getApiKey()   { return localStorage.getItem(K.apiKey) || '' }
export function setApiKey(v)  { v ? localStorage.setItem(K.apiKey, v) : localStorage.removeItem(K.apiKey) }

export function getVoiceId()  { return localStorage.getItem(K.voiceId) || '' }
export function setVoiceId(v) { v ? localStorage.setItem(K.voiceId, v) : localStorage.removeItem(K.voiceId) }

export function getVoiceName()  { return localStorage.getItem(K.voiceName) || 'My Voice' }
export function setVoiceName(v) { localStorage.setItem(K.voiceName, v) }

export function getFavorites() {
  try {
    const raw = localStorage.getItem(K.favorites)
    if (raw) return JSON.parse(raw)
  } catch {}
  return [...DEFAULT_FAVORITES]
}
export function setFavorites(list) {
  localStorage.setItem(K.favorites, JSON.stringify(list))
}

export function getTranscript() {
  try { return JSON.parse(localStorage.getItem(K.transcript)) || [] }
  catch { return [] }
}
export function saveTranscript(entries) {
  // Cap at 500 entries so storage doesn't grow unbounded
  const capped = entries.slice(-500)
  localStorage.setItem(K.transcript, JSON.stringify(capped))
}

export function clearTranscript() {
  localStorage.removeItem(K.transcript)
}

export function getTheme() { return localStorage.getItem('voycebx:theme') || 'dark' }
export function setTheme(v) { localStorage.setItem('voycebx:theme', v) }

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

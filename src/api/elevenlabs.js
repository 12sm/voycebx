const BASE = 'https://api.elevenlabs.io/v1'

function authHeaders(apiKey) {
  return { 'xi-api-key': apiKey }
}

export async function testApiKey(apiKey) {
  const res = await fetch(`${BASE}/user`, {
    headers: authHeaders(apiKey),
  })
  if (!res.ok) {
    let detail = ''
    try { const d = await res.json(); detail = d.detail?.message || d.detail || '' } catch {}
    throw new Error(`ElevenLabs rejected the key (${res.status}${detail ? ': ' + detail : ''}). Double-check it was copied in full.`)
  }
  return true
}

export async function cloneVoice(apiKey, audioBlob, name = 'My Voice') {
  const form = new FormData()
  form.append('name', name)
  form.append('description', 'Voice clone created with VoyceBx')

  // Determine extension from MIME type
  const mime = audioBlob.type || ''
  const ext = mime.includes('webm') ? 'webm'
             : mime.includes('mp4') || mime.includes('m4a') ? 'm4a'
             : mime.includes('ogg') ? 'ogg'
             : 'wav'

  form.append('files', audioBlob, `sample.${ext}`)

  const res = await fetch(`${BASE}/voices/add`, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: form,
  })

  if (!res.ok) {
    let msg = `Could not clone voice (${res.status})`
    try {
      const data = await res.json()
      if (data.detail?.message) msg = data.detail.message
      else if (typeof data.detail === 'string') msg = data.detail
    } catch {}
    throw new Error(msg)
  }

  const data = await res.json()
  return data.voice_id
}

export async function demoTextToSpeech(text, usageCount) {
  const res = await fetch('/api/demo-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, usageCount }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Demo failed (${res.status})`)
  }
  return res.arrayBuffer()
}

export async function listVoices(apiKey) {
  const res = await fetch(`${BASE}/voices`, {
    headers: authHeaders(apiKey),
  })
  if (!res.ok) throw new Error(`Could not load voice library (${res.status})`)
  const data = await res.json()
  // Sort cloned voices first, then by name
  return (data.voices || []).sort((a, b) => {
    if (a.category === 'cloned' && b.category !== 'cloned') return -1
    if (b.category === 'cloned' && a.category !== 'cloned') return 1
    return a.name.localeCompare(b.name)
  })
}

export async function textToSpeech(apiKey, voiceId, text) {
  const res = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.50,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  })

  if (!res.ok) {
    let msg = `Speech generation failed (${res.status})`
    try {
      const data = await res.json()
      if (data.detail?.message) msg = data.detail.message
      else if (typeof data.detail === 'string') msg = data.detail
    } catch {}
    throw new Error(msg)
  }

  return res.arrayBuffer()
}

const BASE = 'https://api.elevenlabs.io/v1'

// ElevenLabs accepts both xi-api-key (legacy) and Authorization: Bearer (sk_ keys)
function authHeaders(apiKey) {
  return {
    'xi-api-key': apiKey,
    'Authorization': `Bearer ${apiKey}`,
  }
}

export async function testApiKey(apiKey) {
  const res = await fetch(`${BASE}/user`, {
    headers: authHeaders(apiKey),
  })
  if (!res.ok) throw new Error(`Key rejected by ElevenLabs (${res.status})`)
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

export async function textToSpeech(apiKey, voiceId, text) {
  const res = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      ...authHeaders(apiKey),
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

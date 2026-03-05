const DEMO_VOICE_ID = process.env.DEMO_VOICE_ID || '21m00Tcm4TlvDq8ikWAM' // ElevenLabs "Rachel"
const API_KEY       = process.env.ELEVENLABS_API_KEY
const DEMO_LIMIT    = parseInt(process.env.DEMO_LIMIT || '10', 10)
const MAX_CHARS     = 300

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  if (!API_KEY) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Demo mode is not configured on this server.' }) }
  }

  let text, usageCount
  try {
    ;({ text, usageCount } = JSON.parse(event.body || '{}'))
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) }
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Text is required.' }) }
  }

  if (text.length > MAX_CHARS) {
    return { statusCode: 400, body: JSON.stringify({ error: `Demo text is limited to ${MAX_CHARS} characters.` }) }
  }

  if (typeof usageCount === 'number' && usageCount >= DEMO_LIMIT) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Demo limit reached. Add your ElevenLabs key to continue.' }) }
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${DEMO_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: `Speech generation failed (${res.status}).` }) }
    }

    const buffer = await res.arrayBuffer()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true,
    }
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Demo request failed. Please try again.' }) }
  }
}

import { getApiKey, setApiKey, getVoiceId, getVoiceName, setVoiceId, setVoiceName } from '../store.js'
import { testApiKey, cloneVoice } from '../api/elevenlabs.js'

// The Rainbow Passage — standard clinical voice sample used by SLPs
const SAMPLE_PASSAGE = `When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow.`

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function mountSetup(container, onComplete) {
  // ── State ────────────────────────────────────────────────────────────────
  let step        = 1
  let apiKey      = getApiKey()
  let voiceName   = getVoiceName()
  let audioBlob   = null
  let audioUrl    = null
  let recSeconds  = 0
  let timerRef    = null
  let mediaRec    = null
  let chunks      = []
  let loading     = false

  // ── Outer shell (persists, inner swaps) ─────────────────────────────────
  const outer = document.createElement('div')
  outer.className = 'app-view'

  const scrollEl = document.createElement('div')
  scrollEl.className = 'setup-outer'

  const inner = document.createElement('div')
  inner.className = 'setup-inner'
  scrollEl.appendChild(inner)
  outer.appendChild(scrollEl)
  container.appendChild(outer)

  // ── Render orchestration ─────────────────────────────────────────────────
  function render() {
    inner.innerHTML = ''

    // Logo
    const logo = document.createElement('div')
    logo.className = 'setup-logo'
    logo.innerHTML = `<h1>VoyceBx</h1><p>Vocal continuity for life's most important moments</p>`
    inner.appendChild(logo)

    // Progress dots
    const dots = document.createElement('div')
    dots.className = 'progress-dots'
    for (let i = 1; i <= 3; i++) {
      const d = document.createElement('div')
      d.className = `dot${i === step ? ' active' : ''}`
      dots.appendChild(d)
    }
    inner.appendChild(dots)

    // Step content
    const stepEl = document.createElement('div')
    stepEl.className = 'setup-step'
    inner.appendChild(stepEl)

    if (step === 1) renderApiKey(stepEl)
    else if (step === 2) renderRecord(stepEl)
    else if (step === 3) renderClone(stepEl)
    else if (step === 4) renderDone(stepEl)
  }

  // ── Step 1: API Key ──────────────────────────────────────────────────────
  function renderApiKey(el) {
    el.innerHTML = `
      <div class="step-label">Step 1 of 3</div>
      <div class="step-title">Connect ElevenLabs</div>
      <p class="step-body">
        VoyceBx uses ElevenLabs to generate speech in your cloned voice.
        Enter your API key below — it stays on this device only.
      </p>
      <input
        type="password"
        class="input"
        id="api-key-input"
        placeholder="sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        value="${esc(apiKey)}"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="none"
        spellcheck="false"
      />
      <div id="step1-status"></div>
      <button class="btn btn-primary" id="btn-verify">Verify &amp; Continue</button>
      <div class="text-center">
        <a href="https://elevenlabs.io" target="_blank" class="step-link">
          Create an ElevenLabs account →
        </a>
      </div>
    `

    const input  = el.querySelector('#api-key-input')
    const btn    = el.querySelector('#btn-verify')
    const status = el.querySelector('#step1-status')

    input.focus()
    input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click() })

    btn.addEventListener('click', async () => {
      const key = input.value.trim()
      if (!key) { showStatus(status, 'error', 'Please enter your API key.'); return }

      btn.disabled = true
      btn.textContent = 'Verifying…'
      clearStatus(status)

      try {
        await testApiKey(key)
        apiKey = key
        setApiKey(key)
        step = 2
        render()
      } catch (err) {
        showStatus(status, 'error', err.message)
        btn.disabled = false
        btn.textContent = 'Verify & Continue'
      }
    })
  }

  // ── Step 2: Record ───────────────────────────────────────────────────────
  function renderRecord(el) {
    let recording = false

    el.innerHTML = `
      <div class="step-label">Step 2 of 3</div>
      <div class="step-title">Record your voice</div>
      <p class="step-body">
        Find a quiet space. Read the passage below aloud — clearly and naturally.
        Aim for at least <strong>30 seconds</strong>.
      </p>

      <div class="sample-passage">${esc(SAMPLE_PASSAGE)}</div>

      <div class="record-area">
        <button class="record-btn" id="rec-btn" aria-label="Start recording">
          ${ICON_MIC}
        </button>
        <div class="record-timer" id="rec-timer">0:00</div>
        <p class="record-hint" id="rec-hint">Tap the button to begin</p>
      </div>

      <div id="step2-status"></div>
    `

    const recBtn  = el.querySelector('#rec-btn')
    const timer   = el.querySelector('#rec-timer')
    const hint    = el.querySelector('#rec-hint')
    const status  = el.querySelector('#step2-status')

    recBtn.addEventListener('click', async () => {
      if (!recording) {
        // ── Start ──
        clearStatus(status)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

          chunks = []
          mediaRec = new MediaRecorder(stream)
          mediaRec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

          mediaRec.onstop = () => {
            stream.getTracks().forEach(t => t.stop())
            audioBlob = new Blob(chunks, { type: mediaRec.mimeType })
            audioUrl  = URL.createObjectURL(audioBlob)
            clearInterval(timerRef)
            recording = false
            step = 3
            render()
          }

          mediaRec.start(100)
          recording = true
          recSeconds = 0

          recBtn.className = 'record-btn recording'
          recBtn.innerHTML = ICON_STOP
          hint.textContent = 'Recording… tap to stop'

          timerRef = setInterval(() => {
            recSeconds++
            timer.textContent = fmtTime(recSeconds)
          }, 1000)
        } catch (err) {
          showStatus(status, 'error', 'Microphone access denied. Please allow microphone permission and try again.')
        }
      } else {
        // ── Stop ──
        clearInterval(timerRef)
        if (mediaRec && mediaRec.state !== 'inactive') mediaRec.stop()
        recording = false

        if (recSeconds < 5) {
          showStatus(status, 'error', 'Recording was too short. Please record at least 30 seconds for best results.')
          recBtn.className = 'record-btn'
          recBtn.innerHTML = ICON_MIC
          hint.textContent = 'Tap the button to begin'
          timer.textContent = '0:00'
        }
        // onstop handler takes over if recording was long enough
      }
    })
  }

  // ── Step 3: Review & Clone ───────────────────────────────────────────────
  function renderClone(el) {
    el.innerHTML = `
      <div class="step-label">Step 3 of 3</div>
      <div class="step-title">Create your voice clone</div>
      <p class="step-body">
        Listen back to confirm the recording sounds clear, then give your voice a name and create your clone.
      </p>

      <div class="audio-preview">
        <span class="audio-preview-label">Your recording — ${fmtTime(recSeconds)}</span>
        <button class="btn-icon" id="btn-play-preview" title="Play recording">
          ${ICON_PLAY}
        </button>
      </div>

      <div class="gap-stack">
        <label style="font-size:14px;color:var(--muted)">Name this voice</label>
        <input
          type="text"
          class="input"
          id="voice-name-input"
          placeholder="e.g. My Voice"
          value="${esc(voiceName)}"
          maxlength="50"
        />
      </div>

      <div id="step3-status"></div>

      <button class="btn btn-primary" id="btn-clone">Create Voice Clone</button>
      <button class="btn btn-ghost" id="btn-rerecord">Re-record</button>
    `

    const playBtn    = el.querySelector('#btn-play-preview')
    const nameInput  = el.querySelector('#voice-name-input')
    const cloneBtn   = el.querySelector('#btn-clone')
    const rerecBtn   = el.querySelector('#btn-rerecord')
    const status     = el.querySelector('#step3-status')
    let previewAudio = null

    playBtn.addEventListener('click', () => {
      if (!audioUrl) return
      if (previewAudio) { previewAudio.pause(); previewAudio = null; return }
      previewAudio = new Audio(audioUrl)
      previewAudio.onended = () => { previewAudio = null }
      previewAudio.play().catch(() => {})
    })

    rerecBtn.addEventListener('click', () => {
      if (previewAudio) { previewAudio.pause(); previewAudio = null }
      audioBlob = null; audioUrl = null; recSeconds = 0
      step = 2
      render()
    })

    cloneBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim() || 'My Voice'
      voiceName = name

      cloneBtn.disabled = true
      rerecBtn.disabled = true
      cloneBtn.textContent = 'Creating clone…'
      clearStatus(status)

      try {
        const voiceId = await cloneVoice(apiKey, audioBlob, name)
        setVoiceId(voiceId)
        setVoiceName(name)
        step = 4
        render()
      } catch (err) {
        showStatus(status, 'error', err.message)
        cloneBtn.disabled = false
        rerecBtn.disabled = false
        cloneBtn.textContent = 'Create Voice Clone'
      }
    })
  }

  // ── Step 4: Done ─────────────────────────────────────────────────────────
  function renderDone(el) {
    const name = getVoiceName()
    el.innerHTML = `
      <div class="step-label">All set</div>
      <div class="step-title">Your voice is ready</div>
      <p class="step-body">
        <strong>${esc(name)}</strong> has been saved. You can now type anything and hear it
        spoken in your voice.
      </p>
      <div class="status status-success">
        Voice clone created successfully. You can re-record anytime from Settings.
      </div>
      <button class="btn btn-primary" id="btn-start">Start Speaking</button>
    `

    el.querySelector('#btn-start').addEventListener('click', onComplete)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function showStatus(el, type, text) {
    el.innerHTML = `<div class="status status-${type}">${esc(text)}</div>`
  }
  function clearStatus(el) { el.innerHTML = '' }

  // ── Init ──────────────────────────────────────────────────────────────────
  render()
}

// ── Icons ─────────────────────────────────────────────────────────────────
const ICON_MIC = `<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
  <rect x="9" y="2" width="6" height="12" rx="3"/>
  <path d="M5 10a7 7 0 0 0 14 0"/>
  <line x1="12" y1="19" x2="12" y2="22"/>
  <line x1="8" y1="22" x2="16" y2="22"/>
</svg>`

const ICON_STOP = `<svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24">
  <rect x="4" y="4" width="16" height="16" rx="3"/>
</svg>`

const ICON_PLAY = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <polygon points="5 3 19 12 5 21 5 3"/>
</svg>`

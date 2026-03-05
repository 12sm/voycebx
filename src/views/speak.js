import {
  getApiKey, getVoiceId, getVoiceName,
  getFavorites, setFavorites,
  getTranscript, saveTranscript, clearTranscript,
} from '../store.js'
import { textToSpeech } from '../api/elevenlabs.js'

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function isMobile() {
  return /Mobi|Android|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 1024)
}

// In-memory cache: entryId → ArrayBuffer (cleared on page reload)
const audioCache = new Map()

// Persistent AudioContext — created on first user gesture to unlock iOS audio
let audioCtx = null

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume synchronously — required call must happen in user gesture stack
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

async function playBuffer(arrayBuffer) {
  // Create a blob URL and use <audio> for broadest iOS compatibility
  const blob   = new Blob([arrayBuffer], { type: 'audio/mpeg' })
  const url    = URL.createObjectURL(blob)
  const audio  = new Audio(url)
  audio.preload = 'auto'

  try {
    await audio.play()
    await new Promise((resolve, reject) => {
      audio.onended = resolve
      audio.onerror = reject
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function mountSpeak(container, onSetup) {
  // ── State ─────────────────────────────────────────────────────────────────
  let transcript = getTranscript()   // [{ id, text, timestamp }]
  let favorites  = getFavorites()
  let sending    = false             // true while TTS is in flight / playing
  let playingId  = null              // entry currently playing

  // ── Build DOM ─────────────────────────────────────────────────────────────
  const view = document.createElement('div')
  view.className = 'app-view'
  view.innerHTML = `
    <header class="app-header">
      <span class="app-title">
        VoyceBx
        <span class="voice-label" id="voice-label">${esc(getVoiceName())}</span>
      </span>
      <div style="display:flex;gap:4px;align-items:center">
        <button class="btn-icon" id="btn-clear" title="Clear transcript">${ICON_TRASH}</button>
        <button class="btn-icon" id="btn-settings" title="Settings">${ICON_SETTINGS}</button>
      </div>
    </header>

    <div class="favorites-bar">
      <div class="favorites-scroll" id="fav-scroll"></div>
      <button class="btn-icon" id="btn-edit-favs" title="Edit favorites">${ICON_EDIT}</button>
    </div>

    <div class="speaking-bar hidden" id="speaking-bar">
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
      <div class="wave-bar"></div>
    </div>

    <div class="transcript" id="transcript"></div>

    <div id="error-banner" class="hidden" style="padding:8px 16px;flex-shrink:0">
      <div class="status status-error" id="error-text"></div>
    </div>

    <div class="input-area">
      <textarea
        class="speak-textarea"
        id="speak-input"
        placeholder="Type to speak…"
        rows="1"
        enterkeyhint="send"
      ></textarea>
      <button class="btn-send" id="btn-send" disabled>${ICON_SEND}</button>
    </div>
  `
  container.appendChild(view)

  // ── Element refs ──────────────────────────────────────────────────────────
  const favScroll    = view.querySelector('#fav-scroll')
  const transcriptEl = view.querySelector('#transcript')
  const speakingBar  = view.querySelector('#speaking-bar')
  const textarea     = view.querySelector('#speak-input')
  const btnSend      = view.querySelector('#btn-send')
  const errorBanner  = view.querySelector('#error-banner')
  const errorText    = view.querySelector('#error-text')
  const btnEditFavs  = view.querySelector('#btn-edit-favs')
  const btnSettings  = view.querySelector('#btn-settings')
  const btnClear     = view.querySelector('#btn-clear')

  // ── Initial render ────────────────────────────────────────────────────────
  renderFavorites()
  renderTranscript()

  // ── Events ────────────────────────────────────────────────────────────────
  btnSettings.addEventListener('click', onSetup)

  btnClear.addEventListener('click', () => {
    if (!confirm('Clear all spoken text from the screen?')) return
    transcript = []
    clearTranscript()
    renderTranscript()
  })

  btnEditFavs.addEventListener('click', () => openFavModal())

  textarea.addEventListener('input', () => {
    btnSend.disabled = !textarea.value.trim() || sending
    autoResize(textarea)
  })

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isMobile()) {
      e.preventDefault()
      if (!btnSend.disabled) handleSend()
    }
  })

  btnSend.addEventListener('click', () => {
    // Unlock AudioContext synchronously in user gesture before any async
    getAudioCtx()
    handleSend()
  })

  // ── Send ──────────────────────────────────────────────────────────────────
  async function handleSend(textOverride) {
    const text = (textOverride || textarea.value).trim()
    if (!text || sending) return

    hideError()
    textarea.value = ''
    autoResize(textarea)
    btnSend.disabled = true

    await speak(text)

    btnSend.disabled = !textarea.value.trim()
  }

  async function speak(text) {
    const entry = { id: crypto.randomUUID(), text, timestamp: Date.now() }
    transcript.push(entry)
    saveTranscript(transcript)

    appendEntry(entry)
    scrollToBottom()

    sending   = true
    playingId = entry.id
    setSendingUI(true)
    setEntryPlaying(entry.id, true)

    try {
      const apiKey  = getApiKey()
      const voiceId = getVoiceId()
      const buffer  = await textToSpeech(apiKey, voiceId, text)

      // Clone before caching — playBuffer consumes the buffer
      audioCache.set(entry.id, buffer.slice(0))
      await playBuffer(buffer)
    } catch (err) {
      showError(err.message)
    } finally {
      sending   = false
      playingId = null
      setSendingUI(false)
      setEntryPlaying(entry.id, false)
    }
  }

  // ── Favorites ─────────────────────────────────────────────────────────────
  function renderFavorites() {
    favScroll.innerHTML = ''
    favorites.forEach(text => {
      const chip = document.createElement('button')
      chip.className = 'chip'
      chip.textContent = text
      chip.addEventListener('click', () => {
        // Unlock audio on this gesture
        getAudioCtx()
        if (!sending) handleSend(text)
      })
      favScroll.appendChild(chip)
    })
  }

  // ── Transcript ────────────────────────────────────────────────────────────
  function renderTranscript() {
    transcriptEl.innerHTML = ''

    if (transcript.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'transcript-empty'
      empty.innerHTML = `
        <div class="transcript-empty-icon">◎</div>
        <div>
          Your voice is ready.<br>
          Type below or tap a phrase above to speak.
        </div>
      `
      transcriptEl.appendChild(empty)
      return
    }

    transcript.forEach(entry => appendEntry(entry, false))
  }

  function appendEntry(entry, animate = true) {
    // Remove empty state if present
    const empty = transcriptEl.querySelector('.transcript-empty')
    if (empty) empty.remove()

    const div = document.createElement('div')
    div.className = 'transcript-entry'
    div.dataset.id = entry.id
    if (!animate) div.style.animation = 'none'

    div.innerHTML = `
      <div class="entry-text">${esc(entry.text)}</div>
      <div class="entry-actions">
        <div class="entry-time">${esc(fmtTime(entry.timestamp))}</div>
        <button class="btn-replay" title="Replay" data-id="${esc(entry.id)}">${ICON_PLAY}</button>
      </div>
    `

    div.querySelector('.btn-replay').addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id
      if (sending) return
      // Unlock audio synchronously
      getAudioCtx()
      await replayEntry(id)
    })

    transcriptEl.appendChild(div)
  }

  async function replayEntry(id) {
    const entry = transcript.find(e => e.id === id)
    if (!entry) return

    sending   = true
    playingId = id
    setSendingUI(true)
    setEntryPlaying(id, true)

    try {
      let buffer = audioCache.get(id)
      if (!buffer) {
        // Not in cache (page was reloaded) — re-fetch
        buffer = await textToSpeech(getApiKey(), getVoiceId(), entry.text)
        audioCache.set(id, buffer.slice(0))
      }
      await playBuffer(buffer)
    } catch (err) {
      showError(err.message)
    } finally {
      sending   = false
      playingId = null
      setSendingUI(false)
      setEntryPlaying(id, false)
      btnSend.disabled = !textarea.value.trim()
    }
  }

  function setEntryPlaying(id, active) {
    const entryEl = transcriptEl.querySelector(`[data-id="${id}"]`)
    if (!entryEl) return
    entryEl.classList.toggle('playing', active)
    const replay = entryEl.querySelector('.btn-replay')
    if (replay) replay.classList.toggle('playing-now', active)
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      transcriptEl.scrollTop = transcriptEl.scrollHeight
    })
  }

  // ── UI state helpers ──────────────────────────────────────────────────────
  function setSendingUI(active) {
    speakingBar.classList.toggle('hidden', !active)
    btnSend.style.background = active ? 'var(--muted)' : ''
  }

  function showError(msg) {
    errorText.textContent = msg
    errorBanner.classList.remove('hidden')
    setTimeout(() => errorBanner.classList.add('hidden'), 6000)
  }

  function hideError() {
    errorBanner.classList.add('hidden')
  }

  function autoResize(ta) {
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }

  // ── Favorites modal ───────────────────────────────────────────────────────
  function openFavModal() {
    let draft = [...favorites]

    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Edit Favorites</span>
          <button class="btn-icon" id="modal-close">${ICON_CLOSE}</button>
        </div>
        <div class="modal-body" id="fav-list"></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-add-fav">+ Add phrase</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)
    const listEl = overlay.querySelector('#fav-list')

    function renderList() {
      listEl.innerHTML = ''
      draft.forEach((text, idx) => {
        const item = document.createElement('div')
        item.className = 'fav-item'
        item.innerHTML = `
          <input class="fav-input" type="text" value="${esc(text)}" maxlength="100" />
          <button class="btn-remove" data-idx="${idx}" title="Remove">&times;</button>
        `
        item.querySelector('.fav-input').addEventListener('input', e => {
          draft[idx] = e.target.value
        })
        item.querySelector('.btn-remove').addEventListener('click', () => {
          draft.splice(idx, 1)
          renderList()
        })
        listEl.appendChild(item)
      })
    }

    renderList()

    overlay.querySelector('#btn-add-fav').addEventListener('click', () => {
      draft.push('')
      renderList()
      // Focus the new input
      const inputs = listEl.querySelectorAll('.fav-input')
      inputs[inputs.length - 1]?.focus()
    })

    function closeModal(save) {
      if (save) {
        favorites = draft.map(s => s.trim()).filter(Boolean)
        setFavorites(favorites)
        renderFavorites()
      }
      overlay.remove()
    }

    overlay.querySelector('#modal-close').addEventListener('click', () => closeModal(true))
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(true) })
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────
const ICON_SEND = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
  <line x1="12" y1="20" x2="12" y2="4"/>
  <polyline points="5 11 12 4 19 11"/>
</svg>`

const ICON_PLAY = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <polygon points="5 3 19 12 5 21 5 3"/>
</svg>`

const ICON_SETTINGS = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</svg>`

const ICON_EDIT = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
  <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`

const ICON_CLOSE = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>`

const ICON_TRASH = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  <path d="M10 11v6"/>
  <path d="M14 11v6"/>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
</svg>`

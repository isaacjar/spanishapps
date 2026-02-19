import { useState, useEffect, useCallback, useRef } from "react";

const NOTES = [
  { note: "C4", freq: 261.63, key: "a", isBlack: false, label: "C" },
  { note: "C#4", freq: 277.18, key: "w", isBlack: true, label: "C#" },
  { note: "D4", freq: 293.66, key: "s", isBlack: false, label: "D" },
  { note: "D#4", freq: 311.13, key: "e", isBlack: true, label: "D#" },
  { note: "E4", freq: 329.63, key: "d", isBlack: false, label: "E" },
  { note: "F4", freq: 349.23, key: "f", isBlack: false, label: "F" },
  { note: "F#4", freq: 369.99, key: "t", isBlack: true, label: "F#" },
  { note: "G4", freq: 392.0, key: "g", isBlack: false, label: "G" },
  { note: "G#4", freq: 415.3, key: "y", isBlack: true, label: "G#" },
  { note: "A4", freq: 440.0, key: "h", isBlack: false, label: "A" },
  { note: "A#4", freq: 466.16, key: "u", isBlack: true, label: "A#" },
  { note: "B4", freq: 493.88, key: "j", isBlack: false, label: "B" },
  { note: "C5", freq: 523.25, key: "k", isBlack: false, label: "C" },
  { note: "C#5", freq: 554.37, key: "o", isBlack: true, label: "C#" },
  { note: "D5", freq: 587.33, key: "l", isBlack: false, label: "D" },
  { note: "D#5", freq: 622.25, key: "p", isBlack: true, label: "D#" },
  { note: "E5", freq: 659.25, key: ";", isBlack: false, label: "E" },
];

const audioContext = typeof window !== "undefined" ? new (window.AudioContext || window.webkitAudioContext)() : null;
const activeOscillators = {};

function playNote(freq, note) {
  if (!audioContext) return;
  if (activeOscillators[note]) return;
  const osc = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
  osc.start();
  activeOscillators[note] = { osc, gainNode };
}

function stopNote(note) {
  if (!activeOscillators[note]) return;
  const { osc, gainNode } = activeOscillators[note];
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
  osc.stop(audioContext.currentTime + 0.3);
  delete activeOscillators[note];
}

const keyMap = {};
NOTES.forEach((n) => { keyMap[n.key] = n; });

const noteMap = {};
NOTES.forEach((n) => { noteMap[n.note] = n; noteMap[n.label + (n.note.includes("5") ? "5" : "4")] = n; });

// Build a simpler note alias map
const noteAliasMap = {};
NOTES.forEach((n) => {
  noteAliasMap[n.note.toLowerCase()] = n;
  noteAliasMap[n.label.toLowerCase() + (n.note.includes("5") ? "5" : "4")] = n;
});

export default function PianoApp() {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [songInput, setSongInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [sequence, setSequence] = useState([]);
  const [playingSeq, setPlayingSeq] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [activeNote, setActiveNote] = useState(null);
  const seqRef = useRef(null);

  const pressNote = useCallback((noteObj) => {
    if (audioContext.state === "suspended") audioContext.resume();
    playNote(noteObj.freq, noteObj.note);
    setPressedKeys((prev) => new Set([...prev, noteObj.note]));
    setActiveNote(noteObj.note);
  }, []);

  const releaseNote = useCallback((noteObj) => {
    stopNote(noteObj.note);
    setPressedKeys((prev) => {
      const next = new Set(prev);
      next.delete(noteObj.note);
      return next;
    });
  }, []);

  useEffect(() => {
    const down = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (e.repeat) return;
      const n = keyMap[e.key.toLowerCase()];
      if (n) pressNote(n);
    };
    const up = (e) => {
      const n = keyMap[e.key.toLowerCase()];
      if (n) releaseNote(n);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [pressNote, releaseNote]);

  async function analyzeSong() {
    if (!songInput.trim()) return;
    setAnalyzing(true);
    setStatusMsg("Analizando con Claude...");
    setSequence([]);

    const availableNotes = NOTES.map((n) => n.note).join(", ");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Eres un asistente musical. El usuario quiere tocar una canción en un piano. Tienes disponibles estas notas: ${availableNotes}.

El usuario quiere tocar: "${songInput}"

Responde SOLO con un JSON válido (sin markdown, sin explicación) en este formato exacto:
{"notes": [{"note": "C4", "duration": 400}, {"note": "E4", "duration": 400}], "title": "Nombre de la canción"}

Duración en milisegundos. Usa solo notas disponibles. Si no reconoces la canción, intenta crear una melodía simple aproximada con las notas disponibles. Máximo 30 notas.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setSequence(parsed.notes || []);
      setStatusMsg(`🎵 ${parsed.title || songInput} — ${parsed.notes?.length || 0} notas listas`);
    } catch (err) {
      setStatusMsg("Error al analizar. Intenta de nuevo.");
    }
    setAnalyzing(false);
  }

  function playSequence() {
    if (!sequence.length || playingSeq) return;
    setPlayingSeq(true);
    if (audioContext.state === "suspended") audioContext.resume();

    let delay = 0;
    const timeouts = [];
    sequence.forEach((item, i) => {
      const noteObj = NOTES.find((n) => n.note === item.note);
      if (!noteObj) return;
      const dur = item.duration || 400;
      const t1 = setTimeout(() => {
        playNote(noteObj.freq, noteObj.note + "_seq");
        setPressedKeys((prev) => new Set([...prev, noteObj.note]));
        setActiveNote(noteObj.note);
      }, delay);
      const t2 = setTimeout(() => {
        stopNote(noteObj.note + "_seq");
        setPressedKeys((prev) => {
          const next = new Set(prev);
          next.delete(noteObj.note);
          return next;
        });
      }, delay + dur * 0.85);
      timeouts.push(t1, t2);
      delay += dur;
    });

    const done = setTimeout(() => {
      setPlayingSeq(false);
      setPressedKeys(new Set());
    }, delay + 500);
    timeouts.push(done);
    seqRef.current = timeouts;
  }

  function stopSequence() {
    if (seqRef.current) seqRef.current.forEach(clearTimeout);
    Object.keys(activeOscillators).forEach(stopNote);
    setPlayingSeq(false);
    setPressedKeys(new Set());
  }

  // Layout: white keys and black keys positioning
  const whiteKeys = NOTES.filter((n) => !n.isBlack);
  const whiteKeyCount = whiteKeys.length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f3",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      color: "#1a1a1a",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          fontSize: "11px",
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: "#888",
          marginBottom: "8px",
          fontFamily: "'Courier New', monospace",
        }}>Instrumento Virtual</div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: "400",
          margin: 0,
          letterSpacing: "-0.02em",
          color: "#111",
        }}>Piano MIDI</h1>
      </div>

      {/* Piano */}
      <div style={{
        background: "#1a1a1a",
        borderRadius: "12px",
        padding: "24px 20px 32px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.1)",
        marginBottom: "32px",
        position: "relative",
      }}>
        {/* Wood grain top */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "24px",
          background: "linear-gradient(90deg, #2a1f14, #3d2a18, #2a1f14)",
          borderRadius: "12px 12px 0 0",
        }} />
        
        <div style={{ position: "relative", marginTop: "4px" }}>
          {/* Keyboard container */}
          <div style={{ position: "relative", display: "flex", height: "160px" }}>
            {whiteKeys.map((wk, wi) => {
              const isPressed = pressedKeys.has(wk.note);
              return (
                <div
                  key={wk.note}
                  onMouseDown={() => pressNote(wk)}
                  onMouseUp={() => releaseNote(wk)}
                  onMouseLeave={() => releaseNote(wk)}
                  onTouchStart={(e) => { e.preventDefault(); pressNote(wk); }}
                  onTouchEnd={(e) => { e.preventDefault(); releaseNote(wk); }}
                  style={{
                    width: "44px",
                    height: "160px",
                    background: isPressed
                      ? "linear-gradient(180deg, #e0e0e0 0%, #c8c8c8 100%)"
                      : "linear-gradient(180deg, #fefefe 0%, #f0f0f0 100%)",
                    border: "1px solid #bbb",
                    borderRadius: "0 0 6px 6px",
                    cursor: "pointer",
                    position: "relative",
                    boxShadow: isPressed
                      ? "inset 0 2px 4px rgba(0,0,0,0.15), 0 1px 0 #aaa"
                      : "inset 0 -2px 0 #ddd, 0 2px 4px rgba(0,0,0,0.2)",
                    transition: "background 0.05s, box-shadow 0.05s",
                    userSelect: "none",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: "8px",
                    marginRight: "2px",
                    zIndex: 1,
                  }}
                >
                  <div style={{
                    fontSize: "9px",
                    color: "#999",
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: "0.05em",
                    userSelect: "none",
                  }}>
                    {wk.label}
                  </div>
                </div>
              );
            })}

            {/* Black keys overlay */}
            {(() => {
              // Map black keys to position between white keys
              const blackKeyPositions = {
                "C#4": 0, "D#4": 1, "F#4": 3, "G#4": 4, "A#4": 5,
                "C#5": 7, "D#5": 8,
              };
              return NOTES.filter((n) => n.isBlack).map((bk) => {
                const idx = blackKeyPositions[bk.note];
                if (idx === undefined) return null;
                const isPressed = pressedKeys.has(bk.note);
                return (
                  <div
                    key={bk.note}
                    onMouseDown={(e) => { e.stopPropagation(); pressNote(bk); }}
                    onMouseUp={(e) => { e.stopPropagation(); releaseNote(bk); }}
                    onMouseLeave={() => releaseNote(bk)}
                    onTouchStart={(e) => { e.preventDefault(); pressNote(bk); }}
                    onTouchEnd={(e) => { e.preventDefault(); releaseNote(bk); }}
                    style={{
                      position: "absolute",
                      left: `${idx * 46 + 31}px`,
                      top: 0,
                      width: "28px",
                      height: "100px",
                      background: isPressed
                        ? "linear-gradient(180deg, #555 0%, #333 100%)"
                        : "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)",
                      borderRadius: "0 0 4px 4px",
                      cursor: "pointer",
                      zIndex: 10,
                      boxShadow: isPressed
                        ? "inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 #222"
                        : "2px 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 #444",
                      transition: "background 0.05s, box-shadow 0.05s",
                      userSelect: "none",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      paddingBottom: "6px",
                    }}
                  >
                    <div style={{
                      fontSize: "7px",
                      color: "#666",
                      fontFamily: "'Courier New', monospace",
                      userSelect: "none",
                    }}>
                      {bk.key.toUpperCase()}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Keyboard guide */}
      <div style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: "32px",
        padding: "12px 20px",
        background: "#fff",
        borderRadius: "8px",
        border: "1px solid #e8e8e8",
        maxWidth: "500px",
      }}>
        <div style={{ fontSize: "11px", color: "#888", letterSpacing: "0.1em", width: "100%", textAlign: "center", marginBottom: "4px", fontFamily: "'Courier New', monospace", textTransform: "uppercase" }}>
          Teclas del teclado
        </div>
        {NOTES.filter((n) => !n.isBlack).map((n) => (
          <div key={n.note} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              background: pressedKeys.has(n.note) ? "#1a1a1a" : "#f0f0f0",
              color: pressedKeys.has(n.note) ? "#fff" : "#444",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontFamily: "'Courier New', monospace",
              border: "1px solid #ddd",
              transition: "all 0.05s",
            }}>
              {n.key.toUpperCase()}
            </div>
            <div style={{ fontSize: "9px", color: "#999" }}>{n.label}</div>
          </div>
        ))}
      </div>

      {/* Song analyzer */}
      <div style={{
        width: "100%",
        maxWidth: "520px",
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e0e0e0",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", marginBottom: "12px", fontFamily: "'Courier New', monospace" }}>
          Analizador de Canciones
        </div>
        <div style={{ fontSize: "13px", color: "#666", marginBottom: "16px", lineHeight: "1.6" }}>
          Escribe el nombre de una canción y Claude la mapeará a las notas disponibles.
        </div>
        
        <textarea
          value={songInput}
          onChange={(e) => setSongInput(e.target.value)}
          placeholder="Ej: Für Elise, Happy Birthday, Twinkle Twinkle..."
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyzeSong(); } }}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "12px",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: "Georgia, serif",
            color: "#1a1a1a",
            resize: "vertical",
            outline: "none",
            background: "#fafafa",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#aaa"}
          onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
        />

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button
            onClick={analyzeSong}
            disabled={analyzing || !songInput.trim()}
            style={{
              flex: 1,
              padding: "12px",
              background: analyzing || !songInput.trim() ? "#e8e8e8" : "#1a1a1a",
              color: analyzing || !songInput.trim() ? "#aaa" : "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              letterSpacing: "0.1em",
              cursor: analyzing || !songInput.trim() ? "not-allowed" : "pointer",
              fontFamily: "'Courier New', monospace",
              textTransform: "uppercase",
              transition: "all 0.2s",
            }}
          >
            {analyzing ? "Analizando..." : "Analizar"}
          </button>

          {sequence.length > 0 && (
            <>
              <button
                onClick={playingSeq ? stopSequence : playSequence}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: playingSeq ? "#555" : "#333",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  fontFamily: "'Courier New', monospace",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                {playingSeq ? "⏹ Detener" : "▶ Tocar"}
              </button>
            </>
          )}
        </div>

        {statusMsg && (
          <div style={{
            marginTop: "12px",
            padding: "10px 14px",
            background: "#f5f5f3",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#555",
            fontFamily: "'Courier New', monospace",
            borderLeft: "3px solid #1a1a1a",
          }}>
            {statusMsg}
          </div>
        )}

        {sequence.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "11px", color: "#aaa", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px", fontFamily: "'Courier New', monospace" }}>
              Secuencia ({sequence.length} notas)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {sequence.map((item, i) => {
                const noteObj = NOTES.find((n) => n.note === item.note);
                const isActive = activeNote === item.note;
                return (
                  <div
                    key={i}
                    style={{
                      padding: "4px 8px",
                      background: isActive ? "#1a1a1a" : noteObj?.isBlack ? "#333" : "#f0f0f0",
                      color: isActive ? "#fff" : noteObj?.isBlack ? "#ddd" : "#444",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontFamily: "'Courier New', monospace",
                      border: "1px solid",
                      borderColor: isActive ? "#000" : "#ddd",
                      transition: "all 0.1s",
                    }}
                  >
                    {item.note}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "24px", fontSize: "11px", color: "#bbb", fontFamily: "'Courier New', monospace", letterSpacing: "0.1em" }}>
        MIDI PIANO · CLAUDE API
      </div>
    </div>
  );
}
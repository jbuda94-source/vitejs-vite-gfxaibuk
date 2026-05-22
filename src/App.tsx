import { useState } from "react";

const VinylRecord = ({ spinning }) => (
  <div style={{
    width: 110, height: 110, borderRadius: "50%", flexShrink: 0,
    background: "conic-gradient(from 0deg, #111 0deg, #1a1a1a 10deg, #111 20deg, #1a1a1a 30deg, #111 40deg, #1a1a1a 50deg, #111 60deg, #1a1a1a 70deg, #111 80deg, #1a1a1a 90deg, #111 100deg, #1a1a1a 110deg, #111 120deg, #1a1a1a 130deg, #111 140deg, #1a1a1a 150deg, #111 160deg, #1a1a1a 170deg, #111 180deg, #1a1a1a 190deg, #111 200deg, #1a1a1a 210deg, #111 220deg, #1a1a1a 230deg, #111 240deg, #1a1a1a 250deg, #111 260deg, #1a1a1a 270deg, #111 280deg, #1a1a1a 290deg, #111 300deg, #1a1a1a 310deg, #111 320deg, #1a1a1a 330deg, #111 340deg, #1a1a1a 350deg, #111 360deg)",
    boxShadow: "0 0 30px rgba(245,200,66,0.15), inset 0 0 20px rgba(0,0,0,0.8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    animation: spinning ? "spin 3s linear infinite" : "none",
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: "50%",
      background: "radial-gradient(circle, #f5c842 0%, #c9a227 40%, #8a6d0f 100%)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#111" }} />
    </div>
  </div>
);

const ACCENT_COLORS = ["#f5c842", "#e05c5c", "#5ce0a0", "#5cb8e0", "#e05cc4"];

const TrackCard = ({ track, index, visible }) => {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  return (
    <div>
      <div style={{
        display: "flex", gap: 18, alignItems: "center",
        padding: "16px 20px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: 4,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-16px)",
        transition: `opacity 0.4s ease ${index * 0.1}s, transform 0.4s ease ${index * 0.1}s`,
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          fontSize: 26, color: accent, opacity: 0.5, minWidth: 28, lineHeight: 1
        }}>{String(index + 1).padStart(2, "0")}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "monospace", fontSize: 14, color: "#eee", fontWeight: 700, marginBottom: 3 }}>
            {track.title}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#777" }}>{track.artist}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          {track.bpm && (
            <div style={{
              fontFamily: "monospace", fontSize: 10, color: accent,
              background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 2
            }}>{track.bpm} BPM</div>
          )}
          {track.key && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#888" }}>KEY {track.key}</div>}
          {track.year && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555" }}>{track.year}</div>}
        </div>
      </div>
      {track.vibe && (
        <div style={{
          fontSize: 9, color: "#555", letterSpacing: "0.1em", fontFamily: "monospace",
          padding: "4px 20px 10px 20px", textTransform: "uppercase",
          opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${index * 0.1 + 0.3}s`
        }}>↳ {track.vibe}</div>
      )}
    </div>
  );
};

const SYSTEM_PROMPT = `You are a crate digging oracle — a legendary record store expert and DJ with encyclopedic knowledge of music across all eras and genres.

When given a song and artist, use web search to find and verify 5 REAL tracks that actually exist, with similar vibe, energy, BPM range, genre, or sonic aesthetic.

CRITICAL RULES:
- ONLY recommend tracks that 100% verifiably exist. Use web search to confirm each one.
- NEVER invent or hallucinate song titles or artist names. If unsure, search first.
- Never give the same 5 recommendations twice — use the session seed to vary picks.
- Mix well-known and obscure real records. Lean toward obscure but verified.
- Vary the era. Consider BPM proximity, key, emotional vibe.
- Add a short vibe note (max 10 words) explaining why each track fits.

You MUST respond with ONLY a raw JSON object. No markdown. No backticks. No explanation. Just JSON.

Format:
{"picks":[{"title":"Song Title","artist":"Artist Name","bpm":120,"key":"Am","year":"1984","vibe":"Short vibe note"}]}

bpm is a number or null. key and year are optional strings.`;

export default function CrateDigger() {
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(null);
  const [searchLabel, setSearchLabel] = useState("");
  const [status, setStatus] = useState("");

  const digCrates = async () => {
    if (!song.trim() || !artist.trim() || loading) return;
    setLoading(true);
    setResults(null);
    setVisible(false);
    setError(null);
    setSearchLabel(`${song.trim()} — ${artist.trim()}`);
    setStatus("Searching the stacks...");

    try {
      const seed = Math.random().toString(36).slice(2, 8);
      const userPrompt = `Find 5 real, verified tracks similar to "${song.trim()}" by ${artist.trim()}. Use web search to confirm each track exists before recommending it. Seed: ${seed}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search"
            }
          ],
          messages: [{ role: "user", content: userPrompt }]
        })
      });

      const rawText = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${rawText.slice(0, 300)}`);
      }

      let envelope;
      try {
        envelope = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Could not parse API response: ${rawText.slice(0, 200)}`);
      }

      setStatus("Flipping through records...");

      // The model may have done tool use — find the final text block
      const contentBlocks = envelope.content || [];

      // Get all text blocks and join them
      const textContent = contentBlocks
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("")
        .trim();

      if (!textContent) {
        // If stop_reason is tool_use, we need to handle the agentic loop
        // For simplicity, extract any JSON we can find from the raw response
        const jsonMatch = rawText.match(/\{"picks"[\s\S]*?\}\s*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0] + "}");
          setResults(parsed.picks);
          setTimeout(() => setVisible(true), 80);
          setStatus("");
          return;
        }
        throw new Error(`No text returned. Stop reason: ${envelope.stop_reason}. Blocks: ${contentBlocks.map(b=>b.type).join(", ")}`);
      }

      // Strip markdown fences if present
      const cleaned = textContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      // Extract JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`No JSON found in response: ${cleaned.slice(0, 200)}`);
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error(`JSON parse error: ${e.message}`);
      }

      if (!Array.isArray(parsed.picks) || parsed.picks.length === 0) {
        throw new Error(`No picks in response`);
      }

      setResults(parsed.picks);
      setTimeout(() => setVisible(true), 80);
      setStatus("");
    } catch (e) {
      setError(e.message);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#eee", fontFamily: "monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { outline: none; }
        input::placeholder { color: #444; }
      `}</style>

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 52 }}>
          <VinylRecord spinning={loading} />
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              fontSize: 50, letterSpacing: "0.08em", color: "#f5c842", lineHeight: 0.9,
              textShadow: "0 0 40px rgba(245,200,66,0.25)"
            }}>CRATE<br />DIGGER</div>
            <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "#555", marginTop: 7 }}>
              AI-POWERED RABBIT HOLE ENGINE
            </div>
          </div>
        </div>

        {/* Input */}
        <div style={{
          border: "1px solid rgba(245,200,66,0.2)", borderRadius: 4,
          background: "rgba(245,200,66,0.02)", marginBottom: 10, overflow: "hidden"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)"
          }}>
            <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#f5c842", opacity: 0.7, minWidth: 46 }}>TRACK</span>
            <input
              value={song}
              onChange={e => setSong(e.target.value)}
              onKeyDown={e => e.key === "Enter" && digCrates()}
              placeholder="Song title..."
              style={{ flex: 1, background: "transparent", border: "none", color: "#eee", fontSize: 14, fontFamily: "monospace" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px" }}>
            <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#f5c842", opacity: 0.7, minWidth: 46 }}>ARTIST</span>
            <input
              value={artist}
              onChange={e => setArtist(e.target.value)}
              onKeyDown={e => e.key === "Enter" && digCrates()}
              placeholder="Artist name..."
              style={{ flex: 1, background: "transparent", border: "none", color: "#eee", fontSize: 14, fontFamily: "monospace" }}
            />
          </div>
        </div>

        <button
          onClick={digCrates}
          disabled={loading || !song.trim() || !artist.trim()}
          style={{
            width: "100%", padding: "15px",
            background: "rgba(245,200,66,0.1)",
            border: "1px solid rgba(245,200,66,0.35)",
            borderRadius: 4, color: "#f5c842",
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: 17, letterSpacing: "0.2em",
            cursor: loading || !song.trim() || !artist.trim() ? "not-allowed" : "pointer",
            opacity: loading || !song.trim() || !artist.trim() ? 0.45 : 1,
            marginBottom: 16, transition: "opacity 0.2s"
          }}
        >
          {loading ? "⟳  DIGGING..." : "DIG THE CRATES"}
        </button>

        {/* Status */}
        {status && (
          <div style={{
            textAlign: "center", fontSize: 9, color: "#f5c842", opacity: 0.5,
            letterSpacing: "0.2em", marginBottom: 24, animation: "pulse 1.5s ease infinite"
          }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }`}</style>
            {status}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.2)",
            borderRadius: 4, padding: "14px 18px", marginBottom: 24,
            fontSize: 11, color: "#e05c5c", lineHeight: 1.6, wordBreak: "break-all", marginTop: 16
          }}>
            <div style={{ marginBottom: 4, letterSpacing: "0.1em", fontWeight: 700 }}>ERROR</div>
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              marginBottom: 16, fontSize: 9, letterSpacing: "0.15em"
            }}>
              <span style={{ color: "#666" }}>SIMILAR TO: <span style={{ color: "#999" }}>{searchLabel}</span></span>
              <span style={{ color: "#f5c842", opacity: 0.4 }}>{results.length} PICKS</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {results.map((track, i) => (
                <TrackCard key={i} track={track} index={i} visible={visible} />
              ))}
            </div>
            <div style={{ marginTop: 36, textAlign: "center" }}>
              <button onClick={digCrates} style={{
                background: "none", border: "none", color: "#444",
                fontSize: 9, letterSpacing: "0.18em", cursor: "pointer", fontFamily: "monospace"
              }}>
                ↻ DIFFERENT PICKS FOR THE SAME TRACK
              </button>
            </div>
          </div>
        )}

        {!results && !loading && !error && (
          <div style={{ textAlign: "center", marginTop: 70, color: "#2a2a2a", fontSize: 9, letterSpacing: "0.2em", lineHeight: 2.2 }}>
            DROP THE NEEDLE.<br />EVERY SEARCH GOES SOMEWHERE NEW.
          </div>
        )}
      </div>
    </div>
  );
}

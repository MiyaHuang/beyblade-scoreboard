const { useState, useEffect, useRef } = React;



// 戰鬥陀螺 X 官方賽制得分規則
const FINISH_TYPES = [
  { id: "spin", label: "Spin Finish", jp: "スピンフィニッシュ", points: 1, desc: "對手停止旋轉", color: "#3da9fc" },
  { id: "over", label: "Over Finish", jp: "オーバーフィニッシュ", points: 2, desc: "對手彈出戰鬥區", color: "#ff8906" },
  { id: "burst", label: "Burst Finish", jp: "バーストフィニッシュ", points: 2, desc: "對手陀螺爆裂解體", color: "#e53170" },
  { id: "xtreme", label: "Xtreme Finish", jp: "エクストリームフィニッシュ", points: 3, desc: "從衝刺軌道擊出 Over/Burst", color: "#ffd803" },
];

const WIN_SCORE = 4;

const DEFAULT_PLAYERS = [
  { name: "BLADER 1", accent: "#3da9fc" },
  { name: "BLADER 2", accent: "#ff8906" },
];

function BeybladeXScoreboard() {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [scores, setScores] = useState([0, 0]);
  const [log, setLog] = useState([]); // {player, finish, points}
  const [winner, setWinner] = useState(null);
  const [editing, setEditing] = useState(null); // index of player being renamed
  const [flash, setFlash] = useState(null); // {player, finish} for the burst animation

  // 計時器
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const fmtTime = (t) =>
    `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

  const addScore = (playerIdx, finish) => {
    if (winner !== null) return;
    const next = [...scores];
    next[playerIdx] += finish.points;
    setScores(next);
    setLog((l) => [{ player: playerIdx, finish, ts: Date.now() }, ...l]);

    // 觸發爆閃動畫
    setFlash({ player: playerIdx, finish });
    setTimeout(() => setFlash(null), 700);

    if (next[playerIdx] >= WIN_SCORE) {
      setWinner(playerIdx);
      setRunning(false);
    }
  };

  const undo = () => {
    if (log.length === 0) return;
    const [last, ...rest] = log;
    const next = [...scores];
    next[last.player] -= last.finish.points;
    setScores(next);
    setLog(rest);
    if (winner !== null) setWinner(null);
  };

  const resetMatch = () => {
    setScores([0, 0]);
    setLog([]);
    setWinner(null);
    setSeconds(0);
    setRunning(false);
    setFlash(null);
  };

  const renamePlayer = (idx, name) => {
    const next = [...players];
    next[idx] = { ...next[idx], name: name || `BLADER ${idx + 1}` };
    setPlayers(next);
  };

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* 背景裝飾 */}
      <div style={styles.gridOverlay} />
      <div style={styles.glowTop} />

      <div style={styles.container}>
        {/* 標題列 */}
        <header style={styles.header} className="bx-header">
          <div style={styles.logoBlock} className="bx-logoblock">
            <span style={styles.logoX}>X</span>
            <div>
              <h1 style={styles.title}>BEYBLADE X</h1>
              <p style={styles.subtitle}>BATTLE SCOREBOARD ・ 對戰計分板</p>
            </div>
          </div>
          <div style={styles.timerBlock} className="bx-timerblock">
            <div style={styles.timerDisplay} className={running ? "pulse" : ""}>
              {fmtTime(seconds)}
            </div>
            <div style={styles.timerControls} className="bx-timercontrols">
              <button
                style={{ ...styles.timerBtn, ...(running ? styles.timerBtnActive : {}) }}
                onClick={() => setRunning((r) => !r)}
              >
                {running ? "❚❚ 暫停" : "▶ 開始"}
              </button>
              <button style={styles.timerBtn} onClick={() => { setSeconds(0); setRunning(false); }}>
                ↺ 歸零
              </button>
            </div>
          </div>
        </header>

        {/* 計分主區 */}
        <div className="bx-board">
          {players.map((p, idx) => {
            const isWinner = winner === idx;
            const isLoser = winner !== null && winner !== idx;
            const isFlashing = flash?.player === idx;
            return (
              <div
                key={idx}
                style={{
                  ...styles.playerCard,
                  borderColor: p.accent,
                  boxShadow: `0 0 40px ${p.accent}22, inset 0 0 60px ${p.accent}0d`,
                  ...(isWinner ? { boxShadow: `0 0 70px ${p.accent}66, inset 0 0 80px ${p.accent}1a` } : {}),
                  ...(isLoser ? { opacity: 0.45, filter: "grayscale(0.5)" } : {}),
                }}
                className={`bx-card ${isFlashing ? "card-flash" : ""}`}
              >
                {isWinner && (
                  <div style={{ ...styles.winnerBadge, background: p.accent }}>★ WINNER ★</div>
                )}

                {/* 玩家名稱 */}
                <div style={styles.playerNameRow}>
                  {editing === idx ? (
                    <input
                      autoFocus
                      defaultValue={p.name}
                      style={{ ...styles.nameInput, borderColor: p.accent }}
                      onBlur={(e) => { renamePlayer(idx, e.target.value.trim()); setEditing(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                    />
                  ) : (
                    <h2
                      style={{ ...styles.playerName, color: p.accent }}
                      onClick={() => setEditing(idx)}
                      title="點擊修改名稱"
                    >
                      {p.name}
                      <span style={styles.editHint}>✎</span>
                    </h2>
                  )}
                </div>

                {/* 大分數 */}
                <div
                  style={{ ...styles.scoreDisplay, color: p.accent, textShadow: `0 0 30px ${p.accent}88` }}
                  className={`bx-score ${isFlashing ? "score-pop" : ""}`}
                >
                  {scores[idx]}
                </div>
                <div style={styles.scorePips}>
                  {Array.from({ length: WIN_SCORE }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        ...styles.pip,
                        background: i < scores[idx] ? p.accent : "transparent",
                        borderColor: p.accent,
                        boxShadow: i < scores[idx] ? `0 0 12px ${p.accent}` : "none",
                      }}
                    />
                  ))}
                </div>
                <div style={styles.scoreTarget}>目標 {WIN_SCORE} 分</div>

                {/* 得分按鈕 */}
                <div style={styles.finishButtons} className="bx-finish">
                  {FINISH_TYPES.map((f) => (
                    <button
                      key={f.id}
                      style={{
                        ...styles.finishBtn,
                        borderColor: `${f.color}66`,
                        ...(winner !== null ? styles.finishBtnDisabled : {}),
                      }}
                      disabled={winner !== null}
                      onClick={() => addScore(idx, f)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${f.color}1f`;
                        e.currentTarget.style.borderColor = f.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        e.currentTarget.style.borderColor = `${f.color}66`;
                      }}
                    >
                      <span style={{ ...styles.finishPoints, color: f.color }}>+{f.points}</span>
                      <span style={styles.finishLabel}>{f.label}</span>
                      <span style={styles.finishDesc}>{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 中央 VS */}
          <div className="bx-vs">
            <div style={styles.vsText}>VS</div>
          </div>
        </div>

        {/* 控制列 */}
        <div style={styles.controls}>
          <button style={styles.ctrlBtn} onClick={undo} disabled={log.length === 0}>
            ↶ 撤銷上一筆
          </button>
          <button style={{ ...styles.ctrlBtn, ...styles.resetBtn }} onClick={resetMatch}>
            ⟲ 重置對戰
          </button>
        </div>

        {/* 規則 + 紀錄 */}
        <div className="bx-bottom">
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>得分規則</h3>
            <div style={styles.ruleList}>
              {FINISH_TYPES.map((f) => (
                <div key={f.id} style={styles.ruleRow}>
                  <span style={{ ...styles.ruleDot, background: f.color }} />
                  <span style={styles.ruleName}>{f.label}</span>
                  <span style={styles.ruleJp}>{f.jp}</span>
                  <span style={{ ...styles.rulePts, color: f.color }}>{f.points} pt</span>
                </div>
              ))}
            </div>
            <p style={styles.ruleNote}>※ 先取得 {WIN_SCORE} 分者獲勝(官方 First to 4 Points 賽制)</p>
          </div>

          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>對戰紀錄</h3>
            {log.length === 0 ? (
              <p style={styles.logEmpty}>尚無得分紀錄,開始對戰吧!</p>
            ) : (
              <div style={styles.logList}>
                {log.map((entry, i) => (
                  <div key={i} style={styles.logRow}>
                    <span style={{ ...styles.logPlayer, color: players[entry.player].accent }}>
                      {players[entry.player].name}
                    </span>
                    <span style={styles.logFinish}>{entry.finish.label}</span>
                    <span style={{ ...styles.logPts, color: entry.finish.color }}>
                      +{entry.finish.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 爆閃全螢幕特效 */}
      {flash && (
        <div
          style={{ ...styles.flashOverlay, background: `radial-gradient(circle, ${flash.finish.color}33, transparent 70%)` }}
          className="flash-anim"
        >
          <span style={{ ...styles.flashText, color: flash.finish.color, textShadow: `0 0 40px ${flash.finish.color}` }}>
            {flash.finish.label}!
          </span>
        </div>
      )}
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&display=swap');
  * { box-sizing: border-box; }
  .pulse { animation: pulse 1s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
  .card-flash { animation: cardFlash 0.7s ease-out; }
  @keyframes cardFlash { 0%{transform:scale(1)} 25%{transform:scale(1.025)} 100%{transform:scale(1)} }
  .score-pop { animation: scorePop 0.5s cubic-bezier(.18,.89,.32,1.28); }
  @keyframes scorePop { 0%{transform:scale(1)} 40%{transform:scale(1.4)} 100%{transform:scale(1)} }
  .flash-anim { animation: flashAnim 0.7s ease-out forwards; }
  @keyframes flashAnim { 0%{opacity:0;transform:scale(0.8)} 20%{opacity:1} 100%{opacity:0;transform:scale(1.15)} }
  input:focus { outline: none; }
  button { font-family: 'Rajdhani', sans-serif; cursor: pointer; transition: all 0.15s ease; }
  button:disabled { cursor: not-allowed; }

  /* 桌機:左右對戰佈局
     ★ 關鍵:DOM 順序是 卡1→卡2→VS,但版面要 卡1│VS│卡2,
       所以用 grid-column 明確指派欄位,不能依賴自動排列 */
  .bx-board {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 16px;
    align-items: center;
    position: relative;
  }
  .bx-board > .bx-card:nth-of-type(1) { grid-column: 1; }
  .bx-board > .bx-card:nth-of-type(2) { grid-column: 3; }
  .bx-board > .bx-vs { grid-column: 2; grid-row: 1; }

  /* 寬螢幕:整條 board 拉到滿版並相對視窗置中 */
  @media (min-width: 1100px) {
    .bx-board {
      width: 100vw;
      max-width: 1600px;
      left: 50%;
      transform: translateX(-50%);
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      column-gap: 32px;
      padding: 0 32px;
    }
    .bx-board > .bx-card { max-width: 460px; width: 100%; }
    .bx-board > .bx-card:nth-of-type(1) { justify-self: end; }
    .bx-board > .bx-card:nth-of-type(2) { justify-self: start; }
  }
  .bx-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px; }
  .bx-finish { grid-template-columns: 1fr 1fr; }
  .bx-vs { display: flex; align-items: center; justify-content: center; padding: 0 4px; }
  .bx-vs > div { transition: font-size 0.2s ease; }
  @media (min-width: 1100px) {
    .bx-vs > div { font-size: 72px !important; letter-spacing: 6px; }
  }

  /* 平板/手機:改成上下堆疊,VS 橫躺在兩張卡中間 */
  @media (max-width: 760px) {
    .bx-bottom { grid-template-columns: 1fr; }
    .bx-vs { padding: 4px 0; }
    .bx-finish { grid-template-columns: 1fr 1fr; }
    .bx-header { flex-direction: column; align-items: stretch; text-align: center; }
    .bx-header .bx-timerblock { text-align: center; }
    .bx-header .bx-logoblock { justify-content: center; }
    .bx-header .bx-timercontrols { justify-content: center; }
    .bx-score { font-size: 76px !important; }
  }
  @media (max-width: 420px) {
    .bx-finish { grid-template-columns: 1fr; }
  }
`;

const styles = {
  root: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at top, #0d1b3a 0%, #060912 55%, #04060d 100%)",
    fontFamily: "'Rajdhani', sans-serif",
    color: "#e8eefc",
    padding: "24px 16px 48px",
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)",
    backgroundSize: "44px 44px",
    maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
    pointerEvents: "none",
  },
  glowTop: {
    position: "absolute", top: "-200px", left: "50%", transform: "translateX(-50%)",
    width: "700px", height: "400px",
    background: "radial-gradient(circle, #3da9fc33, transparent 70%)",
    filter: "blur(40px)", pointerEvents: "none",
  },
  container: { maxWidth: "1080px", margin: "0 auto", position: "relative", zIndex: 1 },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: "16px", marginBottom: "28px",
  },
  logoBlock: { display: "flex", alignItems: "center", gap: "14px" },
  logoX: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: "52px",
    color: "#fff", lineHeight: 1,
    background: "linear-gradient(135deg, #3da9fc, #ff8906)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    filter: "drop-shadow(0 0 18px #3da9fc66)",
  },
  title: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: "26px",
    margin: 0, letterSpacing: "3px", color: "#fff",
  },
  subtitle: { margin: "2px 0 0", fontSize: "12px", letterSpacing: "2px", color: "#7a8db5", fontWeight: 600 },
  timerBlock: { textAlign: "right" },
  timerDisplay: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "34px",
    color: "#3da9fc", letterSpacing: "2px", textShadow: "0 0 20px #3da9fc55",
  },
  timerControls: { display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "6px" },
  timerBtn: {
    background: "rgba(255,255,255,0.04)", border: "1px solid #2a3a5c", color: "#b8c6e3",
    padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, letterSpacing: "1px",
  },
  timerBtnActive: { background: "#3da9fc1f", borderColor: "#3da9fc", color: "#3da9fc" },
  board: {
    display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "16px",
    alignItems: "stretch", position: "relative",
  },
  playerCard: {
    background: "linear-gradient(180deg, rgba(20,30,55,0.7), rgba(10,15,30,0.7))",
    border: "2px solid", borderRadius: "16px", padding: "24px 20px",
    display: "flex", flexDirection: "column", alignItems: "center",
    backdropFilter: "blur(8px)", position: "relative", transition: "all 0.3s ease",
  },
  winnerBadge: {
    position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
    color: "#04060d", fontWeight: 900, fontSize: "13px", letterSpacing: "2px",
    padding: "5px 18px", borderRadius: "20px", fontFamily: "'Orbitron', sans-serif",
    whiteSpace: "nowrap",
  },
  playerNameRow: { minHeight: "32px", display: "flex", alignItems: "center", marginBottom: "4px" },
  playerName: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "18px",
    margin: 0, letterSpacing: "1px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
  },
  editHint: { fontSize: "13px", opacity: 0.4 },
  nameInput: {
    background: "rgba(0,0,0,0.4)", border: "1px solid", borderRadius: "6px",
    color: "#fff", fontSize: "18px", fontWeight: 700, padding: "4px 10px",
    fontFamily: "'Orbitron', sans-serif", textAlign: "center", width: "180px",
  },
  scoreDisplay: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: "96px",
    lineHeight: 1, margin: "8px 0",
  },
  scorePips: { display: "flex", gap: "8px", marginBottom: "6px" },
  pip: { width: "16px", height: "16px", borderRadius: "50%", border: "2px solid", transition: "all 0.3s ease" },
  scoreTarget: { fontSize: "12px", color: "#6b7a9c", letterSpacing: "1px", marginBottom: "18px" },
  finishButtons: { display: "grid", gap: "10px", width: "100%" },
  finishBtn: {
    background: "rgba(255,255,255,0.02)", border: "1.5px solid", borderRadius: "10px",
    padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
    color: "#e8eefc",
  },
  finishBtnDisabled: { opacity: 0.35 },
  finishPoints: { fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: "20px" },
  finishLabel: { fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px" },
  finishDesc: { fontSize: "11px", color: "#7a8db5", textAlign: "center", lineHeight: 1.2 },
  vsBlock: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" },
  vsText: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: "28px",
    color: "#fff", letterSpacing: "2px",
    background: "linear-gradient(135deg, #3da9fc, #ff8906)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    filter: "drop-shadow(0 0 12px #ffffff33)",
  },
  controls: { display: "flex", gap: "12px", justifyContent: "center", margin: "24px 0" },
  ctrlBtn: {
    background: "rgba(255,255,255,0.04)", border: "1px solid #2a3a5c", color: "#b8c6e3",
    padding: "11px 26px", borderRadius: "8px", fontSize: "15px", fontWeight: 600, letterSpacing: "1px",
  },
  resetBtn: { borderColor: "#e5317055", color: "#e53170" },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" },
  panel: {
    background: "linear-gradient(180deg, rgba(20,30,55,0.5), rgba(10,15,30,0.5))",
    border: "1px solid #1e2a44", borderRadius: "14px", padding: "20px",
  },
  panelTitle: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "15px",
    margin: "0 0 14px", letterSpacing: "1.5px", color: "#9bb0d8",
  },
  ruleList: { display: "flex", flexDirection: "column", gap: "10px" },
  ruleRow: { display: "flex", alignItems: "center", gap: "10px" },
  ruleDot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  ruleName: { fontSize: "15px", fontWeight: 700, minWidth: "110px" },
  ruleJp: { fontSize: "12px", color: "#6b7a9c", flex: 1 },
  rulePts: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "14px" },
  ruleNote: { fontSize: "12px", color: "#6b7a9c", marginTop: "16px", marginBottom: 0, lineHeight: 1.5 },
  logEmpty: { fontSize: "14px", color: "#6b7a9c", textAlign: "center", padding: "20px 0", margin: 0 },
  logList: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" },
  logRow: {
    display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
    background: "rgba(0,0,0,0.25)", borderRadius: "8px",
  },
  logPlayer: { fontWeight: 700, fontSize: "14px", minWidth: "90px" },
  logFinish: { fontSize: "14px", color: "#b8c6e3", flex: 1 },
  logPts: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "15px" },
  flashOverlay: {
    position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
    pointerEvents: "none", zIndex: 100,
  },
  flashText: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: "64px", letterSpacing: "4px",
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(<BeybladeXScoreboard />);

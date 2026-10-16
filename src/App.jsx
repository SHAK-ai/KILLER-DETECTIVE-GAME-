import { useMemo, useState } from 'react';
import { Eye, EyeOff, Shield, Search, Users, Shuffle, ArrowRight, RotateCcw, CheckCircle2, Skull, CircleHelp, Crown, Heart, Plus, Minus, VenetianMask } from 'lucide-react';

const roleInfo = {
  Detective: { icon: Search, color: 'blue', description: 'Watch everyone closely and figure out who the secret blinker is.' },
  'Police Officer': { icon: Shield, color: 'green', description: 'If the blinker winks at you, reveal yourself and catch them!' },
  Civilian: { icon: Users, color: 'purple', description: 'Stay alert. If the blinker winks at you, you are out.' },
};

function shuffledRoles(count) {
  // At three players, omit the police officer so the game still has a civilian to wink at.
  const roles = count === 3
    ? ['Detective', 'Civilian', 'Civilian']
    : ['Detective', 'Police Officer', ...Array(count - 2).fill('Civilian')];
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  const civilians = roles.map((r, i) => r === 'Civilian' ? i : -1).filter(i => i >= 0);
  const blinker = civilians[Math.floor(Math.random() * civilians.length)];
  return { roles, blinker };
}

export default function App() {
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [game, setGame] = useState(null);
  const [step, setStep] = useState('setup');
  const [dealIndex, setDealIndex] = useState(0);
  const [roleVisible, setRoleVisible] = useState(false);
  const [alive, setAlive] = useState([true, true, true, true]);
  const [log, setLog] = useState([]);
  const [notice, setNotice] = useState('');
  const [suspect, setSuspect] = useState('');
  const [winner, setWinner] = useState('');
  const [showAllRoles, setShowAllRoles] = useState(false);

  const cleanNames = useMemo(() => names.map((n, i) => n.trim() || `Player ${i + 1}`), [names]);

  const addPlayer = () => {
    if (names.length < 20) setNames(prev => [...prev, `Player ${prev.length + 1}`]);
  };
  const removePlayer = () => {
    if (names.length > 3) setNames(prev => prev.slice(0, -1));
  };

  const startGame = () => {
    const roster = cleanNames;
    const newGame = shuffledRoles(roster.length);
    setNames(roster);
    setGame(newGame);
    setAlive(roster.map(() => true));
    setLog([]);
    setNotice('');
    setSuspect('');
    setWinner('');
    setDealIndex(0);
    setRoleVisible(false);
    setShowAllRoles(false);
    setStep('deal');
  };

  const restart = () => {
    setGame(null);
    setStep('setup');
    setNotice('');
    setSuspect('');
    setWinner('');
  };

  const currentRole = game ? game.roles[dealIndex] : '';
  const isBlinker = game && dealIndex === game.blinker;

  const nextDeal = () => {
    setRoleVisible(false);
    if (dealIndex < names.length - 1) setDealIndex(dealIndex + 1);
    else {
      setStep('playing');
      setNotice('All roles are dealt. Put the phone down and start watching for a wink!');
    }
  };

  const resolveWink = (targetIndex) => {
    if (!game || !alive[targetIndex]) return;
    if (targetIndex === game.blinker) {
      setNotice('Choose the person who received the wink—not the person who winked.');
      return;
    }
    const targetRole = game.roles[targetIndex];
    if (targetRole === 'Civilian') {
      const updated = alive.map((v, i) => i === targetIndex ? false : v);
      setAlive(updated);
      setLog(prev => [`${names[targetIndex]} was winked at and is out.`, ...prev]);
      const remainingCivilians = updated.filter((isAlive, i) => isAlive && game.roles[i] === 'Civilian' && i !== game.blinker).length;
      if (remainingCivilians === 0) {
        setNotice(`${names[game.blinker]} survived as the blinker!`);
        setWinner('Blinker');
        setStep('over');
      } else {
        setNotice(`${names[targetIndex]} is out. Keep watching for the blinker.`);
      }
    } else {
      setLog(prev => [`${names[targetIndex]} received the wink. The blinker was caught!`, ...prev]);
      setNotice(`Caught! ${names[game.blinker]} was the blinker.`);
      setWinner('Detective and Police');
      setStep('over');
    }
  };

  const makeGuess = () => {
    if (!suspect || !game) return;
    const guessed = Number(suspect);
    if (guessed === game.blinker) {
      setNotice(`Correct! ${names[guessed]} was the blinker.`);
      setWinner('Detective and Police');
      setStep('over');
    } else {
      setLog(prev => [`The group accused ${names[guessed]}, but that was the wrong guess.`, ...prev]);
      setNotice(`Not quite! ${names[guessed]} is not the blinker. Keep playing.`);
      setSuspect('');
    }
  };

  const aliveCount = alive.filter(Boolean).length;

  return (
    <div className="app-shell">
      <header className="topbar" >
        <button className="brand" onClick={restart} aria-label="Back to setup">
          <span className="brand-icon"><Eye size={22} /></span>
          <span>KILLER <i>DETECTIVE</i> GAME <i>BY</i> SHAK</span>
        </button>
        
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><VenetianMask size={16} /> A CLASSIC GAME NIGHT</div>
            <h1>Keep a straight face.<br /><span>Catch the blinker.</span></h1>
            <p>One secret role. A room full of suspicious friends. Can your group spot the killer before everyone is out?</p>
            <div className="role-summary">
              <div><Search size={18}/><b>1</b><span>Detective</span></div>
              <div><Shield size={18}/><b>{names.length >= 4 ? '1' : '0'}</b><span>Police officer{names.length < 4 ? ' (3-player game skips this role)' : ''}</span></div>
              <div><Users size={18}/><b>{names.length - (names.length >= 4 ? 2 : 1)}</b><span>Civilians</span></div>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="playing-card card-one"><span>♠</span><b>K</b><small>DETECTIVE</small></div>
            <div className="playing-card card-two"><span>♥</span><b>?</b><small>SECRET</small></div>
            <div className="table-stamp">WHO<br/>DID IT?</div>
            <span className="spark spark-a">✦</span><span className="spark spark-b">✧</span>
          </div>
        </section>

        <section className="game-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">GAME NIGHT</div>
              <h2>{step === 'setup' ? 'Who’s playing?' : step === 'deal' ? 'Secret role cards' : step === 'playing' ? 'Let the game begin!' : 'Case closed!'}</h2>
            </div>
            {step !== 'setup' && <span className="round-badge"><span className="live-dot" /> {step === 'over' ? 'ROUND OVER' : step === 'deal' ? `PLAYER ${dealIndex + 1} OF ${names.length}` : 'IN PLAY'}</span>}
          </div>

          {step === 'setup' && <div className="setup-content">
            <p className="muted">Add everyone playing, write their names, then pass the phone around to reveal each secret role.</p>
            <div className="roster-heading">
              <span className="section-label">PLAYER ROSTER</span>
              <span className="count-label">{names.length} / 20 players</span>
            </div>
            <div className="name-grid">
              {names.map((name, i) => <label className="name-field" key={i}>
                <span className="player-number">{String(i + 1).padStart(2, '0')}</span>
                <span className="field-label">PLAYER {i + 1}</span>
                <input value={name} maxLength={24} onChange={e => setNames(prev => prev.map((n, j) => i === j ? e.target.value : n))} placeholder={`Player ${i + 1}`} />
              </label>)}
            </div>
            <div className="roster-actions">
              <button className="secondary-btn" onClick={removePlayer} disabled={names.length <= 3}><Minus size={17}/> Remove last player</button>
              <button className="secondary-btn" onClick={addPlayer} disabled={names.length >= 20}><Plus size={17}/> Add a player</button>
            </div>
            <div className="rules-note"><CircleHelp size={20}/><p><b>How to play</b><br/>One civilian is secretly the blinker. They wink at another civilian to send them out. If they wink at the detective or police officer, they are caught. With 3 players, the police role is skipped so the game still works.</p></div>
            <button className="primary-btn" onClick={startGame}>Shuffle roles & start <Shuffle size={19}/></button>
            <p className="tiny-note">You can play with 3 to 20 people. Make sure names are easy to recognize.</p>
          </div>}

          {step === 'deal' && game && <div className="deal-content">
            <div className="deal-progress">{names.map((n, i) => <div key={n + i} className={`progress-person ${i < dealIndex ? 'done' : i === dealIndex ? 'active' : ''}`}><span>{i < dealIndex ? '✓' : i + 1}</span><small>{n}</small></div>)}</div>
            <div className="pass-instruction"><Eye size={22}/><div><b>Pass the phone to {names[dealIndex]}</b><span>Everyone else, look away!</span></div></div>
            <div className={`secret-card ${roleVisible ? 'revealed' : ''}`}>
              {!roleVisible ? <>
                <div className="secret-symbol"><EyeOff size={38}/></div>
                <h3>Your role is secret</h3><p>Make sure nobody else can see the screen.</p>
                <button className="primary-btn" onClick={() => setRoleVisible(true)}>Reveal my role <Eye size={18}/></button>
              </> : <>
                {(() => { const RoleIcon = roleInfo[currentRole].icon; return <div className={`role-icon ${roleInfo[currentRole].color}`}><RoleIcon size={34}/></div>; })()}
                <span className="field-label">YOUR SECRET ROLE</span><h3>{currentRole}</h3>
                {isBlinker ? <div className="secret-alert"><Skull size={19}/><span><b>You are the BLINKER!</b><br/>Keep it secret. Wink at a civilian without being noticed.</span></div> : <p>{roleInfo[currentRole].description}</p>}
                <button className="primary-btn" onClick={nextDeal}>{dealIndex < names.length - 1 ? `Hide & pass to ${names[dealIndex + 1]}` : 'Finish role dealing'} <ArrowRight size={18}/></button>
              </>}
            </div>
          </div>}

          {step === 'playing' && game && <div className="playing-content">
            <div className="status-strip"><div><span className="status-number">{aliveCount}</span><span>players still in</span></div><div><span className="status-number">{names.length - aliveCount}</span><span>players out</span></div><div><span className="status-number">{log.length}</span><span>game events</span></div></div>
            {notice && <div className="notice"><AlertTriangleIcon/><span>{notice}</span></div>}
            <div className="section-label">DID YOU SEE A WINK?</div>
            <p className="muted">Tap the name of the person who received the wink. Only report a wink you actually saw.</p>
            <div className="player-list">
              {names.map((n, i) => <div key={n + i} className={`player-row ${!alive[i] ? 'eliminated' : ''}`}>
                <div className="avatar">{n.trim().charAt(0).toUpperCase() || i + 1}</div><div className="player-details"><b>{n}</b><span>{alive[i] ? 'Still in the game' : 'Out of the game'}</span></div>
                {alive[i] ? <button className="small-btn" onClick={() => resolveWink(i)}>Received a wink</button> : <span className="out-label">OUT</span>}
              </div>)}
            </div>
            <div className="guess-box"><div><Search size={20}/><div><b>Think you know who it is?</b><span>Make an accusation</span></div></div><select value={suspect} onChange={e => setSuspect(e.target.value)}><option value="">Choose a suspect…</option>{names.map((n, i) => alive[i] ? <option value={i} key={i}>{n}</option> : null)}</select><button className="secondary-btn" disabled={suspect === ''} onClick={makeGuess}>Accuse</button></div>
            {log.length > 0 && <div className="event-log"><div className="section-label">GAME NOTES</div>{log.map((item, i) => <div className="event" key={i}><span>•</span>{item}</div>)}</div>}
            <button className="text-btn" onClick={() => setShowAllRoles(v => !v)}>{showAllRoles ? 'Hide role reveal' : 'Host: reveal all roles'}</button>
            {showAllRoles && <div className="all-roles">{names.map((n, i) => <div key={i}><b>{n}</b><span>{game.roles[i]}{i === game.blinker ? ' · BLINKER' : ''}</span></div>)}</div>}
          </div>}

          {step === 'over' && game && <div className="result-content">
            <div className="result-icon"><Crown size={40}/></div>
            <span className="eyebrow">THE MYSTERY IS SOLVED</span>
            <h3>{winner === 'Blinker' ? 'The blinker wins!' : 'The blinker was caught!'}</h3>
            <p>{winner === 'Blinker' ? 'All other civilians are out. The blinker got away with it!' : 'Good teamwork. The group found the secret blinker.'}</p>
            <div className="reveal-roles">{names.map((n, i) => { const RoleIcon = roleInfo[game.roles[i]].icon; return <div className="reveal-row" key={i}><div className={`role-icon small ${roleInfo[game.roles[i]].color}`}><RoleIcon size={18}/></div><b>{n}</b><span>{game.roles[i]}{i === game.blinker ? ' · BLINKER' : ''}</span></div>; })}</div>
            {notice && <div className="notice"><CheckCircle2 size={18}/><span>{notice}</span></div>}
            <button className="primary-btn" onClick={startGame}>Play another round <RotateCcw size={18}/></button>
            <button className="text-btn" onClick={restart}>Change players</button>
          </div>}
        </section>

        <section className="how-to">
          <div className="eyebrow">THE RULES ARE SIMPLE</div><h2>Three steps. One sneaky blinker.</h2>
          <div className="rules-grid">
            <div className="rule-card"><span className="rule-number">01</span><Eye size={25}/><h3>Pass the phone</h3><p>Everyone sees only their own secret role. Keep your card hidden.</p></div>
            <div className="rule-card"><span className="rule-number">02</span><Heart size={25}/><h3>Watch for a wink</h3><p>The blinker secretly winks at another civilian. That player is out.</p></div>
            <div className="rule-card"><span className="rule-number">03</span><Shield size={25}/><h3>Solve the mystery</h3><p>Catch the blinker by spotting a wink or making the right accusation.</p></div>
          </div>
        </section>
      </main>
      <footer><span>KILLER <i>DETECTIVE</i> GAME</span><span>Made for game night · 3–20 players</span></footer>
    </div>
  );
}

function AlertTriangleIcon() {
  return <CircleHelp size={19} />;
}

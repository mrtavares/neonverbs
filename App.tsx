import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Zap, Trophy, Heart, Brain, ArrowRight, Sparkles, X, CheckCircle } from 'lucide-react';
import { GameState, Verb, GameStats } from './types';
import { VERB_LIST, MAX_LIVES } from './constants';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';

const TIME_PER_ROUND = 30; // Seconds

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentVerb, setCurrentVerb] = useState<Verb | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Inputs
  const [pastInput, setPastInput] = useState('');
  const [participleInput, setParticipleInput] = useState('');
  
  // Game Logic
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
  const [lives, setLives] = useState(MAX_LIVES);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctAnswers: 0,
    mistakes: 0,
  });

  // UX State
  const [feedback, setFeedback] = useState<'none' | 'success' | 'error'>('none');
  
  // Refs for focusing inputs
  const pastInputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);

  const prepareRound = useCallback(() => {
    setPastInput('');
    setParticipleInput('');
    setFeedback('none');
    setTimeLeft(TIME_PER_ROUND);
    
    // Focus first input
    setTimeout(() => {
      if (pastInputRef.current) pastInputRef.current.focus();
    }, 100);
  }, []);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setStats({ score: 0, streak: 0, bestStreak: 0, correctAnswers: 0, mistakes: 0 });
    setLives(MAX_LIVES);
    setCurrentIndex(0);
    setCurrentVerb(VERB_LIST[0]);
    prepareRound();
  };

  const handleGameOver = useCallback(() => {
    setGameState(GameState.GAMEOVER);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const nextRound = useCallback(() => {
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= VERB_LIST.length) {
      handleGameOver();
      return;
    }

    setCurrentIndex(nextIndex);
    setCurrentVerb(VERB_LIST[nextIndex]);
    prepareRound();
  }, [currentIndex, handleGameOver, prepareRound]);

  const handleAbort = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState(GameState.MENU);
  }

  // Timer Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING && timeLeft > 0 && feedback !== 'success') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCheck(true); // Force check on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && gameState === GameState.PLAYING) {
       // Timeout handled inside interval logic usually
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, timeLeft, feedback]);

  const normalize = (str: string) => str.trim().toLowerCase();

  const handleCheck = async (isTimeout = false) => {
    if (!currentVerb || feedback !== 'none') return;
    if (timerRef.current) clearInterval(timerRef.current);

    const pSimple = normalize(pastInput);
    const pParticiple = normalize(participleInput);
    
    // Allow for "was/were" variations if user types just one
    const targetPast = normalize(currentVerb.pastSimple);
    const targetParticiple = normalize(currentVerb.pastParticiple);
    
    const isPastCorrect = targetPast.includes('/') 
      ? targetPast.split('/').includes(pSimple)
      : pSimple === targetPast;

    const isParticipleCorrect = pParticiple === targetParticiple;
    
    const isCorrect = isPastCorrect && isParticipleCorrect && !isTimeout;

    if (isCorrect) {
      // SUCCESS
      setFeedback('success');
      const timeBonus = Math.floor(timeLeft * 10);
      const streakMultiplier = 1 + (stats.streak * 0.1);
      const points = Math.floor((100 + timeBonus) * streakMultiplier);

      const newStreak = stats.streak + 1;
      setStats(prev => ({
        ...prev,
        score: prev.score + points,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        correctAnswers: prev.correctAnswers + 1
      }));
      
      // Auto focus next button
      setTimeout(() => {
        if (nextButtonRef.current) nextButtonRef.current.focus();
      }, 50);

    } else {
      // FAILURE
      setFeedback('error');
      const newLives = lives - 1;
      setLives(newLives);
      setStats(prev => ({
        ...prev,
        streak: 0,
        mistakes: prev.mistakes + 1
      }));

      if (newLives <= 0) {
        setTimeout(handleGameOver, 3000);
      } else {
         // Auto focus next button
        setTimeout(() => {
            if (nextButtonRef.current) nextButtonRef.current.focus();
        }, 50);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'past' | 'participle') => {
    if (e.key === 'Enter') {
      if (field === 'past') {
        // Move to next input
        const nextInput = document.getElementById('participle-input');
        if (nextInput) (nextInput as HTMLInputElement).focus();
      } else {
        handleCheck();
      }
    }
  };

  // --- RENDER HELPERS ---

  const renderFeedbackContent = () => {
    if (feedback === 'success' && currentVerb) {
      return (
        <div className="flex flex-col gap-4 w-full">
           <div className="flex items-center gap-2 mb-1">
             <div className="p-1 rounded bg-neon-green/20 text-neon-green"><Sparkles className="w-5 h-5"/></div>
             <span className="text-neon-green font-bold uppercase tracking-wider text-sm">Context Data Loaded</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-black/30 p-3 rounded border border-neon-blue/30">
                <div className="text-neon-blue text-xs uppercase font-bold mb-1 tracking-widest">Past Simple</div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {currentVerb.pastExample.split('*').map((part, i) => 
                    i % 2 === 1 ? <span key={i} className="text-white font-bold">{part}</span> : part
                  )}
                </p>
             </div>
             <div className="bg-black/30 p-3 rounded border border-neon-pink/30">
                <div className="text-neon-pink text-xs uppercase font-bold mb-1 tracking-widest">Present Perfect</div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {currentVerb.perfectExample.split('*').map((part, i) => 
                    i % 2 === 1 ? <span key={i} className="text-white font-bold">{part}</span> : part
                  )}
                </p>
             </div>
           </div>
        </div>
      );
    }

    if (feedback === 'error' && currentVerb) {
       return (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 mb-1">
             <div className="p-1 rounded bg-red-500/20 text-red-500"><Brain className="w-5 h-5"/></div>
             <span className="text-red-500 font-bold uppercase tracking-wider text-sm">Correction Protocol</span>
           </div>
           <div className="bg-red-900/10 p-4 rounded border border-red-500/30 text-center">
             <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest">Correct Forms</p>
             <p className="text-2xl font-display font-bold text-white">
               <span className="text-neon-blue">{currentVerb.pastSimple}</span>
               <span className="mx-3 text-gray-600">/</span>
               <span className="text-neon-purple">{currentVerb.pastParticiple}</span>
             </p>
           </div>
        </div>
       );
    }
    return null;
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
      <div className="relative">
        <div className="absolute -inset-4 bg-neon-purple opacity-20 blur-xl rounded-full animate-pulse-fast"></div>
        <h1 className="relative text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-pink drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] font-display tracking-tighter">
          NEON<br/>VERBS
        </h1>
      </div>
      <p className="text-xl md:text-2xl text-gray-400 max-w-md font-light">
        Master irregular verbs in the <span className="text-neon-blue font-bold">Cyber-Grid</span>. Sequence Mode Engaged.
      </p>
      <Button onClick={startGame} size="lg" className="w-64">
        <Play className="w-6 h-6" /> INITIALIZE RUN
      </Button>
      <div className="flex gap-8 mt-8 text-sm text-gray-500 uppercase tracking-widest font-display">
        <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-neon-blue"/> {VERB_LIST.length} Verb Sequence</div>
        <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-neon-pink"/> Instant Feedback</div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="w-full max-w-2xl mx-auto px-4 relative pt-6">
      {/* Top Bar */}
      <div className="flex justify-between items-start mb-6">
         <button 
           onClick={handleAbort}
           className="text-gray-500 hover:text-red-500 transition-colors p-2 -ml-2 rounded-full hover:bg-white/5"
           title="Abort Run"
         >
           <X className="w-6 h-6" />
         </button>
         
         <div className="bg-white/5 px-3 py-1 rounded-full text-xs font-display tracking-widest text-gray-400 border border-white/10">
           VERB {currentIndex + 1} / {VERB_LIST.length}
         </div>
      </div>

      {/* Header Stats */}
      <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Score</span>
          <span className="text-4xl font-display font-bold text-white">{stats.score.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
           <span className="text-xs text-gray-500 uppercase tracking-widest">Streak</span>
           <div className="flex items-center gap-2">
            <span className={`text-3xl font-display font-bold ${stats.streak >= 5 ? 'text-neon-pink animate-pulse' : 'text-gray-300'}`}>
              x{stats.streak}
            </span>
            {stats.streak >= 5 && <Zap className="w-5 h-5 text-neon-pink" />}
           </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-500 uppercase tracking-widest">System Integrity</span>
          <div className="flex gap-1">
            {[...Array(MAX_LIVES)].map((_, i) => (
              <Heart 
                key={i} 
                className={`w-6 h-6 transition-colors duration-300 ${i < lives ? 'text-red-500 fill-red-500 shadow-red-500/50 drop-shadow-lg' : 'text-gray-800'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="mb-8">
        <ProgressBar value={timeLeft} max={TIME_PER_ROUND} label="Time Remaining" color={timeLeft < 5 ? "bg-red-500" : "bg-neon-blue"} />
      </div>

      {/* Main Card */}
      <div className={`
        relative bg-neon-card border border-gray-800 p-8 md:p-12 rounded-2xl shadow-2xl overflow-hidden
        ${feedback === 'error' ? 'animate-shake border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : ''}
        ${feedback === 'success' ? 'border-neon-green shadow-[0_0_30px_rgba(10,255,0,0.3)]' : ''}
        transition-all duration-300
      `}>
        {/* Background Elements */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain className="w-32 h-32" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="text-center">
            <h3 className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-2">Current Verb</h3>
            <h2 className="text-6xl md:text-7xl font-display font-black text-white tracking-wide">
              {currentVerb?.infinitive.toUpperCase()}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-neon-blue font-bold ml-1">Past Simple</label>
              <input
                ref={pastInputRef}
                type="text"
                value={pastInput}
                onChange={(e) => setPastInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'past')}
                disabled={feedback !== 'none'}
                autoComplete="off"
                className={`
                  w-full bg-black/50 border-2 rounded-lg px-4 py-4 text-2xl font-display text-center focus:outline-none focus:ring-0
                  ${feedback === 'error' && !normalize(currentVerb?.pastSimple || '').includes(normalize(pastInput)) ? 'border-red-500 text-red-500' : 'border-gray-700 focus:border-neon-blue text-white'}
                  ${feedback === 'success' ? 'border-neon-green text-neon-green' : ''}
                `}
                placeholder="..."
              />
              {feedback === 'error' && (
                 <div className="text-xs text-red-400 text-center uppercase tracking-wider">Incorrect</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-neon-purple font-bold ml-1">Past Participle</label>
              <input
                id="participle-input"
                type="text"
                value={participleInput}
                onChange={(e) => setParticipleInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'participle')}
                disabled={feedback !== 'none'}
                autoComplete="off"
                className={`
                  w-full bg-black/50 border-2 rounded-lg px-4 py-4 text-2xl font-display text-center focus:outline-none focus:ring-0
                  ${feedback === 'error' && normalize(participleInput) !== normalize(currentVerb?.pastParticiple || '') ? 'border-red-500 text-red-500' : 'border-gray-700 focus:border-neon-purple text-white'}
                   ${feedback === 'success' ? 'border-neon-green text-neon-green' : ''}
                `}
                placeholder="..."
              />
               {feedback === 'error' && (
                 <div className="text-xs text-red-400 text-center uppercase tracking-wider">Incorrect</div>
              )}
            </div>
          </div>
          
          {/* Action Button */}
          <div className="mt-8 flex justify-center w-full">
             {feedback === 'none' ? (
               <Button onClick={() => handleCheck()} size="md" className="w-full md:w-auto min-w-[200px]">
                 SUBMIT <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
             ) : (
                lives > 0 && (
                  <button
                    ref={nextButtonRef}
                    onClick={nextRound}
                    className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-neon-blue/20 border-2 border-neon-blue rounded-lg hover:bg-neon-blue hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-blue"
                  >
                    <span className="mr-2">{currentIndex >= VERB_LIST.length - 1 ? 'FINISH' : 'NEXT CHALLENGE'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                )
             )}
          </div>
        </div>
      </div>

      {/* Static Feedback Section */}
      <div className={`mt-6 min-h-[140px] transition-all duration-500 ${feedback !== 'none' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className={`
             rounded-xl p-6 border flex items-start gap-4 relative overflow-hidden bg-neon-card
             ${feedback === 'error' ? 'border-red-500/30' : 'border-neon-blue/30'}
        `}>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white to-transparent opacity-20"></div>
          {renderFeedbackContent()}
        </div>
      </div>
    </div>
  );

  const renderGameOver = () => {
    const isVictory = lives > 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
        {isVictory ? (
          <CheckCircle className="w-24 h-24 text-neon-green drop-shadow-[0_0_15px_rgba(0,255,0,0.5)] mb-4" />
        ) : (
          <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] mb-4" />
        )}
        
        <h2 className="text-5xl md:text-7xl font-black font-display text-white">
          {isVictory ? 'MISSION COMPLETE' : 'SYSTEM FAILURE'}
        </h2>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8">
          <div className="bg-neon-card p-6 rounded-xl border border-gray-800">
            <div className="text-gray-400 text-sm uppercase tracking-widest mb-2">Final Score</div>
            <div className="text-4xl font-bold text-neon-blue font-display">{stats.score}</div>
          </div>
          <div className="bg-neon-card p-6 rounded-xl border border-gray-800">
            <div className="text-gray-400 text-sm uppercase tracking-widest mb-2">Verbs Mastered</div>
            <div className="text-4xl font-bold text-neon-pink font-display">
              {stats.correctAnswers} / {VERB_LIST.length}
            </div>
          </div>
          <div className="bg-neon-card p-6 rounded-xl border border-gray-800">
            <div className="text-gray-400 text-sm uppercase tracking-widest mb-2">Longest Streak</div>
            <div className="text-4xl font-bold text-green-400 font-display">{stats.bestStreak}</div>
          </div>
          <div className="bg-neon-card p-6 rounded-xl border border-gray-800">
            <div className="text-gray-400 text-sm uppercase tracking-widest mb-2">Accuracy</div>
            <div className="text-4xl font-bold text-white font-display">
              {stats.correctAnswers + stats.mistakes > 0 
                ? Math.round((stats.correctAnswers / (stats.correctAnswers + stats.mistakes)) * 100) 
                : 0}%
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button onClick={startGame} size="lg">
            <RotateCcw className="w-5 h-5" /> REBOOT SYSTEM
          </Button>
          <Button onClick={() => setGameState(GameState.MENU)} variant="secondary" size="lg">
            MAIN MENU
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple rounded-full blur-[120px] opacity-10"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue rounded-full blur-[120px] opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {gameState === GameState.MENU && renderMenu()}
        {gameState === GameState.PLAYING && renderGame()}
        {gameState === GameState.GAMEOVER && renderGameOver()}
      </div>
    </div>
  );
}

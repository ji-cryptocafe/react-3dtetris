import { useEffect, useState } from 'react';
import { useGameStore, TUTORIAL_STEPS, type TutorialPosition } from '../store/gameStore';

const TutorialOverlay = () => {
  const { isTutorial, tutorialStep, nextTutorialStep, skipTutorial } = useGameStore(state => ({
    isTutorial: state.isTutorial,
    tutorialStep: state.tutorialStep,
    nextTutorialStep: state.nextTutorialStep,
    skipTutorial: state.skipTutorial
  }));

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  }, [tutorialStep]);

  if (!isTutorial) return null;

  const currentStep = TUTORIAL_STEPS[tutorialStep] || TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1];

  // --- DYNAMIC POSITIONING LOGIC ---
  const getPositionStyle = (pos: TutorialPosition): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', transition: 'all 0.5s ease-in-out' };
    
    switch (pos) {
      case 'top-right':
        return { ...base, top: '100px', right: '160px', transform: 'translateX(0)' };
      case 'top-left':
        return { ...base, top: '100px', left: '160px', transform: 'translateX(0)' };
      case 'bottom-left':
        return { ...base, bottom: '100px', left: '200px', transform: 'translateX(0)' };
      case 'center':
      default:
        return { ...base, top: '20%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  // Parse markdown-style bolding (**text**)
  const renderText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, i) => 
      i % 2 === 1 ? <span key={i} style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>{part}</span> : part
    );
  };

  return (
    <div 
      style={{
        ...getPositionStyle(currentStep.position),
        width: '450px',
        zIndex: 200,
        pointerEvents: 'none' // Allow play through, but enable button pointer events below
      }}
    >
      {/* CARD CONTAINER */}
      <div style={{
        backgroundColor: 'rgba(10, 20, 35, 0.75)', // Darker, sleeker background
        border: '1px solid rgba(0, 255, 255, 0.3)',
        borderRadius: '15px',
        padding: '20px',
        color: '#e0e0e0',
        textAlign: 'center',
        boxShadow: `0 0 25px rgba(0, 255, 255, 0.15), inset 0 0 20px rgba(0, 0, 0, 0.2)`,
        backdropFilter: 'blur(3px)',
        transform: animate ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.2s ease-out',
        position: 'relative'
      }}>
        
        {/* NEON LINE ACCENT */}
        <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
            background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
            boxShadow: '0 0 10px #00ffff'
        }} />

        {/* HEADER */}
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#88aaff', 
          textTransform: 'uppercase', 
          letterSpacing: '3px',
          fontSize: '0.9rem',
          opacity: 0.8
        }}>
          TRAINING MODULE {tutorialStep + 1}/{TUTORIAL_STEPS.length}
        </h3>
        
        {/* BODY TEXT */}
        <p style={{ 
          fontSize: '1.2rem', 
          margin: '0 0 20px 0',
          lineHeight: 1.5,
          fontFamily: '"Segoe UI", sans-serif', 
        }}>
          {renderText(currentStep.text)}
        </p>

        {/* BUTTONS */}
        <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'center', gap: '15px' }}>
          
          {/* Show "Continue" button ONLY if the action is 'next' */}
          {currentStep.action === 'next' && (
            <button
              onClick={nextTutorialStep}
              style={{
                backgroundColor: 'rgba(0, 255, 255, 0.2)',
                border: '1px solid #00ffff',
                color: '#fff',
                padding: '8px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.4)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.2)'}
            >
              Continue
            </button>
          )}

          <button 
            onClick={skipTutorial}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              textDecoration: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              marginTop: currentStep.action === 'next' ? '8px' : '0'
            }}
          >
            End Tutorial
          </button>
        </div>
      </div>
      
      {/* CONNECTION LINE (Visual Flair) 
      {(currentStep.position !== 'center') && (
        <div style={{
            position: 'absolute',
            width: '2px',
            height: '40px',
            backgroundColor: '#00ffff',
            opacity: 0.5,
            top: currentStep.position.includes('bottom') ? '100%' : 'auto',
            bottom: currentStep.position.includes('top') ? '100%' : 'auto',
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 10px #00ffff'
        }} />
      )}*/}
    </div>
  );
};

export default TutorialOverlay;
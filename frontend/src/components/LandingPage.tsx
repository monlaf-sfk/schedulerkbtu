import React from 'react';
import kbtuLogo from '../assets/kbtu-logo.svg';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 via-gray-950 to-black flex flex-col items-center justify-center">


      <div className="w-full mx-auto flex flex-col items-center justify-center flex-1 max-w-[92vw] md:max-w-3xl lg:max-w-5xl">
        <main className="flex flex-col items-center justify-center w-full">
          <section className="text-center mt-2 mb-12">

            <div className="flex items-center justify-center gap-4 mb-4">
              <img
                src={kbtuLogo}
                alt="KBTU Logo"
                className="w-30 h-30 object-contain shrink-0 ml-4"
              />
              <div className="flex flex-col items-start leading-none">
                <span className="text-5xl md:text-6xl font-extrabold text-blue-500 drop-shadow-lg">
                  KBTU Schedule
                </span>
                <span className="text-5xl md:text-6xl font-extrabold text-blue-500 drop-shadow-lg">
                  Builder
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-blue-400 mb-6">for students</h2>

            <p className="text-lg text-blue-300 mb-8 max-w-xl mx-auto">
              Meet <span className="font-bold text-blue-500">blabla.kbtu</span> — your personal assistant for easy scheduling.
            </p>

            <button
              className="px-8 py-4 rounded-xl bg-blue-700 text-white text-xl font-bold shadow-lg hover:bg-blue-800 transition-all duration-200"
              onClick={() => navigate('/builder')}
            >
              <span className="inline-flex items-center gap-3">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 8h18" />
                </svg>
                Build Schedule
              </span>
            </button>
          </section>
        </main>

        <footer className="mb-6 text-xs text-blue-600 text-center w-full">
          Made with <span className="text-blue-500">♥</span> by student for students
        </footer>

        <div className="mb-8 flex justify-center">
          <button
            className="p-2 rounded-full bg-blue-900 hover:bg-blue-700 transition border border-blue-700 shadow-lg"
            onClick={() => window.open('https://github.com/monlaf-sfk/schedulerkbtu', '_blank')}
            aria-label="GitHub"
          >
            <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.012c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.37-1.342-3.37-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.833.091-.646.35-1.088.636-1.34-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.254-.446-1.274.098-2.656 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.025 2.747-1.025.546 1.382.202 2.402.1 2.656.64.7 1.028 1.595 1.028 2.688 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.138 20.188 22 16.435 22 12.012 22 6.484 17.523 2 12 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

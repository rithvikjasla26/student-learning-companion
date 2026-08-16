import { useState } from 'react';

interface FlashcardProps {
  front: string;
  back: string;
  onNext: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ front, back, onNext }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="space-y-6">
      <div className="perspective">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full h-80 cursor-pointer transition-transform duration-500 transform ${
            isFlipped ? 'scale-y-[-1]' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 flex items-center justify-center text-white shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="text-center">
              <p className="text-sm font-semibold mb-4 opacity-75">Question</p>
              <p className="text-2xl font-bold">{front}</p>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 flex items-center justify-center text-white shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-center">
              <p className="text-sm font-semibold mb-4 opacity-75">Answer</p>
              <p className="text-2xl font-bold">{back}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-600 text-sm mb-4">
          {isFlipped ? 'Click to see question' : 'Click to reveal answer'}
        </p>
        <button
          onClick={onNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Got it, next!
        </button>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function FlashcardReview({ card, onNext }) {
  const [flipped, setFlipped] = useState(false);

  async function handleAnswer(correct) {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/review/${card.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ recalledCorrectly: correct }),
    });
    setFlipped(false);
    onNext();
  }

  return (
    <div className="max-w-md mx-auto">
      <div
        onClick={() => setFlipped(!flipped)}
        className="border rounded-xl p-8 h-48 flex items-center justify-center text-center cursor-pointer shadow"
      >
        {flipped ? card.back : card.front}
      </div>
      {flipped && (
        <div className="flex gap-3 mt-4">
          <button onClick={() => handleAnswer(false)} className="flex-1 bg-red-100 text-red-700 rounded-lg py-2">
            Missed it
          </button>
          <button onClick={() => handleAnswer(true)} className="flex-1 bg-green-100 text-green-700 rounded-lg py-2">
            Got it
          </button>
        </div>
      )}
    </div>
  );
}

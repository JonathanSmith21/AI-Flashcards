import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function NewDocumentForm({ onCreated }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ rawText: text }),
    });

    const doc = await res.json();
    setLoading(false);
    onCreated(doc.id);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
        className="border rounded-lg p-3 h-48"
        placeholder="Paste your lecture notes here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Generate Study Guide'}
      </button>
    </form>
  );
}

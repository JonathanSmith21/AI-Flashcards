import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function StudyGuideView({ documentId }) {
  const [text, setText] = useState('');

  useEffect(() => {
    async function streamGuide() {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/generate/study-guide/${documentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        decoder.decode(value).split('\n\n').forEach((line) => {
          if (line.startsWith('data: ')) {
            const parsed = JSON.parse(line.replace('data: ', ''));
            if (parsed.text) setText((prev) => prev + parsed.text);
          }
        });
      }
    }

    streamGuide();
  }, [documentId]);

  return <div className="prose whitespace-pre-wrap">{text}</div>;
}

import { useState } from 'react'
import NewDocumentForm from './components/NewDocumentForm'
import StudyGuideView from './components/StudyGuideView'
import FlashcardReview from './components/FlashcardReview'
import { supabase } from './lib/supabaseClient'
import './App.css'

// Simple single-page flow: paste notes -> generate study guide + flashcards -> review flashcards
function App() {
  const [documentId, setDocumentId] = useState(null)
  const [cards, setCards] = useState(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [generating, setGenerating] = useState(false)

  async function handleCreated(newDocumentId) {
    setDocumentId(newDocumentId)
    setGenerating(true)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/generate/flashcards/${newDocumentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()

    setCards(data.cards)
    setCardIndex(0)
    setGenerating(false)
  }

  function handleNextCard() {
    setCardIndex((i) => i + 1)
  }

  function handleStartOver() {
    setDocumentId(null)
    setCards(null)
    setCardIndex(0)
  }

  return (
    <section id="center">
      <h1>RecallForge</h1>

      {!documentId && <NewDocumentForm onCreated={handleCreated} />}

      {documentId && generating && <p>Generating your study guide and flashcards...</p>}

      {documentId && !generating && (
        <StudyGuideView documentId={documentId} />
      )}

      {cards && cardIndex < cards.length && (
        <FlashcardReview card={cards[cardIndex]} onNext={handleNextCard} />
      )}

      {cards && cardIndex >= cards.length && (
        <>
          <p>All done! You reviewed {cards.length} flashcards.</p>
          <button type="button" className="counter" onClick={handleStartOver}>
            Start a new document
          </button>
        </>
      )}
    </section>
  )
}

export default App

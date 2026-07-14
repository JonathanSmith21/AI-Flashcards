import { useEffect, useState } from 'react'
import NewDocumentForm from './components/NewDocumentForm'
import StudyGuideView from './components/StudyGuideView'
import FlashcardReview from './components/FlashcardReview'
import Auth from './components/Auth'
import { supabase } from './lib/supabaseClient'
import './App.css'

// Simple single-page flow: paste notes -> generate study guide + flashcards -> review flashcards
function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking, null = logged out
  const [documentId, setDocumentId] = useState(null)
  const [cards, setCards] = useState(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleCreated(newDocumentId) {
    setDocumentId(newDocumentId)
    setGenerating(true)
    setError('')

    try {
      const res = await fetch(`/api/generate/flashcards/${newDocumentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed with status ${res.status}`)
      }
      const data = await res.json()
      setCards(data.cards)
      setCardIndex(0)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  function handleNextCard() {
    setCardIndex((i) => i + 1)
  }

  function handleStartOver() {
    setDocumentId(null)
    setCards(null)
    setCardIndex(0)
  }

  if (session === undefined) {
    return (
      <section id="center">
        <h1>RecallForge</h1>
        <p>Loading...</p>
      </section>
    )
  }

  if (!session) {
    return (
      <section id="center">
        <h1>RecallForge</h1>
        <Auth />
      </section>
    )
  }

  return (
    <section id="center">
      <h1>RecallForge</h1>
      <button type="button" onClick={() => supabase.auth.signOut()}>Log out</button>

      {!documentId && <NewDocumentForm onCreated={handleCreated} />}

      {error && <p style={{ color: 'red' }}>{error}</p>}

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

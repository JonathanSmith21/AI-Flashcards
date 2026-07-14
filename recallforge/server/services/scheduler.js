export function scheduleNextReview(card, recalledCorrectly) {
  if (recalledCorrectly) {
    card.interval_days = Math.round(card.interval_days * card.ease_factor);
    card.ease_factor = Math.min(card.ease_factor + 0.1, 3.0);
  } else {
    card.interval_days = 1;
    card.ease_factor = Math.max(card.ease_factor - 0.2, 1.3);
  }

  const next = new Date();
  next.setDate(next.getDate() + card.interval_days);
  card.next_review_at = next;

  return card;
}

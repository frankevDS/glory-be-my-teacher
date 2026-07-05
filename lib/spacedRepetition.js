// A simple, well-established spaced-repetition schedule: each time a
// previously-missed question is answered correctly on review, the gap
// before it comes back grows; get it wrong again and it resets to the
// short interval. After enough correct reviews in a row, it's "mastered"
// and removed from the queue entirely.

const INTERVALS_DAYS = [1, 3, 7, 16, 35];

export function nextSchedule(reviewedCount, wasCorrect) {
  if (!wasCorrect) {
    return {
      reviewedCount: 0,
      nextReviewAt: addDays(new Date(), INTERVALS_DAYS[0]),
      mastered: false,
    };
  }

  const newCount = reviewedCount + 1;
  if (newCount >= INTERVALS_DAYS.length) {
    return { reviewedCount: newCount, nextReviewAt: null, mastered: true };
  }
  return {
    reviewedCount: newCount,
    nextReviewAt: addDays(new Date(), INTERVALS_DAYS[newCount]),
    mastered: false,
  };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

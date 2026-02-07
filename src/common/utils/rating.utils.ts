export function calculateAvgRating(reviews: { overallRating: number }[]) {
  const count = reviews.length;

  if (count === 0) {
    return { avgSkillRating: null, reviewCount: 0 };
  }

  const total = reviews.reduce((sum, review) => sum + review.overallRating, 0);
  const avgSkillRating = total / count;

  return { avgSkillRating, reviewCount: count };
}

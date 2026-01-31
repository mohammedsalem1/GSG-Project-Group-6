

export function calculateAvgRating(reviews: {
             overallRating:number,
             communicationRating:number,
             punctualityRating:number}[]) {
  if (!reviews.length) return { avgSkillRating: null, avgRatings: null };

  const total = reviews.reduce(
    (totalsSoFar, review) => ({
      overall: totalsSoFar.overall + review.overallRating,
      communication: totalsSoFar.communication + (review.communicationRating ?? 0),
      punctuality: totalsSoFar.punctuality + review.punctualityRating,
    }),
    { overall: 0, communication: 0, punctuality: 0 }
  );

  const avgRatings = {
    overallRating: total.overall / reviews.length,
    communicationRating: total.communication / reviews.length,
    punctualityRating: total.punctuality / reviews.length,
  };

  const avgSkillRating = (avgRatings.overallRating + avgRatings.communicationRating + avgRatings.punctualityRating) / 3;

  return  avgSkillRating;
}

export function calculateCER(prediction: string, groundTruth: string): number {
  if (groundTruth.length === 0) return prediction.length === 0 ? 0 : 100;
  const m = prediction.length, n = groundTruth.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = prediction[i - 1] === groundTruth[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return (dp[m][n] / n) * 100;
}

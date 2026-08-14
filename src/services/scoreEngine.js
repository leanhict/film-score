/**
 * FilmScore Unified Engine
 * Chuẩn hóa và tính toán điểm số tổng hợp từ IMDb, Rotten Tomatoes và Metacritic
 */

export const DEFAULT_WEIGHTS = {
  imdb: 35,
  rtCritics: 25,
  rtAudience: 20,
  metacritic: 20,
};

/**
 * Chuẩn hóa các điểm số về thang điểm 100
 */
export function normalizeScores(ratings = {}) {
  const imdb = typeof ratings.imdb === 'number' ? ratings.imdb * 10 : null; // 8.4 -> 84
  const rtCritics = typeof ratings.rtCritics === 'number' ? ratings.rtCritics : null; // 93% -> 93
  const rtAudience = typeof ratings.rtAudience === 'number' ? ratings.rtAudience : null; // 95% -> 95
  const metascore = typeof ratings.metascore === 'number' ? ratings.metascore : null; // 88 -> 88
  const mcUser = typeof ratings.mcUser === 'number' ? ratings.mcUser * 10 : null; // 8.6 -> 86

  return {
    imdb,
    rtCritics,
    rtAudience,
    metascore,
    mcUser,
  };
}

/**
 * Tính Unified Film Score theo trọng số tùy biến
 */
export function calculateUnifiedScore(ratings = {}, weights = DEFAULT_WEIGHTS) {
  const normalized = normalizeScores(ratings);
  
  let totalScoreWeight = 0;
  let totalWeight = 0;

  if (normalized.imdb !== null) {
    totalScoreWeight += normalized.imdb * (weights.imdb || 0);
    totalWeight += (weights.imdb || 0);
  }

  if (normalized.rtCritics !== null) {
    totalScoreWeight += normalized.rtCritics * (weights.rtCritics || 0);
    totalWeight += (weights.rtCritics || 0);
  }

  if (normalized.rtAudience !== null) {
    totalScoreWeight += normalized.rtAudience * (weights.rtAudience || 0);
    totalWeight += (weights.rtAudience || 0);
  }

  if (normalized.metascore !== null) {
    totalScoreWeight += normalized.metascore * (weights.metacritic || 0);
    totalWeight += (weights.metacritic || 0);
  }

  if (totalWeight === 0) return 0;
  
  const finalScore = Math.round(totalScoreWeight / totalWeight);
  return Math.min(100, Math.max(0, finalScore));
}

/**
 * Tính toán độ chênh lệch giữa Giới phê bình (Critic) và Khán giả (Audience)
 */
export function calculateDiscrepancy(ratings = {}) {
  const normalized = normalizeScores(ratings);
  
  // Điểm phê bình trung bình
  const criticScores = [normalized.rtCritics, normalized.metascore].filter(s => s !== null);
  const avgCritic = criticScores.length > 0
    ? criticScores.reduce((a, b) => a + b, 0) / criticScores.length
    : null;

  // Điểm khán giả trung bình
  const audienceScores = [normalized.imdb, normalized.rtAudience, normalized.mcUser].filter(s => s !== null);
  const avgAudience = audienceScores.length > 0
    ? audienceScores.reduce((a, b) => a + b, 0) / audienceScores.length
    : null;

  if (avgCritic === null || avgAudience === null) {
    return {
      gap: 0,
      type: 'neutral',
      description: 'Chưa đủ dữ liệu để đối chiếu phê bình và khán giả.',
      avgCritic: avgCritic ? Math.round(avgCritic) : null,
      avgAudience: avgAudience ? Math.round(avgAudience) : null,
    };
  }

  const gap = Math.round(avgCritic - avgAudience); // > 0: Phê bình cao hơn, < 0: Khán giả cao hơn

  let type = 'neutral';
  let description = 'Giới phê bình và khán giả có cùng góc nhìn tương đồng.';

  if (gap >= 16) {
    type = 'critic_favored';
    description = `Giới phê bình đánh giá cao hơn khán giả đại chúng ${gap} điểm. Tác phẩm mang tính nghệ thuật hoặc kén người xem.`;
  } else if (gap <= -16) {
    type = 'audience_favored';
    description = `Khán giả đại chúng yêu thích vượt trội so với giới chuyên môn (+${Math.abs(gap)} điểm). Phim mang tính giải trí và cảm xúc cao.`;
  } else if (Math.abs(gap) <= 7 && avgCritic >= 80 && avgAudience >= 80) {
    type = 'universal_acclaim';
    description = 'Sự đồng thuận tuyệt đối: Cả chuyên gia lẫn công chúng đều xem đây là một kiệt tác.';
  }

  return {
    gap,
    type,
    description,
    avgCritic: Math.round(avgCritic),
    avgAudience: Math.round(avgAudience),
  };
}

/**
 * Phân loại nhãn tự động chuẩn Việt hóa (Badges)
 */
export function getMovieBadge(ratings = {}, isHiddenGem = false) {
  const normalized = normalizeScores(ratings);
  const unified = calculateUnifiedScore(ratings);
  const disc = calculateDiscrepancy(ratings);

  const scores = [normalized.imdb, normalized.rtCritics, normalized.rtAudience, normalized.metascore].filter(s => s !== null);
  if (scores.length === 0) return null;

  // 1. Kiệt tác toàn diện
  const allHigh = scores.every(s => s >= 84) && unified >= 88;
  if (allHigh) {
    return {
      key: 'masterpiece',
      label: 'Kiệt Tác Điện Ảnh',
      shortLabel: 'Kiệt Tác',
      icon: '👑',
      className: 'badge-masterpiece',
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.15)',
      description: 'Nhận được sự tán dương nhiệt liệt và đồng thuận cao từ cả 3 nền tảng chấm điểm uy tín nhất.',
    };
  }

  // 2. Hạt ngọc ẩn mình
  if (isHiddenGem || (unified >= 82 && (ratings.voteCount && ratings.voteCount < 100000))) {
    return {
      key: 'hidden_gem',
      label: 'Hạt Ngọc Ẩn Mình',
      shortLabel: 'Ngọc Ẩn',
      icon: '💎',
      className: 'badge-hidden-gem',
      color: '#38bdf8',
      bg: 'rgba(6, 182, 212, 0.15)',
      description: 'Chất lượng xuất sắc vượt trội nhưng ít được truyền thông đại chúng chú ý.',
    };
  }

  // 3. Giới phê bình ca ngợi
  if (disc.gap >= 16) {
    return {
      key: 'critic_darling',
      label: 'Giới Phê Bình Ca Ngợi',
      shortLabel: 'Phê Bình Khen',
      icon: '🎭',
      className: 'badge-critic',
      color: '#ff6b4a',
      bg: 'rgba(250, 50, 10, 0.15)',
      description: 'Giới phê bình hàn lâm đánh giá rất cao, chất lượng thủ pháp điện ảnh đỉnh cao.',
    };
  }

  // 4. Khán giả yêu thích
  if (disc.gap <= -16 && disc.avgAudience >= 75) {
    return {
      key: 'audience_favorite',
      label: 'Khán Giả Yêu Thích',
      shortLabel: 'Khán Giả Mê',
      icon: '🍿',
      className: 'badge-audience',
      color: '#fde047',
      bg: 'rgba(249, 200, 14, 0.15)',
      description: 'Chiếm trọn tình cảm của người xem đại chúng, tính giải trí và cảm xúc rất cao.',
    };
  }

  // 5. Phân cực tranh cãi
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  if (maxScore - minScore >= 28) {
    return {
      key: 'polarizing',
      label: 'Phân Cực Tranh Cãi',
      shortLabel: 'Gây Tranh Cãi',
      icon: '⚡',
      className: 'badge-polarizing',
      color: '#c084fc',
      bg: 'rgba(139, 92, 246, 0.15)',
      description: 'Ý kiến chia rẽ sâu sắc giữa các bên, người cho là siêu phẩm kẻ cho là thất bại.',
    };
  }

  // 6. Giải trí đích thực (Guilty Pleasure)
  if (disc.avgCritic !== null && disc.avgCritic < 55 && disc.avgAudience !== null && disc.avgAudience >= 75) {
    return {
      key: 'guilty_pleasure',
      label: 'Giải Trí Đích Thực',
      shortLabel: 'Xem Giải Trí',
      icon: '🎉',
      className: 'badge-guilty-pleasure',
      color: '#f472b6',
      bg: 'rgba(236, 72, 153, 0.15)',
      description: 'Bỏ qua những đánh giá khắt khe của giới chuyên môn, đây là phim cực kỳ cuốn hút khi thưởng thức cùng bạn bè.',
    };
  }

  // 7. Chất lượng chuẩn mực
  if (unified >= 72) {
    return {
      key: 'balanced',
      label: 'Đạt Chuẩn Điện Ảnh',
      shortLabel: 'Chuẩn Mực',
      icon: '✨',
      className: 'badge-balanced',
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.15)',
      description: 'Bộ phim có chất lượng tốt, đồng đều và đáng xem trên mọi khía cạnh.',
    };
  }

  return {
    key: 'niche',
    label: 'Kén Khán Giả',
    shortLabel: 'Kén Người Xem',
    icon: '☕',
    className: 'badge-polarizing',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    description: 'Chất lượng trung bình hoặc thể nghiệm đặc thù hướng đến nhóm khán giả riêng biệt.',
  };
}

/**
 * Xác định màu sắc đại diện cho điểm số
 */
export function getScoreColor(score) {
  if (score >= 85) return '#fbbf24'; // Gold
  if (score >= 75) return '#10b981'; // Emerald
  if (score >= 60) return '#06b6d4'; // Cyan
  if (score >= 45) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

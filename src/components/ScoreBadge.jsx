import React from 'react';
import { getScoreColor } from '../services/scoreEngine';
import './ScoreBadge.css';

/**
 * Component hiển thị huy hiệu điểm số từng nguồn hoặc điểm tổng hợp Unified Score
 */
export function ScoreBadge({ type, score, votes, size = 'medium' }) {
  if (score === null || score === undefined) {
    return (
      <div className={`score-badge score-badge-${size} score-badge-empty`}>
        <span className="source-label">{type}</span>
        <span className="score-value">N/A</span>
      </div>
    );
  }

  // 1. HUY HIỆU ĐIỂM TỔNG HỢP (UNIFIED FILM SCORE)
  if (type === 'unified') {
    const color = getScoreColor(score);
    return (
      <div className={`score-badge-unified score-badge-${size}`} style={{ '--accent-color': color }}>
        <div className="unified-ring">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path
              className="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="circle"
              strokeDasharray={`${score}, 100`}
              stroke={color}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="unified-value">
            <span className="score-num">{score}</span>
            <span className="score-max">/100</span>
          </div>
        </div>
        <div className="unified-text">
          <span className="unified-title">Unified Score</span>
          <span className="unified-sub">Điểm Tổng Hợp</span>
        </div>
      </div>
    );
  }

  // 2. HUY HIỆU IMDB
  if (type === 'imdb') {
    return (
      <div className={`score-badge score-badge-imdb score-badge-${size}`} title={`IMDb Rating: ${score}/10 (${votes || 'Hàng trăm nghìn lượt bình chọn'})`}>
        <div className="source-icon imdb-icon">IMDb</div>
        <div className="score-content">
          <span className="score-main">
            <span className="star-icon">★</span> {score.toFixed(1)}
          </span>
          <span className="score-sub">/10</span>
        </div>
      </div>
    );
  }

  // 3. HUY HIỆU ROTTEN TOMATOES (CRITICS TOMATOMETER)
  if (type === 'rtCritics') {
    const isFresh = score >= 60;
    return (
      <div className={`score-badge score-badge-rt-critic score-badge-${size}`} title={`Rotten Tomatoes Tomatometer: ${score}% (Giới Phê Bình Chuyên Môn)`}>
        <span className="source-emoji" role="img" aria-label="Tomato">
          {isFresh ? '🍅' : '🟢'}
        </span>
        <div className="score-content">
          <span className="source-name">Tomatometer</span>
          <span className="score-main">{score}%</span>
        </div>
      </div>
    );
  }

  // 4. HUY HIỆU ROTTEN TOMATOES (AUDIENCE POPCORNMETER)
  if (type === 'rtAudience') {
    const isPopcorn = score >= 60;
    return (
      <div className={`score-badge score-badge-rt-audience score-badge-${size}`} title={`Rotten Tomatoes Popcornmeter: ${score}% (Khán Giả Đại Chúng)`}>
        <span className="source-emoji" role="img" aria-label="Popcorn">
          {isPopcorn ? '🍿' : '🥤'}
        </span>
        <div className="score-content">
          <span className="source-name">Khán giả RT</span>
          <span className="score-main">{score}%</span>
        </div>
      </div>
    );
  }

  // 5. HUY HIỆU METACRITIC (METASCORE)
  if (type === 'metacritic') {
    let mcClass = 'mc-green';
    if (score < 60) mcClass = 'mc-yellow';
    if (score < 40) mcClass = 'mc-red';

    return (
      <div className={`score-badge score-badge-metacritic score-badge-${size}`} title={`Metacritic Metascore: ${score}/100 (Trọng số phê bình báo chí uy tín)`}>
        <div className={`mc-box ${mcClass}`}>{score}</div>
        <div className="score-content">
          <span className="source-name">Metascore</span>
          <span className="score-sub">/100</span>
        </div>
      </div>
    );
  }

  return null;
}

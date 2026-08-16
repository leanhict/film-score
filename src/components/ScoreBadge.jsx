import React from 'react';
import { getScoreColor } from '../services/scoreEngine';
import './ScoreBadge.css';

/**
 * Component hiển thị huy hiệu điểm số từng nguồn hoặc điểm tổng hợp Unified Score
 */
export function ScoreBadge({ type, score, votes, size = 'medium', showSubtitle = false, subtitle }) {
  const hasScore = score !== null && score !== undefined;

  // 1. HUY HIỆU ĐIỂM TỔNG HỢP (UNIFIED FILM SCORE)
  if (type === 'unified') {
    const validScore = hasScore ? Math.round(Number(score)) : 0;
    const color = getScoreColor(validScore);
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
              strokeDasharray={`${validScore}, 100`}
              stroke={color}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="unified-value">
            <span className="score-num">{validScore}</span>
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
    const subText = subtitle || (showSubtitle ? 'Khán giả toàn cầu' : null);
    const displayScore = hasScore ? (typeof score === 'number' ? score.toFixed(1) : parseFloat(score).toFixed(1)) : 'N/A';
    return (
      <div 
        className={`score-badge score-badge-imdb score-badge-${size} ${subText ? 'has-subtitle' : ''} ${!hasScore ? 'score-badge-na' : ''}`} 
        title={hasScore ? `IMDb Rating: ${displayScore}/10 (${votes || 'Hàng trăm nghìn lượt bình chọn'})` : 'Chưa có điểm IMDb'}
      >
        <div className="source-icon imdb-icon">IMDb</div>
        <div className="score-content">
          <div className="score-main-row">
            <span className="score-main">
              <span className="star-icon">★</span> {displayScore}
            </span>
            {hasScore && <span className="score-sub">/10</span>}
          </div>
          {subText && <span className="score-desc-tag">{subText}</span>}
        </div>
      </div>
    );
  }

  // 3. HUY HIỆU ROTTEN TOMATOES (CRITICS TOMATOMETER)
  if (type === 'rtCritics') {
    const isFresh = hasScore && Number(score) >= 60;
    const subText = subtitle || (showSubtitle ? 'Phê bình chuyên môn' : null);
    const displayScore = hasScore ? `${score}%` : 'N/A';
    return (
      <div 
        className={`score-badge score-badge-rt-critic score-badge-${size} ${subText ? 'has-subtitle' : ''} ${!hasScore ? 'score-badge-na' : ''}`} 
        title={hasScore ? `Rotten Tomatoes Tomatometer: ${score}% (Giới Phê Bình Chuyên Môn)` : 'Chưa có điểm Tomatometer'}
      >
        <span className="source-emoji" role="img" aria-label="Tomato">
          {hasScore ? (isFresh ? '🍅' : '🟢') : '🍅'}
        </span>
        <div className="score-content">
          <div className="score-main-row">
            <span className="score-main">{displayScore}</span>
            <span className="source-name">Tomatometer</span>
          </div>
          {subText && <span className="score-desc-tag">{subText}</span>}
        </div>
      </div>
    );
  }

  // 4. HUY HIỆU ROTTEN TOMATOES (AUDIENCE POPCORNMETER)
  if (type === 'rtAudience') {
    const isPopcorn = hasScore && Number(score) >= 60;
    const subText = subtitle || (showSubtitle ? 'Khán giả đại chúng' : null);
    const displayScore = hasScore ? `${score}%` : 'N/A';
    return (
      <div 
        className={`score-badge score-badge-rt-audience score-badge-${size} ${subText ? 'has-subtitle' : ''} ${!hasScore ? 'score-badge-na' : ''}`} 
        title={hasScore ? `Rotten Tomatoes Popcornmeter: ${score}% (Khán Giả Đại Chúng)` : 'Chưa có điểm Popcornmeter'}
      >
        <span className="source-emoji" role="img" aria-label="Popcorn">
          {hasScore ? (isPopcorn ? '🍿' : '🥤') : '🍿'}
        </span>
        <div className="score-content">
          <div className="score-main-row">
            <span className="score-main">{displayScore}</span>
            <span className="source-name">Popcornmeter</span>
          </div>
          {subText && <span className="score-desc-tag">{subText}</span>}
        </div>
      </div>
    );
  }

  // 5. HUY HIỆU METACRITIC (METASCORE)
  if (type === 'metacritic') {
    const subText = subtitle || (showSubtitle ? 'Báo chí chuyên môn' : null);
    const displayScore = hasScore ? score : 'N/A';

    return (
      <div 
        className={`score-badge score-badge-metacritic score-badge-${size} ${subText ? 'has-subtitle' : ''} ${!hasScore ? 'score-badge-na' : ''}`} 
        title={hasScore ? `Metacritic Metascore: ${score}/100 (Trọng số phê bình báo chí uy tín)` : 'Chưa có điểm Metascore'}
      >
        <div className="source-icon mc-icon">MC</div>
        <div className="score-content">
          <div className="score-main-row">
            <span className="score-main">{displayScore}</span>
            {hasScore && <span className="score-sub">/100</span>}
            <span className="source-name">Metascore</span>
          </div>
          {subText && <span className="score-desc-tag">{subText}</span>}
        </div>
      </div>
    );
  }

  if (!hasScore) {
    return (
      <div className={`score-badge score-badge-${size} score-badge-empty`}>
        <span className="source-label">{type}</span>
        <span className="score-value">N/A</span>
      </div>
    );
  }

  return null;
}

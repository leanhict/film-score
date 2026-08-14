import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { calculateUnifiedScore, getMovieBadge, getScoreColor } from '../services/scoreEngine';
import { ScoreBadge } from './ScoreBadge';
import { Dices, Sparkles, Trophy, RotateCw, Play, Info, Check, Filter } from 'lucide-react';
import './RandomPickerModal.css';

export function RandomPickerModal({
  isOpen,
  onClose,
  movies = [],
  weights,
  onSelectMovie,
  onOpenTrailer
}) {
  const [minScore, setMinScore] = useState(75);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);

  if (!isOpen) return null;

  // Thu thập danh sách thể loại độc nhất
  const allGenres = Array.from(
    new Set(movies.flatMap(m => m.genres || []))
  ).filter(Boolean);

  const handleSpin = () => {
    // Lọc phim theo tiêu chuẩn
    const pool = movies.filter(m => {
      const score = calculateUnifiedScore(m.ratings, weights);
      if (score < minScore) return false;
      if (selectedGenre !== 'all' && !m.genres?.includes(selectedGenre)) return false;
      if (selectedCategory === 'vietnam' && m.country !== 'Việt Nam') return false;
      if (selectedCategory === 'masterpiece' && score < 85) return false;
      return true;
    });

    if (pool.length === 0) {
      alert('Không tìm thấy bộ phim nào phù hợp với bộ lọc hiện tại. Hãy hạ bớt điểm tối thiểu hoặc chọn tất cả thể loại.');
      return;
    }

    setIsSpinning(true);
    setSelectedWinner(null);

    // Hiệu ứng quay số nhanh qua các phim
    let counter = 0;
    const interval = setInterval(() => {
      const randomCandidate = pool[Math.floor(Math.random() * pool.length)];
      setSelectedWinner(randomCandidate);
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        const finalWinner = pool[Math.floor(Math.random() * pool.length)];
        setSelectedWinner(finalWinner);
        setIsSpinning(false);

        // BẮN PHÁO HOA ĂN MỪNG
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f5c518', '#6366f1', '#06b6d4', '#fa320a', '#10b981']
          });
        } catch (e) {
          // ignore if canvas not supported
        }
      }
    }, 100);
  };

  const winnerScore = selectedWinner ? calculateUnifiedScore(selectedWinner.ratings, weights) : 0;
  const winnerBadge = selectedWinner ? getMovieBadge(selectedWinner.ratings) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="random-picker-modal glass-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="picker-header">
          <div className="picker-title-wrap">
            <div className="picker-dice-icon">
              <Dices size={24} />
            </div>
            <div>
              <h3>Tối Nay Xem Gì? - Vòng Quay Điện Ảnh</h3>
              <p className="picker-sub">Để thuật toán thông minh lựa chọn bộ phim hoàn hảo cho buổi tối của bạn</p>
            </div>
          </div>
          <button className="picker-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* CRITERIA CONTROLS */}
        <div className="picker-filters-panel glass-panel">
          <div className="filter-group-row">
            {/* MIN SCORE */}
            <div className="filter-control">
              <label className="control-label">Điểm FilmScore tối thiểu: <strong>{minScore}đ</strong></label>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="picker-slider"
                disabled={isSpinning}
              />
            </div>

            {/* GENRE */}
            <div className="filter-control">
              <label className="control-label">Thể loại:</label>
              <select
                className="picker-select"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                disabled={isSpinning}
              >
                <option value="all">Tất cả thể loại</option>
                {allGenres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* CATEGORY */}
            <div className="filter-control">
              <label className="control-label">Phân khúc:</label>
              <select
                className="picker-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isSpinning}
              >
                <option value="all">Tất cả kho phim</option>
                <option value="masterpiece">👑 Chỉ Kiệt Tác (≥ 85đ)</option>
                <option value="vietnam">🇻🇳 Điện Ảnh Việt Nam</option>
              </select>
            </div>
          </div>

          <button
            className={`picker-spin-btn ${isSpinning ? 'spinning' : ''}`}
            onClick={handleSpin}
            disabled={isSpinning}
          >
            {isSpinning ? (
              <>
                <RotateCw size={18} className="spin-icon" /> Đang Lựa Chọn...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Quay Chọn Phim Ngẫu Nhiên!
              </>
            )}
          </button>
        </div>

        {/* WINNER SPOTLIGHT BOX */}
        {selectedWinner && (
          <div className="winner-card glass-panel animate-fade-in">
            <div className="winner-trophy-badge">
              <Trophy size={16} /> Phim Được Chọn Cho Bạn:
            </div>

            <div className="winner-content-grid">
              <img
                src={selectedWinner.poster}
                alt={selectedWinner.title}
                className="winner-poster"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
                }}
              />

              <div className="winner-info">
                <div className="winner-badge-row">
                  {winnerBadge && (
                    <span className={`badge ${winnerBadge.className}`}>
                      {winnerBadge.icon} {winnerBadge.label}
                    </span>
                  )}
                  <span className="winner-year">{selectedWinner.year}</span>
                  <span className="winner-runtime">{selectedWinner.runtime}</span>
                </div>

                <h4 className="winner-title">
                  {selectedWinner.vietnameseTitle || selectedWinner.title}
                </h4>
                {selectedWinner.vietnameseTitle && selectedWinner.vietnameseTitle !== selectedWinner.title && (
                  <span className="winner-sub">{selectedWinner.title}</span>
                )}

                <div className="winner-scores-cluster">
                  <ScoreBadge type="unified" score={winnerScore} size="medium" />
                  <ScoreBadge type="imdb" score={selectedWinner.ratings?.imdb} />
                  <ScoreBadge type="rtCritics" score={selectedWinner.ratings?.rtCritics} />
                  <ScoreBadge type="metacritic" score={selectedWinner.ratings?.metascore} />
                </div>

                <p className="winner-synopsis">{selectedWinner.synopsis}</p>

                <div className="winner-actions-row">
                  {selectedWinner.trailerUrl && (
                    <button
                      className="winner-btn play-btn"
                      onClick={() => {
                        onClose();
                        onOpenTrailer(selectedWinner);
                      }}
                    >
                      <Play size={16} fill="currentColor" /> Xem Trailer
                    </button>
                  )}

                  <button
                    className="winner-btn info-btn"
                    onClick={() => {
                      onClose();
                      onSelectMovie(selectedWinner);
                    }}
                  >
                    <Info size={16} /> Xem Chi Tiết & Đánh Giá
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

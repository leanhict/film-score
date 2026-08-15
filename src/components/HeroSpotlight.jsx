import React, { useState, useEffect, useMemo } from 'react';
import { calculateUnifiedScore, getMovieBadge } from '../services/scoreEngine';
import { ScoreBadge } from './ScoreBadge';
import { Play, Info, Bookmark, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import './HeroSpotlight.css';

export function HeroSpotlight({
  movies = [],
  weights,
  onSelectMovie,
  onOpenTrailer,
  watchlist = [],
  onToggleWatchlist
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Chỉ lọc hiển thị các phim có điểm số IMDb trên 6.5 cho Hero Banner
  const spotlightList = useMemo(() => {
    const qualified = (movies || []).filter(m => (m.ratings?.imdb || 0) > 6.5);
    return (qualified.length > 0 ? qualified : (movies || []).filter(m => (m.ratings?.imdb || 0) >= 6.0)).slice(0, 5);
  }, [movies]);

  // Đảm bảo currentIndex luôn hợp lệ khi danh sách thay đổi
  useEffect(() => {
    if (currentIndex >= spotlightList.length) {
      setCurrentIndex(0);
    }
  }, [spotlightList.length, currentIndex]);

  const currentMovie = spotlightList[currentIndex] || spotlightList[0] || null;

  // Auto slide mỗi 8s nếu người dùng không tương tác
  useEffect(() => {
    if (spotlightList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % spotlightList.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [spotlightList.length]);

  if (!currentMovie) return null;

  const unifiedScore = calculateUnifiedScore(currentMovie.ratings, weights);
  const badge = getMovieBadge(currentMovie.ratings);
  const isWatchlisted = watchlist.some(m => m.id === currentMovie.id);

  const handleNext = () => setCurrentIndex(prev => (prev + 1) % spotlightList.length);
  const handlePrev = () => setCurrentIndex(prev => (prev - 1 + spotlightList.length) % spotlightList.length);

  return (
    <div className="hero-spotlight-container">
      {/* BACKDROP IMAGE & GRADIENTS */}
      <div className="hero-backdrop-layer">
        <img
          src={currentMovie.backdrop || currentMovie.poster}
          alt={currentMovie.title}
          className="hero-backdrop-img animate-fade-in"
          key={currentMovie.id}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80';
          }}
        />
        <div className="hero-gradient-overlay" />
      </div>

      <div className="container hero-content-wrapper">
        <div className="hero-content-left animate-fade-in" key={`content-${currentMovie.id}`}>
          {/* BADGE & SPOTLIGHT TAG */}
          <div className="hero-tag-row">
            <span className="spotlight-tag">
              <Sparkles size={14} className="sparkle-icon" /> Tác Phẩm Nổi Bật
            </span>
            {badge && (
              <span className={`badge ${badge.className}`}>
                {badge.icon} {badge.label}
              </span>
            )}
            {currentMovie.country === 'Việt Nam' && (
              <span className="badge badge-masterpiece">🇻🇳 Điện Ảnh Việt Nam</span>
            )}
          </div>

          {/* TITLES */}
          <h1 className="hero-main-title">
            {currentMovie.vietnameseTitle || currentMovie.title}
          </h1>
          {currentMovie.vietnameseTitle && currentMovie.vietnameseTitle !== currentMovie.title && (
            <h2 className="hero-sub-title">{currentMovie.title}</h2>
          )}

          {/* META ROW */}
          <div className="hero-meta-row">
            <span className="hero-meta-item">{currentMovie.year}</span>
            <span className="meta-dot">•</span>
            <span className="hero-meta-item">{currentMovie.runtime}</span>
            <span className="meta-dot">•</span>
            <span className="hero-meta-item">Đạo diễn: {currentMovie.director}</span>
            <span className="meta-dot">•</span>
            <span className="hero-meta-genres">
              {currentMovie.genres?.join(', ')}
            </span>
          </div>

          {/* SYNOPSIS */}
          <p className="hero-synopsis">
            {currentMovie.synopsis}
          </p>

          {/* SCORES ROW */}
          <div className="hero-scores-cluster">
            <ScoreBadge type="unified" score={unifiedScore} size="large" />

            <div className="hero-source-badges">
              <ScoreBadge type="imdb" score={currentMovie.ratings?.imdb} votes={currentMovie.ratings?.imdbVotes} showSubtitle={true} />
              <ScoreBadge type="rtCritics" score={currentMovie.ratings?.rtCritics} showSubtitle={true} />
              <ScoreBadge type="rtAudience" score={currentMovie.ratings?.rtAudience} showSubtitle={true} />
              <ScoreBadge type="metacritic" score={currentMovie.ratings?.metascore} showSubtitle={true} />
            </div>
          </div>

          {/* CTA ACTIONS */}
          <div className="hero-cta-group">
            {currentMovie.trailerUrl && (
              <button
                className="hero-btn hero-btn-primary"
                onClick={() => onOpenTrailer && onOpenTrailer(currentMovie)}
                title="Xem trailer chính thức"
              >
                <Play size={16} fill="currentColor" />
                <span className="hero-btn-text-full">Xem Trailer</span>
                <span className="hero-btn-text-short">Trailer</span>
              </button>
            )}

            <button
              className="hero-btn hero-btn-secondary"
              onClick={() => onSelectMovie && onSelectMovie(currentMovie)}
              title="Xem chi tiết & So sánh điểm số"
            >
              <Info size={16} />
              <span className="hero-btn-text-full">Chi Tiết & So Sánh</span>
              <span className="hero-btn-text-short">Chi Tiết</span>
            </button>

            <button
              className={`hero-btn hero-btn-bookmark ${isWatchlisted ? 'active' : ''}`}
              onClick={() => onToggleWatchlist && onToggleWatchlist(currentMovie)}
              title={isWatchlisted ? 'Đã lưu vào danh sách xem' : 'Lưu vào danh sách muốn xem'}
            >
              <Bookmark size={16} fill={isWatchlisted ? 'currentColor' : 'none'} />
              <span className="hero-btn-text-full">{isWatchlisted ? 'Đã Lưu' : 'Lưu Danh Sách'}</span>
              <span className="hero-btn-text-short">{isWatchlisted ? 'Đã Lưu' : 'Lưu Phim'}</span>
            </button>
          </div>
        </div>

        {/* SLIDE NAVIGATION CONTROLS */}
        <div className="hero-slide-nav">
          <button className="slide-arrow-btn" onClick={handlePrev} aria-label="Phim trước">
            <ChevronLeft size={22} />
          </button>
          <div className="slide-dots">
            {spotlightList.map((m, idx) => (
              <button
                key={m.id}
                className={`slide-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Chuyển tới phim ${m.title}`}
              />
            ))}
          </div>
          <button className="slide-arrow-btn" onClick={handleNext} aria-label="Phim kế tiếp">
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

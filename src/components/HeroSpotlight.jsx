import React, { useState, useEffect } from 'react';
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

  // Lọc ra top phim nổi bật cho Hero
  const spotlightList = movies.slice(0, 5);
  const currentMovie = spotlightList[currentIndex] || movies[0];

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
              <ScoreBadge type="imdb" score={currentMovie.ratings?.imdb} votes={currentMovie.ratings?.imdbVotes} />
              <ScoreBadge type="rtCritics" score={currentMovie.ratings?.rtCritics} />
              <ScoreBadge type="rtAudience" score={currentMovie.ratings?.rtAudience} />
              <ScoreBadge type="metacritic" score={currentMovie.ratings?.metascore} />
            </div>
          </div>

          {/* CTA ACTIONS */}
          <div className="hero-cta-group">
            {currentMovie.trailerUrl && (
              <button
                className="hero-btn hero-btn-primary"
                onClick={() => onOpenTrailer && onOpenTrailer(currentMovie)}
              >
                <Play size={18} fill="currentColor" /> Xem Trailer
              </button>
            )}

            <button
              className="hero-btn hero-btn-secondary"
              onClick={() => onSelectMovie && onSelectMovie(currentMovie)}
            >
              <Info size={18} /> Chi Tiết & So Sánh
            </button>

            <button
              className={`hero-btn hero-btn-bookmark ${isWatchlisted ? 'active' : ''}`}
              onClick={() => onToggleWatchlist && onToggleWatchlist(currentMovie)}
            >
              <Bookmark size={18} fill={isWatchlisted ? 'currentColor' : 'none'} />
              {isWatchlisted ? 'Đã Lưu' : 'Lưu Danh Sách'}
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

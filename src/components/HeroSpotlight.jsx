import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { calculateUnifiedScore, getMovieBadge } from '../services/scoreEngine';
import { NETFLIX_CATEGORIES } from '../services/netflixCatalogService';
import { resolveMovieTitles } from '../utils/movieTitleResolver';
import { formatQuickSynopsis } from '../utils/searchUtils';
import { ScoreBadge } from './ScoreBadge';
import { Play, Info, Bookmark, Sparkles } from 'lucide-react';
import './HeroSpotlight.css';

export function HeroSpotlight({
  movies = [],
  weights,
  onSelectMovie,
  onOpenTrailer,
  watchlist = [],
  onToggleWatchlist,
  activeCategory,
  onSelectCategory
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);

  // Chỉ lọc hiển thị các phim có điểm số IMDb trên 6.5 cho Hero Banner
  const spotlightList = useMemo(() => {
    const qualified = (movies || []).filter(m => (m.ratings?.imdb || 0) > 6.5);
    return (qualified.length > 0 ? qualified : (movies || []).filter(m => (m.ratings?.imdb || 0) >= 6.0)).slice(0, 6);
  }, [movies]);

  // Đảm bảo currentIndex luôn hợp lệ khi danh sách thay đổi
  useEffect(() => {
    if (currentIndex >= spotlightList.length) {
      setCurrentIndex(0);
    }
  }, [spotlightList.length, currentIndex]);

  const currentMovie = spotlightList[currentIndex] || spotlightList[0] || null;

  const handleNext = useCallback(() => {
    if (spotlightList.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % spotlightList.length);
  }, [spotlightList.length]);

  const handlePrev = useCallback(() => {
    if (spotlightList.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + spotlightList.length) % spotlightList.length);
  }, [spotlightList.length]);

  if (!currentMovie) return null;

  const unifiedScore = calculateUnifiedScore(currentMovie.ratings, weights);
  const badge = getMovieBadge(currentMovie.ratings);
  const isWatchlisted = watchlist.some(m => m.id === currentMovie.id);

  // Auto slide mỗi 8s nếu không có tương tác
  useEffect(() => {
    if (spotlightList.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(interval);
  }, [spotlightList.length, handleNext]);

  // Vuốt chạm trên Mobile / Tablet
  const handleTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      handleNext(); // Vuốt sang trái -> Xem banner tiếp theo
    } else if (diff < -45) {
      handlePrev(); // Vuốt sang phải -> Xem banner phía trước
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Kéo chuột vuốt trên Desktop
  const handleMouseDown = (e) => {
    if (e.target.closest('button, a, select, input')) return;
    setDragStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseUp = (e) => {
    if (isDragging && dragStartX !== null) {
      const diff = dragStartX - e.clientX;
      if (diff > 45) {
        handleNext();
      } else if (diff < -45) {
        handlePrev();
      }
    }
    setIsDragging(false);
    setDragStartX(null);
  };

  return (
    <div
      className={`hero-spotlight-container ${isDragging ? 'is-dragging' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setDragStartX(null);
      }}
    >
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

      {/* TOP CATEGORY PILLS BAR ON BANNER */}
      {onSelectCategory && (
        <div className="container hero-category-nav-wrap">
          <div className="hero-category-pills">
            {NETFLIX_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`hero-cat-pill-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="container hero-content-wrapper">
        <div className="hero-content-left animate-fade-in" key={`content-${currentMovie.id}`}>
          {/* BADGE ROW */}
          {(badge || currentMovie.country === 'Việt Nam') && (
            <div className="hero-tag-row">
              {badge && (
                <span className={`badge ${badge.className}`}>
                  {badge.icon} {badge.label}
                </span>
              )}
              {currentMovie.country === 'Việt Nam' && (
                <span className="badge badge-masterpiece">🇻🇳 Điện Ảnh Việt Nam</span>
              )}
            </div>
          )}

          {/* TITLES: VIETNAMESE (PRIMARY) + ENGLISH (SUBTITLE) */}
          {(() => {
            const heroTitles = resolveMovieTitles(currentMovie);
            return (
              <>
                <h1 className="hero-main-title">
                  {heroTitles.vietnameseTitle}
                </h1>
                {heroTitles.englishTitle && heroTitles.englishTitle !== heroTitles.vietnameseTitle && (
                  <h2 className="hero-sub-title">{heroTitles.englishTitle}</h2>
                )}
              </>
            );
          })()}

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
            {formatQuickSynopsis(currentMovie.synopsis, 60)}
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
      </div>

      {/* SLIM SWIPE INDICATOR BAR AT BOTTOM */}
      {spotlightList.length > 1 && (
        <div className="container hero-swipe-indicator-wrap">
          <div className="hero-swipe-indicator-bar" title="Vuốt trái / phải để chuyển phim">
            {spotlightList.map((m, idx) => (
              <span
                key={m.id}
                className={`swipe-bar-segment ${idx === currentIndex ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

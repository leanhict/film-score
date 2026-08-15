import React from 'react';
import { calculateUnifiedScore, getMovieBadge, getScoreColor } from '../services/scoreEngine';
import { resolveMovieTitles } from '../utils/movieTitleResolver';
import { Bookmark, Play, Eye, Star, Info } from 'lucide-react';
import './MovieCard.css';

export function MovieCard({
  movie,
  weights,
  onSelectMovie,
  onOpenTrailer,
  isWatchlisted = false,
  onToggleWatchlist,
  isWatched = false,
  onToggleWatched
}) {
  const unifiedScore = calculateUnifiedScore(movie.ratings, weights);
  const badge = getMovieBadge(movie.ratings, movie.id?.includes('gem') || movie.id?.includes('past-lives') || movie.id?.includes('monster'));
  const scoreColor = getScoreColor(unifiedScore);

  return (
    <div className="movie-card glass-panel" onClick={() => onSelectMovie && onSelectMovie(movie)}>
      {/* POSTER & OVERLAY BADGES */}
      <div className="card-media">
        <img
          src={movie.poster}
          alt={movie.vietnameseTitle || movie.title}
          className="card-poster"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
          }}
        />

        <div className="card-gradient-overlay" />

        {/* UNIFIED SCORE FLOATING PILL */}
        <div className="floating-unified-score" style={{ borderColor: scoreColor }}>
          <span className="score-number" style={{ color: scoreColor }}>{unifiedScore}</span>
          <span className="score-label">FilmScore</span>
        </div>

        {/* VIETNAMESE CLASSIFICATION BADGE (Desktop) */}
        {badge && (
          <div className="floating-category-badge desktop-only-badge">
            <span className={`badge ${badge.className}`}>
              <span>{badge.icon}</span> {badge.shortLabel}
            </span>
          </div>
        )}

        {/* QUICK HOVER ACTIONS */}
        <div className="card-hover-actions">
          {movie.trailerUrl && (
            <button
              className="action-circle-btn play-btn"
              title="Xem Trailer"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTrailer && onOpenTrailer(movie);
              }}
            >
              <Play size={18} fill="currentColor" />
            </button>
          )}

          <button
            className={`action-circle-btn bookmark-btn ${isWatchlisted ? 'active' : ''}`}
            title={isWatchlisted ? 'Đã lưu trong danh sách' : 'Lưu vào muốn xem'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist && onToggleWatchlist(movie);
            }}
          >
            <Bookmark size={16} fill={isWatchlisted ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className="card-content">
        <div className="card-meta-top">
          <span className="card-year">{movie.year}</span>
          <span className="meta-dot">•</span>
          <span className="card-runtime">{movie.runtime}</span>

          {badge && (
            <span className={`card-inline-badge ${badge.className}`}>
              {badge.icon} {badge.shortLabel}
            </span>
          )}

          {movie.country === 'Việt Nam' && (
            <>
              <span className="meta-dot">•</span>
              <span className="vietnam-tag">🇻🇳 Việt Nam</span>
            </>
          )}

          {/* Quick Bookmark Button for Mobile */}
          <button
            className={`card-quick-bookmark ${isWatchlisted ? 'active' : ''}`}
            title={isWatchlisted ? 'Đã lưu trong danh sách' : 'Lưu vào muốn xem'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist && onToggleWatchlist(movie);
            }}
          >
            <Bookmark size={13} fill={isWatchlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="card-title-wrap">
          {(() => {
            const cardTitles = resolveMovieTitles(movie);
            return (
              <>
                <h3 className="card-title" title={cardTitles.vietnameseTitle}>
                  {cardTitles.vietnameseTitle}
                </h3>
                {cardTitles.englishTitle && cardTitles.englishTitle !== cardTitles.vietnameseTitle && (
                  <h4 className="card-sub-title">{cardTitles.englishTitle}</h4>
                )}
              </>
            );
          })()}
        </div>

        {/* GENRE TAGS */}
        <div className="card-genres">
          {movie.genres?.slice(0, 3).map((genre, idx) => (
            <span key={idx} className="genre-pill">{genre}</span>
          ))}
        </div>

        {/* 3-SOURCE SCORE MINI STRIP */}
        <div className="card-score-strip">
          {/* IMDb */}
          <div className="source-mini-item" title={`IMDb: ${movie.ratings?.imdb}/10`}>
            <span className="mini-source-name imdb">IMDb</span>
            <span className="mini-score-val">{movie.ratings?.imdb ? movie.ratings.imdb.toFixed(1) : '-'}</span>
          </div>

          {/* RT Critic */}
          <div className="source-mini-item" title={`Rotten Tomatoes Tomatometer: ${movie.ratings?.rtCritics}%`}>
            <span className="mini-source-name rt">🍅 RT</span>
            <span className="mini-score-val">{movie.ratings?.rtCritics ? `${movie.ratings.rtCritics}%` : '-'}</span>
          </div>

          {/* Metascore */}
          <div className="source-mini-item" title={`Metacritic Metascore: ${movie.ratings?.metascore}/100`}>
            <span className="mini-source-name mc">Ⓜ MC</span>
            <span className="mini-score-val">{movie.ratings?.metascore ? movie.ratings.metascore : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

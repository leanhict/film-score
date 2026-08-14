import React, { useState } from 'react';
import { calculateUnifiedScore } from '../services/scoreEngine';
import { ScoreBadge } from './ScoreBadge';
import { Bookmark, Check, Trash2, X, Film, Sparkles, ExternalLink } from 'lucide-react';
import './WatchlistDrawer.css';

export function WatchlistDrawer({
  isOpen,
  onClose,
  watchlist = [],
  weights,
  onRemoveFromWatchlist,
  onSelectMovie,
  onClearWatchlist
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unwatched' | 'watched'
  const [watchedIds, setWatchedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('filmscore_watched_ids') || '[]');
    } catch {
      return [];
    }
  });

  const toggleWatched = (id) => {
    const updated = watchedIds.includes(id)
      ? watchedIds.filter(x => x !== id)
      : [...watchedIds, id];
    setWatchedIds(updated);
    localStorage.setItem('filmscore_watched_ids', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const filteredList = watchlist.filter(m => {
    const isWatched = watchedIds.includes(m.id);
    if (activeTab === 'watched') return isWatched;
    if (activeTab === 'unwatched') return !isWatched;
    return true;
  });

  // Tính điểm trung bình của danh sách
  const avgScore = watchlist.length > 0
    ? Math.round(watchlist.reduce((sum, m) => sum + calculateUnifiedScore(m.ratings, weights), 0) / watchlist.length)
    : 0;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="watchlist-drawer glass-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <Bookmark size={20} className="drawer-icon" />
            <div>
              <h3>Danh Sách Phim Của Bạn</h3>
              <p className="drawer-sub">{watchlist.length} bộ phim đã lưu</p>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* STATS BAR */}
        {watchlist.length > 0 && (
          <div className="drawer-stats-bar">
            <div className="drawer-stat-item">
              <span className="stat-label">Tổng phim đã lưu</span>
              <span className="stat-val">{watchlist.length}</span>
            </div>
            <div className="drawer-stat-divider" />
            <div className="drawer-stat-item">
              <span className="stat-label">Đã xem</span>
              <span className="stat-val">{watchedIds.filter(id => watchlist.some(m => m.id === id)).length}</span>
            </div>
            <div className="drawer-stat-divider" />
            <div className="drawer-stat-item">
              <span className="stat-label">Điểm FilmScore TB</span>
              <span className="stat-val score-highlight">{avgScore}/100</span>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="drawer-tabs">
          <button
            className={`drawer-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả ({watchlist.length})
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'unwatched' ? 'active' : ''}`}
            onClick={() => setActiveTab('unwatched')}
          >
            Chưa xem ({watchlist.filter(m => !watchedIds.includes(m.id)).length})
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'watched' ? 'active' : ''}`}
            onClick={() => setActiveTab('watched')}
          >
            Đã xem ({watchedIds.filter(id => watchlist.some(m => m.id === id)).length})
          </button>
        </div>

        {/* LIST */}
        <div className="drawer-body">
          {filteredList.length === 0 ? (
            <div className="drawer-empty-state">
              <Film size={48} className="empty-icon" />
              <h4>Chưa có bộ phim nào trong danh sách</h4>
              <p>Nhấn biểu tượng dấu trang (Bookmark) ở bất kỳ thẻ phim nào để lưu lại danh sách muốn xem của bạn.</p>
            </div>
          ) : (
            <div className="drawer-movie-list">
              {filteredList.map(movie => {
                const unified = calculateUnifiedScore(movie.ratings, weights);
                const isWatched = watchedIds.includes(movie.id);

                return (
                  <div key={movie.id} className="drawer-movie-item glass-panel" onClick={() => { onSelectMovie(movie); onClose(); }}>
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="drawer-item-poster"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    <div className="drawer-item-info">
                      <h4 className="drawer-item-title">{movie.vietnameseTitle || movie.title}</h4>
                      <div className="drawer-item-meta">
                        <span>{movie.year}</span>
                        <span>•</span>
                        <span>{movie.runtime}</span>
                      </div>

                      <div className="drawer-item-scores">
                        <span className="drawer-unified-pill">{unified} pts</span>
                        <span className="drawer-mini-src imdb">★ {movie.ratings?.imdb || '-'}</span>
                        <span className="drawer-mini-src rt">🍅 {movie.ratings?.rtCritics || '-'}%</span>
                      </div>
                    </div>

                    <div className="drawer-item-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`drawer-action-btn check-btn ${isWatched ? 'active' : ''}`}
                        title={isWatched ? 'Đánh dấu chưa xem' : 'Đánh dấu đã xem'}
                        onClick={() => toggleWatched(movie.id)}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="drawer-action-btn delete-btn"
                        title="Xóa khỏi danh sách"
                        onClick={() => onRemoveFromWatchlist(movie.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {watchlist.length > 0 && (
          <div className="drawer-footer">
            <button className="clear-all-btn" onClick={onClearWatchlist}>
              <Trash2 size={14} /> Xóa toàn bộ danh sách
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

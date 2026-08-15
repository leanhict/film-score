import React, { useState, useRef, useEffect } from 'react';
import { calculateUnifiedScore } from '../services/scoreEngine';
import { matchMovieSearch } from '../utils/searchUtils';
import {
  Film,
  Search,
  Sparkles,
  Bookmark,
  Dices,
  Sliders,
  X,
  ExternalLink,
  Plus
} from 'lucide-react';
import './Navbar.css';

export function Navbar({
  searchQuery,
  onSearchChange,
  allMovies = [],
  weights,
  watchlistCount = 0,
  onOpenAISearch,
  onOpenRandomPicker,
  onOpenSettings,
  onOpenWatchlist,
  onSelectMovie,
  onResetHome
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // Lọc kết quả tìm kiếm tức thì với hỗ trợ tiếng Việt có dấu/không dấu
  const filteredSuggestions = searchQuery.trim()
    ? allMovies.filter(m => matchMovieSearch(m, searchQuery)).slice(0, 5)
    : [];

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="navbar-container">
      <div className="container navbar-inner">
        {/* LOGO */}
        <div
          className="navbar-brand"
          onClick={() => {
            if (onResetHome) {
              onResetHome();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          title="Quay về trang chủ mặc định"
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-icon-wrap">
            <Film size={22} className="brand-film-icon" />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Film<span>Score</span>
            </div>
            <span className="brand-tagline">IMDb • RT • Metacritic</span>
          </div>
        </div>

        {/* SEARCH BAR WITH AI TRIGGER DROPDOWN */}
        <div className="navbar-search-wrapper" ref={searchRef}>
          <div className="navbar-search-box">
            <Search size={17} className="nav-search-icon" />
            <input
              type="text"
              placeholder="Tìm phim, đạo diễn, tra cứu AI..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  if (filteredSuggestions.length === 1) {
                    onSelectMovie(filteredSuggestions[0]);
                    setIsDropdownOpen(false);
                  } else if (filteredSuggestions.length === 0) {
                    onOpenAISearch(searchQuery);
                    setIsDropdownOpen(false);
                  }
                }
              }}
              className="nav-search-input"
            />
            {searchQuery && (
              <button
                className="nav-clear-search-btn"
                onClick={() => {
                  onSearchChange('');
                  setIsDropdownOpen(false);
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* SEARCH AUTOCOMPLETE DROPDOWN (Chỉ hiện khi có phim trùng khớp trong kho) */}
          {isDropdownOpen && searchQuery.trim().length > 0 && filteredSuggestions.length > 0 && (
            <div className="search-dropdown-menu glass-modal animate-fade-in">
              <div className="dropdown-local-results">
                <span className="dropdown-section-label">Phim có sẵn trong kho:</span>
                {filteredSuggestions.map(movie => {
                  const score = calculateUnifiedScore(movie.ratings, weights);
                  return (
                    <div
                      key={movie.id}
                      className="dropdown-movie-row"
                      onClick={() => {
                        onSelectMovie(movie);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="dropdown-poster"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="dropdown-info">
                        <h4 className="dropdown-title">{movie.vietnameseTitle || movie.title}</h4>
                        <span className="dropdown-meta">{movie.year} • {movie.director}</span>
                      </div>
                      <div className="dropdown-score-pill">
                        {score} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* NAV ACTIONS */}
        <div className="navbar-actions">
          {/* AI SEARCH BUTTON */}
          <button
            className="nav-btn nav-btn-ai"
            onClick={() => onOpenAISearch(searchQuery)}
            title="Tra cứu phim bất kỳ với Gemini AI"
          >
            <Sparkles size={16} />
            <span className="nav-btn-text">Tra cứu AI</span>
          </button>

          {/* RANDOM PICKER BUTTON */}
          <button
            className="nav-btn nav-btn-random"
            onClick={onOpenRandomPicker}
            title="Vòng quay gợi ý phim ngẫu nhiên"
          >
            <Dices size={16} />
            <span className="nav-btn-text">Tối nay xem gì?</span>
          </button>

          {/* WATCHLIST BUTTON */}
          <button
            className="nav-btn nav-btn-watchlist"
            onClick={onOpenWatchlist}
            title="Danh sách muốn xem / đã xem"
          >
            <Bookmark size={16} />
            <span className="nav-btn-text">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="watchlist-badge-count">{watchlistCount}</span>
            )}
          </button>

          {/* SETTINGS / WEIGHTS BUTTON */}
          <button
            className="nav-btn-icon"
            onClick={onOpenSettings}
            title="Cài đặt trọng số điểm & Gemini API Key"
          >
            <Sliders size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { calculateUnifiedScore } from '../services/scoreEngine';
import { matchMovieSearch, parseYearToNumber, calculateRelevance } from '../utils/searchUtils';
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
  onResetHome,
  onOpenWeights,
  onRandomPick
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Lọc kết quả tìm kiếm tức thì: ưu tiên phim trùng tên nhất lên đầu
  const filteredSuggestions = searchQuery.trim()
    ? allMovies
        .filter(m => matchMovieSearch(m, searchQuery))
        .sort((a, b) => {
          const scoreA = calculateRelevance(a, searchQuery);
          const scoreB = calculateRelevance(b, searchQuery);
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          return (parseYearToNumber(b.year) - parseYearToNumber(a.year));
        })
        .slice(0, 5)
    : [];

  // Reset index được chọn khi từ khóa thay đổi
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

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

  // Xử lý khi nhấn nút Tìm kiếm hoặc bấm Enter: Mặc định tra cứu với Gemini AI
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Đóng dropdown gợi ý
    setIsDropdownOpen(false);
    
    // Blur ô nhập liệu để ẩn bàn phím ảo di động
    if (inputRef.current) {
      inputRef.current.blur();
    }

    // Mặc định: Kích hoạt tìm kiếm chuyên sâu với AI
    onOpenAISearch(query);
  };

  // Điều hướng bằng bàn phím
  const handleKeyDown = (e) => {
    if (!searchQuery.trim()) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isDropdownOpen) {
        setIsDropdownOpen(true);
        return;
      }
      if (filteredSuggestions.length > 0) {
        setSelectedIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Nếu người dùng chủ động điều hướng mũi tên và chọn 1 gợi ý phim cụ thể
      if (isDropdownOpen && selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        onSelectMovie(filteredSuggestions[selectedIndex]);
        setIsDropdownOpen(false);
      } else {
        // Mặc định khi bấm Enter: Sử dụng tìm kiếm với AI
        handleSearchSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
    }
  };

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
          <form className="navbar-search-box" onSubmit={handleSearchSubmit}>
            <button
              type="submit"
              className="nav-search-btn"
              title="Bấm để tra cứu phim với AI (Enter)"
              aria-label="Tra cứu phim với AI"
            >
              <Search size={16} />
            </button>
            <input
              ref={inputRef}
              type="text"
              placeholder="Tìm phim, đạo diễn... (Enter để tra cứu AI)"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setIsDropdownOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
              className="nav-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="nav-clear-search-btn"
                onClick={() => {
                  onSearchChange('');
                  setIsDropdownOpen(false);
                  setSelectedIndex(-1);
                  if (inputRef.current) inputRef.current.focus();
                }}
                title="Xóa từ khóa"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* SEARCH AUTOCOMPLETE DROPDOWN */}
          {isDropdownOpen && searchQuery.trim().length > 0 && (
            <div className="search-dropdown-menu glass-modal animate-fade-in">
              {filteredSuggestions.length > 0 ? (
                <div className="dropdown-local-results">
                  <div className="dropdown-header-row">
                    <span className="dropdown-section-label">Gợi ý phim có sẵn:</span>
                  </div>
                  {filteredSuggestions.map((movie, index) => {
                    const score = calculateUnifiedScore(movie.ratings, weights);
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={movie.id}
                        className={`dropdown-movie-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          onSelectMovie(movie);
                          setIsDropdownOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
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

                  {/* NÚT TRA CỨU AI NGAY DƯỚI GỢI Ý CÓ SẴN */}
                  <div
                    className="dropdown-ai-footer"
                    onClick={() => {
                      onOpenAISearch(searchQuery);
                      setIsDropdownOpen(false);
                    }}
                    title="Bấm để tra cứu thông tin phim chi tiết với Gemini AI"
                  >
                    <div className="dropdown-ai-footer-left">
                      <div className="ai-footer-icon-wrap">
                        <Sparkles size={14} />
                      </div>
                      <div className="dropdown-ai-footer-text">
                        <span className="ai-footer-main">Tra cứu <strong>"{searchQuery}"</strong> với AI</span>
                        <span className="dropdown-ai-footer-sub">Tìm kiếm đa nguồn & tóm tắt tiếng Việt</span>
                      </div>
                    </div>
                    <div className="dropdown-ai-enter-badge">
                      <span>Enter</span> ↵
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="dropdown-ai-search-prompt"
                  onClick={() => {
                    onOpenAISearch(searchQuery);
                    setIsDropdownOpen(false);
                  }}
                >
                  <div className="ai-prompt-icon">
                    <Sparkles size={18} />
                  </div>
                  <div className="ai-prompt-info">
                    <div className="ai-prompt-title">
                      Tra cứu <strong>"{searchQuery}"</strong> với AI
                    </div>
                    <span className="ai-prompt-sub">Không có trong danh sách hiện tại • Tra cứu tự động với Gemini</span>
                  </div>
                  <div className="dropdown-ai-enter-badge">
                    <span>Enter</span> ↵
                  </div>
                </div>
              )}
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

          {/* AI SEARCH ICON - MOBILE ONLY */}
          <button
            className="nav-btn-icon nav-btn-icon-ai mobile-ai-btn"
            onClick={() => onOpenAISearch(searchQuery)}
            title="Tra cứu phim bất kỳ với Gemini AI"
          >
            <Sparkles size={18} />
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

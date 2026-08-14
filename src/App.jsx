import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_MOVIES } from './data/mockMovies';
import { DEFAULT_WEIGHTS, calculateUnifiedScore, getMovieBadge } from './services/scoreEngine';
import { Navbar } from './components/Navbar';
import { HeroSpotlight } from './components/HeroSpotlight';
import { FiltersBar } from './components/FiltersBar';
import { MovieCard } from './components/MovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { TrailerModal } from './components/TrailerModal';
import { AISearchSection } from './components/AISearchSection';
import { WeightSettingsModal } from './components/WeightSettingsModal';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { RandomPickerModal } from './components/RandomPickerModal';
import { Sparkles, Film, Award, TrendingUp, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';
import './App.css';

export function App() {
  // 1. STATE QUẢN LÝ DỮ LIỆU
  const [movies, setMovies] = useState(() => {
    try {
      const saved = localStorage.getItem('filmscore_custom_movies');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Hợp nhất mock movies và custom movies do AI tìm kiếm
        const ids = new Set(parsed.map(m => m.id));
        const combined = [...parsed, ...MOCK_MOVIES.filter(m => !ids.has(m.id))];
        return combined;
      }
    } catch (e) {
      console.error(e);
    }
    return MOCK_MOVIES;
  });

  const [weights, setWeights] = useState(() => {
    try {
      const saved = localStorage.getItem('filmscore_user_weights');
      return saved ? JSON.parse(saved) : DEFAULT_WEIGHTS;
    } catch {
      return DEFAULT_WEIGHTS;
    }
  });

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('filmscore_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. STATE BỘ LỌC & TÌM KIẾM
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('unified_desc');
  const [hasAIResult, setHasAIResult] = useState(false);
  const [aiSearchTrigger, setAiSearchTrigger] = useState(null);

  // 3. STATE MODALS
  const [selectedDetailMovie, setSelectedDetailMovie] = useState(null);
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

  // Lưu weights vào LocalStorage khi thay đổi
  const handleUpdateWeights = (newWeights) => {
    setWeights(newWeights);
    localStorage.setItem('filmscore_user_weights', JSON.stringify(newWeights));
  };

  // Toggle Watchlist
  const handleToggleWatchlist = (movie) => {
    setWatchlist(prev => {
      const exists = prev.some(m => m.id === movie.id);
      let updated;
      if (exists) {
        updated = prev.filter(m => m.id !== movie.id);
      } else {
        updated = [movie, ...prev];
      }
      localStorage.setItem('filmscore_watchlist', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveFromWatchlist = (movieId) => {
    setWatchlist(prev => {
      const updated = prev.filter(m => m.id !== movieId);
      localStorage.setItem('filmscore_watchlist', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearWatchlist = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách Watchlist?')) {
      setWatchlist([]);
      localStorage.removeItem('filmscore_watchlist');
    }
  };

  // Thêm phim mới do AI tra cứu vào kho
  const handleAddMovieFromAI = (newMovie) => {
    setMovies(prev => {
      const updated = [newMovie, ...prev.filter(m => m.id !== newMovie.id)];
      try {
        localStorage.setItem('filmscore_custom_movies', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setSelectedDetailMovie(newMovie);
  };

  // Đặt lại toàn bộ về trạng thái trang chủ mặc định
  const handleResetHome = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setSelectedGenre('all');
    setMinScore(0);
    setSortBy('unified_desc');
    setHasAIResult(false);
    setAiSearchTrigger(null);
    setSelectedDetailMovie(null);
    setTrailerMovie(null);
    setIsRandomPickerOpen(false);
    setIsSettingsOpen(false);
    setIsWatchlistOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mở & KÍCH HOẠT CHẠY NGAY TRÌNH TRA CỨU AI TRÊN TRANG
  const handleOpenAISearch = (query = '') => {
    const clean = query.trim();
    if (clean) {
      setAiSearchTrigger({ query: clean, timestamp: Date.now() });
      setHasAIResult(true);
    }
    setTimeout(() => {
      const el = document.getElementById('ai-search-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Danh sách thể loại tổng hợp từ tất cả các phim
  const genres = useMemo(() => {
    const set = new Set();
    movies.forEach(m => {
      m.genres?.forEach(g => set.add(g));
    });
    return Array.from(set).sort();
  }, [movies]);

  // XỬ LÝ LỌC & SẮP XẾP PHIM
  const filteredAndSortedMovies = useMemo(() => {
    return movies.filter(movie => {
      const score = calculateUnifiedScore(movie.ratings, weights);
      const badge = getMovieBadge(movie.ratings);

      // Tìm kiếm từ khóa (chỉ áp dụng lọc cục bộ nếu không chạy AI Search hoặc có phim trùng khớp)
      if (!hasAIResult && !aiSearchTrigger && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = movie.title?.toLowerCase().includes(q);
        const matchViTitle = movie.vietnameseTitle?.toLowerCase().includes(q);
        const matchDirector = movie.director?.toLowerCase().includes(q);
        const matchCast = movie.cast?.some(actor => actor.toLowerCase().includes(q));
        if (!matchTitle && !matchViTitle && !matchDirector && !matchCast) {
          return false;
        }
      }

      // Lọc Thể loại
      if (selectedGenre !== 'all' && !movie.genres?.includes(selectedGenre)) {
        return false;
      }

      // Lọc Điểm tối thiểu
      if (minScore > 0 && score < minScore) {
        return false;
      }

      // Lọc Phân loại (Category)
      if (activeCategory === 'vietnam') {
        return movie.country === 'Việt Nam';
      }
      if (activeCategory === 'masterpiece') {
        return score >= 85 || badge?.key === 'masterpiece';
      }
      if (activeCategory === 'critic_darling') {
        return badge?.key === 'critic_darling';
      }
      if (activeCategory === 'audience_favorite') {
        return badge?.key === 'audience_favorite';
      }
      if (activeCategory === 'polarizing') {
        return badge?.key === 'polarizing';
      }
      if (activeCategory === 'hidden_gem') {
        return badge?.key === 'hidden_gem' || movie.id?.includes('gem') || movie.id?.includes('past-lives');
      }
      if (activeCategory === 'guilty_pleasure') {
        return badge?.key === 'guilty_pleasure';
      }

      return true;
    }).sort((a, b) => {
      const scoreA = calculateUnifiedScore(a.ratings, weights);
      const scoreB = calculateUnifiedScore(b.ratings, weights);

      if (sortBy === 'unified_desc') return scoreB - scoreA;
      if (sortBy === 'imdb_desc') return (b.ratings?.imdb || 0) - (a.ratings?.imdb || 0);
      if (sortBy === 'rt_desc') return (b.ratings?.rtCritics || 0) - (a.ratings?.rtCritics || 0);
      if (sortBy === 'metascore_desc') return (b.ratings?.metascore || 0) - (a.ratings?.metascore || 0);
      if (sortBy === 'year_desc') return (b.year || 0) - (a.year || 0);
      return 0;
    });
  }, [movies, searchQuery, activeCategory, selectedGenre, minScore, sortBy, weights, hasAIResult, aiSearchTrigger]);

  return (
    <div className="film-score-app">
      {/* NAVBAR */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allMovies={movies}
        weights={weights}
        watchlistCount={watchlist.length}
        onOpenAISearch={handleOpenAISearch}
        onOpenRandomPicker={() => setIsRandomPickerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onSelectMovie={setSelectedDetailMovie}
        onResetHome={handleResetHome}
      />

      {/* HERO SPOTLIGHT: Tạm thời ẩn khi có kết quả tra cứu AI để tạo không gian thoáng đãng */}
      {!hasAIResult && (
        <HeroSpotlight
          movies={movies}
          weights={weights}
          onSelectMovie={setSelectedDetailMovie}
          onOpenTrailer={setTrailerMovie}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="container main-content">
        {/* BANNER THÔNG TIN ĐIỂM SỐ CHUẨN HÓA: Ẩn khi đang có kết quả AI */}
        {!hasAIResult && (
          <div className="methodology-banner glass-panel">
            <div className="methodology-item">
              <span className="source-pill imdb-pill">★ IMDb</span>
              <p>Thước đo phản ứng của <strong>cộng đồng khán giả toàn cầu</strong></p>
            </div>
            <div className="methodology-divider" />
            <div className="methodology-item">
              <span className="source-pill rt-pill">🍅 Rotten Tomatoes</span>
              <p>Tỷ lệ đồng thuận từ <strong>giới phê bình & khán giả rạp</strong></p>
            </div>
            <div className="methodology-divider" />
            <div className="methodology-item">
              <span className="source-pill mc-pill">Ⓜ Metacritic</span>
              <p>Trọng số học thuật từ <strong>các nhà phê bình báo chí uy tín nhất</strong></p>
            </div>
          </div>
        )}

        {/* KHU VỰC TRA CỨU AI ĐA NGUỒN TRỰC TIẾP TRÊN TRANG */}
        <AISearchSection
          searchQuery={searchQuery}
          aiSearchTrigger={aiSearchTrigger}
          onAddMovieToLibrary={handleAddMovieFromAI}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onResultStateChange={setHasAIResult}
          weights={weights}
        />

        {/* BỘ LỌC & TÌM KIẾM CỤC BỘ */}
        <FiltersBar
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          genres={genres}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          minScore={minScore}
          onMinScoreChange={setMinScore}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onResetFilters={() => {
            setActiveCategory('all');
            setSelectedGenre('all');
            setMinScore(0);
            setSortBy('unified_desc');
            setSearchQuery('');
          }}
          totalResults={filteredAndSortedMovies.length}
        />

        {/* DANH SÁCH THẺ PHIM (GRID) */}
        {filteredAndSortedMovies.length > 0 ? (
          <div className="movies-grid">
            {filteredAndSortedMovies.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                weights={weights}
                onSelectMovie={setSelectedDetailMovie}
                onOpenTrailer={setTrailerMovie}
                isWatchlisted={watchlist.some(m => m.id === movie.id)}
                onToggleWatchlist={handleToggleWatchlist}
              />
            ))}
          </div>
        ) : (
          /* TRƯỜNG HỢP BỘ LỌC KHÔNG CÓ PHIM PHÙ HỢP */
          <div className="empty-category-notice glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '12px', margin: '20px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Không có tác phẩm nào phù hợp với bộ lọc đã chọn.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSelectedGenre('all');
                setMinScore(0);
                setSearchQuery('');
              }}
              style={{ marginTop: '12px', padding: '8px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="footer-container">
        <div className="container footer-inner">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <Film size={20} className="footer-icon" />
              <span>FilmScore Hub</span>
            </div>
            <p className="footer-tagline">
              Nền tảng đánh giá điện ảnh toàn diện tổng hợp điểm số từ IMDb, Rotten Tomatoes và Metacritic. Tích hợp công nghệ Gemini AI tra cứu thời gian thực.
            </p>
          </div>

          <div className="footer-meta-col">
            <div className="footer-badge">
              <ShieldCheck size={16} /> 100% Giao diện & Dữ liệu Việt hóa
            </div>
            <div className="footer-sources">
              Dữ liệu đối chiếu từ: IMDb • Rotten Tomatoes • Metacritic • Google Gemini AI
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {selectedDetailMovie && (
        <MovieDetailModal
          movie={selectedDetailMovie}
          weights={weights}
          onClose={() => setSelectedDetailMovie(null)}
          onOpenTrailer={setTrailerMovie}
          isWatchlisted={watchlist.some(m => m.id === selectedDetailMovie.id)}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {trailerMovie && (
        <TrailerModal
          movie={trailerMovie}
          onClose={() => setTrailerMovie(null)}
        />
      )}

      <WeightSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        weights={weights}
        onUpdateWeights={handleUpdateWeights}
      />

      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        weights={weights}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        onSelectMovie={setSelectedDetailMovie}
        onClearWatchlist={handleClearWatchlist}
      />

      <RandomPickerModal
        isOpen={isRandomPickerOpen}
        onClose={() => setIsRandomPickerOpen(false)}
        movies={movies}
        weights={weights}
        onSelectMovie={setSelectedDetailMovie}
        onOpenTrailer={setTrailerMovie}
      />
    </div>
  );
}

export default App;

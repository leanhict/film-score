import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_MOVIES } from './data/mockMovies';
import { DEFAULT_WEIGHTS, calculateUnifiedScore, getMovieBadge } from './services/scoreEngine';
import { matchMovieSearch, parseYearToNumber } from './utils/searchUtils';
import { fetchLiveNetflixCategory, NETFLIX_CATEGORIES } from './services/netflixCatalogService';
import { Navbar } from './components/Navbar';
import { HeroSpotlight } from './components/HeroSpotlight';
import { FiltersBar } from './components/FiltersBar';
import { MovieCard } from './components/MovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { TrailerModal } from './components/TrailerModal';
import { AISearchModal } from './components/AISearchModal';
import { WeightSettingsModal } from './components/WeightSettingsModal';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { RandomPickerModal } from './components/RandomPickerModal';
import { Sparkles, Film, Award, TrendingUp, AlertTriangle, ShieldCheck, Heart, Loader2 } from 'lucide-react';
import './App.css';

export function App() {
  // 1. STATE QUẢN LÝ DỮ LIỆU
  const [movies, setMovies] = useState(() => {
    try {
      const saved = localStorage.getItem('filmscore_netflix_cat_netflix_trending');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return MOCK_MOVIES;
  });

  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

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

  // 2. STATE BỘ LỌC & TÌM KIẾM THEO NETFLIX
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('netflix_trending');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('unified_desc');
  const [isAISearchModalOpen, setIsAISearchModalOpen] = useState(false);
  const [aiModalQuery, setAiModalQuery] = useState('');

  // 3. STATE MODALS
  const [selectedDetailMovie, setSelectedDetailMovie] = useState(null);
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

  // Tự động tải 20-30 phim thời gian thực cho danh mục Netflix được chọn
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCategory(true);

    fetchLiveNetflixCategory(activeCategory)
      .then(liveList => {
        if (isMounted && Array.isArray(liveList) && liveList.length > 0) {
          setMovies(liveList);
        }
      })
      .catch(err => {
        console.error('Lỗi khi tải danh mục Netflix:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

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
    setActiveCategory('netflix_trending');
    setSelectedGenre('all');
    setMinScore(0);
    setSortBy('unified_desc');
    setIsAISearchModalOpen(false);
    setAiModalQuery('');
    setSelectedDetailMovie(null);
    setTrailerMovie(null);
    setIsRandomPickerOpen(false);
    setIsSettingsOpen(false);
    setIsWatchlistOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mở trình tra cứu AI dạng Modal
  const handleOpenAISearch = (query = '') => {
    const clean = query.trim();
    setAiModalQuery(clean || searchQuery || '');
    setIsAISearchModalOpen(true);
  };

  // Danh sách thể loại tổng hợp từ tất cả các phim trong danh mục hiện tại
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

      // Tìm kiếm từ khóa (Hỗ trợ tiếng Việt có dấu, không dấu, tên dịch chuẩn)
      if (searchQuery.trim()) {
        if (!matchMovieSearch(movie, searchQuery)) {
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

      return true;
    }).sort((a, b) => {
      const scoreA = calculateUnifiedScore(a.ratings, weights);
      const scoreB = calculateUnifiedScore(b.ratings, weights);

      if (sortBy === 'unified_desc') return scoreB - scoreA;
      if (sortBy === 'imdb_desc') return (b.ratings?.imdb || 0) - (a.ratings?.imdb || 0);
      if (sortBy === 'rt_desc') return (b.ratings?.rtCritics || 0) - (a.ratings?.rtCritics || 0);
      if (sortBy === 'metascore_desc') return (b.ratings?.metascore || 0) - (a.ratings?.metascore || 0);
      if (sortBy === 'year_desc') return parseYearToNumber(b.year) - parseYearToNumber(a.year);
      return 0;
    });
  }, [movies, searchQuery, selectedGenre, minScore, sortBy, weights]);

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

      {/* HERO SPOTLIGHT */}
      <HeroSpotlight
        movies={movies}
        weights={weights}
        onSelectMovie={setSelectedDetailMovie}
        onOpenTrailer={setTrailerMovie}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* MAIN CONTENT AREA */}
      <main className="container main-content">
        {/* BỘ LỌC DANH MỤC NETFLIX THỜI GIAN THỰC */}
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
            setActiveCategory('netflix_trending');
            setSelectedGenre('all');
            setMinScore(0);
            setSortBy('unified_desc');
            setSearchQuery('');
          }}
          totalResults={filteredAndSortedMovies.length}
          isLoadingCategory={isLoadingCategory}
        />

        {/* DANH SÁCH THẺ PHIM NETFLIX REAL-TIME (GRID) */}
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
              {isLoadingCategory ? 'Đang tải danh sách phim Netflix thời gian thực...' : 'Không có tác phẩm nào phù hợp với bộ lọc đã chọn.'}
            </p>
            <button
              onClick={() => {
                setActiveCategory('netflix_trending');
                setSelectedGenre('all');
                setMinScore(0);
                setSearchQuery('');
              }}
              style={{ marginTop: '12px', padding: '8px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Đặt lại bộ lọc mặc định
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="footer-section">
        <div className="container footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-gradient">FilmScore</span>
              <span className="footer-tagline">Netflix Real-time Edition</span>
            </div>
            <p className="footer-desc">
              Hệ thống tổng hợp & đối chiếu điểm số điện ảnh đa nguồn thời gian thực từ IMDb, Rotten Tomatoes và Metacritic kết hợp danh mục Netflix Live.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-credit">
              Designed &amp; Developed by <span className="author-name">Lê Anh</span>
            </div>
            <span className="footer-copy">© 2026 FilmScore Hub • Cập nhật dữ liệu thời gian thực.</span>
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

      <AISearchModal
        isOpen={isAISearchModalOpen}
        onClose={() => setIsAISearchModalOpen(false)}
        initialQuery={aiModalQuery}
        onAddMovieToLibrary={handleAddMovieFromAI}
        onOpenSettings={() => {
          setIsAISearchModalOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {isSettingsOpen && (
        <WeightSettingsModal
          weights={weights}
          onSave={handleUpdateWeights}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        weights={weights}
        onSelectMovie={(movie) => {
          setIsWatchlistOpen(false);
          setSelectedDetailMovie(movie);
        }}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        onClearWatchlist={handleClearWatchlist}
      />

      {isRandomPickerOpen && (
        <RandomPickerModal
          movies={filteredAndSortedMovies.length > 0 ? filteredAndSortedMovies : movies}
          weights={weights}
          onClose={() => setIsRandomPickerOpen(false)}
          onSelectMovie={(movie) => {
            setIsRandomPickerOpen(false);
            setSelectedDetailMovie(movie);
          }}
        />
      )}
    </div>
  );
}

export default App;

import React from 'react';
import { ArrowUpDown, X, Sparkles, Flame } from 'lucide-react';
import { NETFLIX_CATEGORIES } from '../services/netflixCatalogService';
import './FiltersBar.css';

export const CATEGORIES = NETFLIX_CATEGORIES;

export const SORT_OPTIONS = [
  { id: 'unified_desc', label: '🏆 FilmScore cao nhất' },
  { id: 'imdb_desc', label: '⭐ Điểm IMDb cao nhất' },
  { id: 'rt_desc', label: '🍅 Rotten Tomatoes cao nhất' },
  { id: 'metascore_desc', label: 'Ⓜ Metascore cao nhất' },
  { id: 'year_desc', label: '📅 Năm phát hành mới nhất' },
];

export function FiltersBar({
  activeCategory,
  onSelectCategory,
  genres = [],
  selectedGenre,
  onSelectGenre,
  minScore,
  onMinScoreChange,
  sortBy,
  onSortChange,
  onResetFilters,
  totalResults,
  isLoadingCategory = false
}) {
  const isFiltered = activeCategory !== 'netflix_trending' || selectedGenre !== 'all' || minScore > 0 || sortBy !== 'unified_desc';

  return (
    <div className="filters-bar-container">
      {/* SECONDARY FILTER CONTROLS */}
      <div className="filter-controls-row">
        <div className="results-count-wrap">
          <span className="results-count">
            {isLoadingCategory ? (
              <span className="loading-cat-text">Đang cập nhật thời gian thực...</span>
            ) : (
              <>Hiển thị <strong>{totalResults}</strong> tác phẩm Netflix</>
            )}
          </span>
        </div>

        <div className="filter-selects-group">
          {/* GENRE SELECT */}
          <div className="filter-select-item">
            <select
              value={selectedGenre}
              onChange={(e) => onSelectGenre(e.target.value)}
              className="filter-dropdown"
            >
              <option value="all">Tất cả thể loại</option>
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* MIN SCORE SLIDER */}
          <div className="filter-score-slider-wrap" title={`Lọc phim có Unified Score ≥ ${minScore}đ`}>
            <span className="slider-label">Điểm ≥ {minScore > 0 ? `${minScore}đ` : 'Tất cả'}</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => onMinScoreChange(Number(e.target.value))}
              className="filter-score-slider"
            />
          </div>

          {/* SORT DROPDOWN */}
          <div className="filter-select-item sort-item">
            <ArrowUpDown size={14} className="sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="filter-dropdown"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* RESET BUTTON */}
          {isFiltered && (
            <button className="reset-filter-btn" onClick={onResetFilters} title="Xóa tất cả bộ lọc">
              <X size={14} /> Xóa lọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

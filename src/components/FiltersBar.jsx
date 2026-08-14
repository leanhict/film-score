import React from 'react';
import { Filter, ArrowUpDown, X, Sparkles } from 'lucide-react';
import './FiltersBar.css';

export const CATEGORIES = [
  { id: 'all', label: 'Tất Cả Phim', icon: '🎬' },
  { id: 'masterpiece', label: 'Kiệt Tác (≥ 85đ)', icon: '👑' },
  { id: 'vietnam', label: 'Phim Việt Nam', icon: '🇻🇳' },
  { id: 'critic_darling', label: 'Phê Bình Ca Ngợi', icon: '🎭' },
  { id: 'audience_favorite', label: 'Khán Giả Mê', icon: '🍿' },
  { id: 'polarizing', label: 'Gây Tranh Cãi', icon: '⚡' },
  { id: 'hidden_gem', label: 'Hạt Ngọc Ẩn', icon: '💎' },
  { id: 'guilty_pleasure', label: 'Xem Giải Trí', icon: '🎉' },
];

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
  totalResults
}) {
  const isFiltered = activeCategory !== 'all' || selectedGenre !== 'all' || minScore > 0 || sortBy !== 'unified_desc';

  return (
    <div className="filters-bar-container">
      {/* CATEGORY PILLS SCROLLABLE */}
      <div className="category-pills-row">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`cat-pill-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span className="cat-icon">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* SECONDARY FILTER CONTROLS */}
      <div className="filter-controls-row">
        <div className="results-count-wrap">
          <span className="results-count">
            Hiển thị <strong>{totalResults}</strong> tác phẩm
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
          <div className="filter-select-item">
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

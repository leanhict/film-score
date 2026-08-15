import React, { useState, useEffect, useMemo } from 'react';
import { searchMovieWithGemini, loadCandidateDetails, getStoredGeminiKey } from '../services/geminiService';
import { ScoreBadge } from './ScoreBadge';
import { calculateUnifiedScore, getMovieBadge } from '../services/scoreEngine';
import { resolveMovieTitles } from '../utils/movieTitleResolver';
import { AudioPlotReader } from './AudioPlotReader';
import { formatQuickSynopsis, formatFilmReview, parseYearToNumber } from '../utils/searchUtils';
import {
  Sparkles,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Key,
  Plus,
  Layers,
  Check,
  Star,
  Film
} from 'lucide-react';
import './AISearchModal.css';

const SEARCH_SUGGESTIONS = [
  'Disclosure Day (2026)',
  'The Last House (2026)',
  'Mai (2024)',
  'Đào, Phở và Piano',
  'Lật Mặt 7',
  'Werewolves (2024)',
  'Deadpool & Wolverine',
  'Inside Out 2',
  'Dune: Part Two',
  'Alien: Romulus'
];

export function AISearchModal({
  isOpen,
  onClose,
  initialQuery = '',
  onAddMovieToLibrary,
  onOpenSettings
}) {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasKey(!!getStoredGeminiKey());
      if (initialQuery) {
        setQuery(initialQuery);
        handleSearch(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

  const searchSteps = [
    '🔍 Đang kết nối nguồn dữ liệu IMDb & tìm các bản phát hành...',
    '🍅 Đang trích xuất Tomatometer & Popcornmeter từ Rotten Tomatoes...',
    'Ⓜ Đang phân tích chỉ số phê bình Metascore từ Metacritic...',
    '✨ Trí tuệ nhân tạo Gemini đang tổng hợp & biên dịch tiếng Việt...'
  ];

  const handleSearch = async (targetQuery = query) => {
    const q = targetQuery.trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < searchSteps.length - 1 ? prev + 1 : prev));
    }, 400);

    try {
      const result = await searchMovieWithGemini(q);
      clearInterval(stepInterval);
      setCurrentStep(searchSteps.length - 1);
      setSearchResult(result);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Không thể tra cứu phim với Gemini AI lúc này.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = async (cand) => {
    if (!cand.imdbID || cand.imdbID === searchResult?.id) return;
    setIsSwitching(true);
    try {
      const details = await loadCandidateDetails(cand.imdbID);
      setSearchResult(prev => ({
        ...details,
        candidates: prev.candidates || []
      }));
    } catch (err) {
      console.error('Lỗi khi tải chi tiết ứng viên:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleImport = () => {
    if (searchResult && onAddMovieToLibrary) {
      onAddMovieToLibrary(searchResult);
      onClose();
    }
  };

  // Lọc và sắp xếp các candidate đủ chất lượng hiển thị theo NĂM SẢN XUẤT GIẢM DẦN (mới nhất lên đầu)
  const sortedCandidates = useMemo(() => {
    const rawList = searchResult?.candidates || [];
    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    const valid = rawList.filter(cand => {
      const hasPoster = !!cand.poster;
      const hasCast = !!(cand.cast && cand.cast.trim());
      const hasRating = !!(cand.imdbRating);
      return hasPoster || hasCast || hasRating;
    });

    return [...valid].sort((a, b) => {
      const yA = parseYearToNumber(a.year);
      const yB = parseYearToNumber(b.year);
      if (yB !== yA) {
        return yB - yA; // Năm mới nhất lên đầu (giảm dần)
      }
      const rA = parseFloat(a.imdbRating) || 0;
      const rB = parseFloat(b.imdbRating) || 0;
      return rB - rA;
    });
  }, [searchResult?.candidates]);

  if (!isOpen) return null;

  const isShowingResults = searchResult || isLoading || error;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ai-search-modal glass-modal" onClick={(e) => e.stopPropagation()}>
        {/* SLIM TOPBAR KHI ĐÃ CÓ KẾT QUẢ / ĐANG TÌM KIẾM (LOẠI BỎ KHỐI BANNER LỚN ẢNH 1) */}
        {isShowingResults ? (
          <div className="ai-modal-topbar">
            <div className="ai-modal-query-pill">
              <Sparkles size={16} className="ai-sparkle-pill-icon" />
              <span className="ai-modal-query-text">
                <strong>"{query}"</strong>
              </span>
            </div>

            <div className="ai-modal-topbar-actions">
              <button
                className="ai-re-search-btn"
                onClick={() => {
                  setSearchResult(null);
                  setError(null);
                }}
                title="Nhập tên phim khác để tra cứu"
              >
                <Search size={14} /> <span>Tìm phim khác</span>
              </button>
              <button className="ai-modal-close-icon-btn" onClick={onClose} title="Đóng">✕</button>
            </div>
          </div>
        ) : (
          /* HEADER & SEARCH FORM BAN ĐẦU KHI CHƯA GÕ TÌM KIẾM */
          <div className="ai-initial-search-container">
            <div className="ai-header">
              <div className="ai-header-title-wrap">
                <div className="ai-gemini-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3>Tra Cứu Phim Đa Nguồn Với Gemini AI</h3>
                  <p className="ai-header-sub">
                    Tự động tìm kiếm thời gian thực điểm số từ IMDb, Rotten Tomatoes & Metacritic
                  </p>
                </div>
              </div>
              <button className="ai-close-btn" onClick={onClose}>✕</button>
            </div>

            {/* SEARCH INPUT BAR */}
            <div className="ai-search-form">
              <div className="ai-input-wrap">
                <Search className="ai-search-icon" size={18} />
                <input
                  type="text"
                  className="ai-input"
                  placeholder="Nhập tên bất kỳ bộ phim nào (ví dụ: Disclosure Day, Mai, Dune 2...)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <button
                className="ai-submit-btn"
                onClick={() => handleSearch()}
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="spin-icon" /> Đang Tra Cứu...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Tìm Với AI
                  </>
                )}
              </button>
            </div>

            {/* QUICK SUGGESTIONS */}
            <div className="ai-suggestions-section">
              <span className="suggestions-label">Gợi ý tìm nhanh:</span>
              <div className="suggestions-list">
                {SEARCH_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    className="suggestion-chip"
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOADING ANIMATION STEPS */}
        {isLoading && (
          <div className="ai-loading-box glass-panel">
            <div className="loading-spinner-wrap">
              <div className="ai-pulse-ring" />
              <Sparkles size={32} className="ai-center-sparkle" />
            </div>
            <div className="steps-progress-list">
              {searchSteps.map((step, idx) => {
                const isDone = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div
                    key={idx}
                    className={`step-item ${isDone ? 'step-done' : ''} ${isCurrent ? 'step-active' : ''}`}
                  >
                    {isDone ? (
                      <CheckCircle2 size={16} className="step-check" />
                    ) : isCurrent ? (
                      <Loader2 size={16} className="step-spin spin-icon" />
                    ) : (
                      <div className="step-dot" />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !isLoading && (
          <div className="ai-error-banner">
            <AlertCircle size={20} />
            <div className="ai-error-text-wrap">
              <span>{error}</span>
              <button
                className="ai-try-again-btn"
                onClick={() => {
                  setSearchResult(null);
                  setError(null);
                }}
              >
                Nhập tên phim khác
              </button>
            </div>
          </div>
        )}

        {/* SEARCH RESULT CONTAINER */}
        {searchResult && !isLoading && (
          <div className="ai-result-container animate-fade-in">
            {/* OTHER MATCHING CANDIDATES SORTED BY YEAR DESCENDING WITH IMDB SCORES */}
            {sortedCandidates.length > 1 && (
              <div className="matching-candidates-box">
                <div className="candidates-header">
                  <Layers size={14} />
                  <span>
                    Tìm thấy {sortedCandidates.length} tác phẩm cùng tên / liên quan trên IMDb (sắp xếp mới nhất):
                  </span>
                </div>
                <div className="candidates-list-scroll">
                  {sortedCandidates.map(cand => {
                    const isSelected = cand.imdbID === searchResult.id;
                    return (
                      <div
                        key={cand.imdbID}
                        className={`candidate-pill-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectCandidate(cand)}
                        title={`Xem chi tiết ${cand.title} (${cand.year || 'N/A'})`}
                      >
                        {cand.poster && (
                          <img
                            src={cand.poster}
                            alt={cand.title}
                            className="cand-thumb"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div className="cand-info">
                          <div className="cand-title-row">
                            <span className="cand-title">{cand.title}</span>
                            {cand.imdbRating ? (
                              <span className="cand-imdb-pill">★ {cand.imdbRating}</span>
                            ) : (
                              <span className="cand-imdb-pill cand-imdb-na">★ IMDb</span>
                            )}
                          </div>
                          <div className="cand-sub-row">
                            {cand.year && <span className="cand-year-badge">{cand.year}</span>}
                            {cand.cast && <span className="cand-cast-text">• {cand.cast}</span>}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="cand-check-badge">
                            <Check size={11} /> Đang xem
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MAIN COMPACT MOVIE RESULT CARD */}
            <div className="result-main-card glass-panel">
              <div className="result-top-info-strip">
                <div className="result-source-chip">
                  <Sparkles size={13} /> {searchResult.source || 'Nguồn IMDb, Rotten Tomatoes & Metacritic'}
                </div>
                {searchResult.country && (
                  <span className="result-country-tag">📍 {searchResult.country}</span>
                )}
              </div>

              {isSwitching ? (
                <div className="switching-loading-box">
                  <Loader2 size={24} className="spin-icon" />
                  <span>Đang cập nhật điểm số và thông tin bản phát hành...</span>
                </div>
              ) : (
                <div className="result-layout-wrapper">
                  {/* COMPACT POSTER & METRICS ROW */}
                  <div className="result-hero-row">
                    <div className="result-poster-wrap">
                      <img
                        src={searchResult.poster}
                        alt={searchResult.title}
                        className="result-poster-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </div>

                    <div className="result-primary-info">
                      <div className="result-title-group">
                        {(() => {
                          const aiTitles = resolveMovieTitles(searchResult);
                          return (
                            <>
                              <h4 className="result-title">
                                {aiTitles.vietnameseTitle}
                              </h4>
                              {aiTitles.englishTitle && aiTitles.englishTitle !== aiTitles.vietnameseTitle && (
                                <span className="result-sub-title">{aiTitles.englishTitle}</span>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div className="result-meta-line">
                        <span className="result-year-badge">{searchResult.year}</span>
                        <span>•</span>
                        <span>{searchResult.runtime || 'N/A'}</span>
                        {searchResult.director && searchResult.director !== 'N/A' && (
                          <>
                            <span>•</span>
                            <span>Đạo diễn: {searchResult.director}</span>
                          </>
                        )}
                      </div>

                      {searchResult.genres && (
                        <div className="result-genres-row">
                          {searchResult.genres.map((g, i) => (
                            <span key={i} className="result-genre-pill">{g}</span>
                          ))}
                        </div>
                      )}

                      {/* COMPACT SCORES STRIP */}
                      <div className="result-scores-row">
                        <ScoreBadge
                          type="unified"
                          score={calculateUnifiedScore(searchResult.ratings)}
                          size="small"
                        />
                        <ScoreBadge
                          type="imdb"
                          score={searchResult.ratings?.imdb}
                          votes={searchResult.ratings?.imdbVotes}
                        />
                        <ScoreBadge
                          type="rtCritics"
                          score={searchResult.ratings?.rtCritics}
                        />
                        <ScoreBadge
                          type="rtAudience"
                          score={searchResult.ratings?.rtAudience}
                        />
                        <ScoreBadge
                          type="metacritic"
                          score={searchResult.ratings?.metascore}
                        />
                      </div>
                    </div>
                  </div>

                  {/* TÓM TẮT NHANH (NETFLIX-STYLE) */}
                  {searchResult.synopsis && (
                    <div className="result-consensus-box">
                      <strong>Tóm tắt nhanh:</strong> {formatQuickSynopsis(searchResult.synopsis, 60)}
                    </div>
                  )}

                  {/* THẺ PHÊ BÌNH PHIM (TỐI ĐA 200 TỪ) */}
                  {(searchResult.filmReview || searchResult.criticConsensus) && (
                    <div className="result-film-review-box">
                      <div className="result-film-review-header">
                        <div className="review-header-title">
                          <Sparkles size={14} className="review-sparkle-icon" />
                          <span>Phê bình phim</span>
                        </div>
                        <span className="review-tag">Góc nhìn & Ý nghĩa</span>
                      </div>
                      <p className="result-film-review-text">
                        {formatFilmReview(searchResult.filmReview || searchResult.criticConsensus, 200)}
                      </p>
                    </div>
                  )}

                  {/* AUDIO SPOILER PLOT READER */}
                  {(searchResult.detailedPlot || searchResult.synopsis) && (
                    <div className="result-plot-box">
                      <AudioPlotReader
                        text={searchResult.detailedPlot || searchResult.synopsis}
                        title="Tóm tắt diễn biến"
                        spoilerTag="Spoiler"
                        defaultExpanded={false}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="result-actions-footer">
                <button
                  className="ai-btn-secondary"
                  onClick={() => {
                    setSearchResult(null);
                    setError(null);
                  }}
                >
                  <Search size={15} /> Tìm Phim Khác
                </button>
                <button className="ai-btn-primary" onClick={handleImport}>
                  <Plus size={17} /> Thêm Vào Kho Phim & Xem Chi Tiết
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER TIP */}
        <div className="ai-footer-tip">
          <Key size={13} className="key-icon" />
          <span>
            {hasKey ? (
              <span className="key-active-text">Đang kết nối Google Gemini AI API riêng.</span>
            ) : (
              <span>Chế độ Live API trực tiếp từ IMDb, Rotten Tomatoes và Metacritic.</span>
            )}
          </span>
          <button className="open-settings-link" onClick={() => { onClose(); onOpenSettings(); }}>
            Cài đặt Key →
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { searchMovieWithGemini, loadCandidateDetails, getStoredGeminiKey } from '../services/geminiService';
import { ScoreBadge } from './ScoreBadge';
import { calculateUnifiedScore, getMovieBadge } from '../services/scoreEngine';
import { resolveMovieTitles } from '../utils/movieTitleResolver';
import { AudioPlotReader } from './AudioPlotReader';
import { formatQuickSynopsis, formatDetailedPlot, formatFilmReview, parseYearToNumber, getAgeRatingBadge, formatMovieCredits, compareCandidates } from '../utils/searchUtils';
import { isAdvisoryEligible } from '../utils/ageRatingAdvisory';
import { AgeRatingDetailModal } from './AgeRatingDetailModal';
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
  Film,
  Calendar,
  Clock,
  Quote,
  X,
  Users,
  Building2,
  Globe,
  Info
} from 'lucide-react';
import './MovieDetailModal.css';
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
  const [isAgeAdvisoryOpen, setIsAgeAdvisoryOpen] = useState(false);
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
      const details = await loadCandidateDetails(cand.imdbID, cand.imdbRating);
      setSearchResult(prev => {
        const prevCandidates = prev?.candidates || [];
        const verifiedYear = parseYearToNumber(details.year);
        const updatedCandidates = prevCandidates.map(c => {
          if (c.imdbID === cand.imdbID || c.imdbID === details.id) {
            return {
              ...c,
              year: verifiedYear || c.year,
              imdbRating: details.ratings?.imdb || c.imdbRating,
              title: details.vietnameseTitle || details.title || c.title
            };
          }
          return c;
        });
        return {
          ...details,
          candidates: updatedCandidates
        };
      });
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

  // Lọc và sắp xếp candidate: KHỚP TÊN -> NĂM SẢN XUẤT -> ĐIỂM IMDB
  const sortedCandidates = useMemo(() => {
    const rawList = searchResult?.candidates || [];
    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    const valid = rawList.filter(cand => {
      const hasPoster = !!cand.poster;
      const hasCast = !!(cand.cast && cand.cast.trim());
      const hasRating = !!(cand.imdbRating);
      return hasPoster || hasCast || hasRating;
    });

    return [...valid].sort(compareCandidates);
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
                    Tìm thấy {sortedCandidates.length} tác phẩm cùng tên / liên quan trên IMDb:
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

            {/* MAIN MOVIE RESULT CARD (SYNCHRONIZED WITH MOVIE DETAIL MODAL) */}
            <div className="result-main-card glass-panel ai-movie-detail-card">
              {isSwitching ? (
                <div className="switching-loading-box">
                  <Loader2 size={24} className="spin-icon" />
                  <span>Đang cập nhật điểm số và thông tin bản phát hành...</span>
                </div>
              ) : (
                <>
                  {/* HERO BANNER SECTION (CLEAN & FULL VISIBILITY) */}
                  <div className="modal-hero-banner">
                    <img
                      src={searchResult.backdrop || searchResult.poster}
                      alt={searchResult.title}
                      className="modal-banner-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = searchResult.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80';
                      }}
                    />
                    <div className="modal-banner-overlay" />

                    {/* CỤM BADGE & THỂ LOẠI Ở GÓC TRÁI BANNER LỚN */}
                    <div className="modal-top-left-group">
                      {(() => {
                        const badge = getMovieBadge(searchResult.ratings);
                        return badge ? (
                          <div className="modal-top-left-badge">
                            <span className={`badge ${badge.className}`}>
                              {badge.icon} {badge.label}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      {(() => {
                        const genresList = Array.isArray(searchResult.genres) 
                          ? searchResult.genres 
                          : (typeof searchResult.genres === 'string' ? searchResult.genres.split(',').map(g => g.trim()).filter(Boolean) : []);
                        return genresList.length > 0 ? (
                          <div className="modal-banner-genres">
                            {genresList.map((genre, idx) => (
                              <span key={idx} className="banner-genre-pill">{genre}</span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* MODAL BODY CONTENT */}
                  <div className="modal-body-content">
                    {/* HEADER INFO SECTION (PULLED DOWN WITH OVERLAPPING POSTER) */}
                    <div className="modal-header-info-wrap">
                      <div className="modal-poster-wrap">
                        <img
                          src={searchResult.poster}
                          alt={searchResult.title}
                          className="modal-poster-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>

                      <div className="modal-banner-info">
                        {/* HÀNG CẢNH BÁO ĐỘ TUỔI */}
                        {(() => {
                          const ageBadge = getAgeRatingBadge(searchResult);
                          const eligible = isAdvisoryEligible(searchResult);
                          return ageBadge ? (
                            <div className="modal-age-warning-row">
                              <span 
                                className={`age-code-tag age-code-${ageBadge.code.toLowerCase()} ${eligible ? 'clickable-age-tag' : ''}`}
                                onClick={() => eligible && setIsAgeAdvisoryOpen(true)}
                                title={eligible ? `${ageBadge.description || ageBadge.label} (Bấm xem chi tiết cảnh báo)` : (ageBadge.description || ageBadge.label)}
                              >
                                {ageBadge.code}
                              </span>
                              <span 
                                className={`age-desc-tag age-desc-${ageBadge.code.toLowerCase()} ${eligible ? 'clickable-age-tag' : ''}`}
                                onClick={() => eligible && setIsAgeAdvisoryOpen(true)}
                                title={eligible ? `${ageBadge.description || ageBadge.label} (Bấm xem chi tiết cảnh báo)` : (ageBadge.description || ageBadge.label)}
                              >
                                {ageBadge.description || ageBadge.label}
                              </span>
                              {eligible && (
                                <button
                                  className="age-info-circle-btn"
                                  onClick={() => setIsAgeAdvisoryOpen(true)}
                                  title="Xem chi tiết số cảnh nóng, bạo lực, kinh dị & mốc thời gian"
                                >
                                  <Info size={14} className="age-info-icon" />
                                </button>
                              )}
                            </div>
                          ) : null;
                        })()}

                        {(() => {
                          const aiTitles = resolveMovieTitles(searchResult);
                          return (
                            <>
                              <h2 className="modal-movie-title">
                                {aiTitles.vietnameseTitle}
                              </h2>
                              {aiTitles.englishTitle && aiTitles.englishTitle !== aiTitles.vietnameseTitle && (
                                <h3 className="modal-movie-original">{aiTitles.englishTitle}</h3>
                              )}
                            </>
                          );
                        })()}

                        <div className="modal-meta-grid">
                          {searchResult.year && <span><Calendar size={14} /> {searchResult.year}</span>}
                          <span><Clock size={14} /> {searchResult.runtime && searchResult.runtime !== 'N/A' ? searchResult.runtime : 'Đang cập nhật'}</span>
                        </div>
                      </div>
                    </div>

                    {/* CỤM ĐIỂM SỐ 3 NGUỒN (BẢNG ĐIỂM NGUỒN UY TÍN) */}
                    <div className="modal-scores-section">
                      <h4 className="section-mini-title">Bảng Điểm Nguồn Uy Tín</h4>
                      <div className="modal-scores-cluster">
                        <ScoreBadge
                          type="unified"
                          score={calculateUnifiedScore(searchResult.ratings)}
                          size="large"
                        />
                        <div className="modal-source-badges">
                          <ScoreBadge
                            type="imdb"
                            score={searchResult.ratings?.imdb}
                            votes={searchResult.ratings?.imdbVotes}
                            showSubtitle={true}
                          />
                          <ScoreBadge
                            type="rtCritics"
                            score={searchResult.ratings?.rtCritics}
                            showSubtitle={true}
                          />
                          <ScoreBadge
                            type="rtAudience"
                            score={searchResult.ratings?.rtAudience}
                            showSubtitle={true}
                          />
                          <ScoreBadge
                            type="metacritic"
                            score={searchResult.ratings?.metascore}
                            showSubtitle={true}
                          />
                        </div>
                      </div>
                    </div>

                    {/* KHU VỰC THÔNG TIN DIỄN VIÊN, ĐẠO DIỄN, HÃNG SẢN XUẤT VÀ QUỐC GIA (DƯỚI BẢNG ĐIỂM NGUỒN UY TÍN) */}
                    {(() => {
                      const credits = formatMovieCredits(searchResult);
                      return (
                        <div className="modal-credits-section">
                          <div className="credit-row">
                            <span className="credit-label">
                              <Users size={14} className="credit-icon" /> Diễn viên:
                            </span>
                            <span className="credit-value">{credits.castWithRoles}</span>
                          </div>

                          <div className="credit-row">
                            <span className="credit-label">
                              <Film size={14} className="credit-icon" /> Đạo diễn & Ê-kíp:
                            </span>
                            <span className="credit-value">{credits.director}</span>
                          </div>

                          {credits.production && (
                            <div className="credit-row">
                              <span className="credit-label">
                                <Building2 size={14} className="credit-icon" /> Hãng sản xuất:
                              </span>
                              <span className="credit-value">{credits.production}</span>
                            </div>
                          )}

                          {searchResult.country && (
                            <div className="credit-row">
                              <span className="credit-label">
                                <Globe size={14} className="credit-icon" /> Quốc gia:
                              </span>
                              <span className="credit-value">{searchResult.country}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* GIỚI THIỆU PHIM (NETFLIX-STYLE) */}
                    {searchResult.synopsis && (
                      <div className="modal-quick-synopsis-box">
                        <span className="quick-synopsis-tag">Giới thiệu phim:</span> {formatQuickSynopsis(searchResult.synopsis, 60)}
                      </div>
                    )}

                    {/* THẺ PHÊ BÌNH PHIM (TỐI ĐA 200 TỪ) */}
                    {(searchResult.filmReview || searchResult.movieReview) && (
                      <div className="modal-film-review-card">
                        <div className="film-review-header">
                          <div className="film-review-title-wrap">
                            <div className="film-review-icon-badge">
                              <Sparkles size={16} />
                            </div>
                            <h4 className="film-review-heading">Phê bình phim</h4>
                          </div>
                          <span className="film-review-tag">Góc nhìn & Ý nghĩa</span>
                        </div>
                        <p className="film-review-body">
                          {formatFilmReview(searchResult.filmReview || searchResult.movieReview || searchResult.criticConsensus, 200)}
                        </p>
                      </div>
                    )}

                    {/* TÓM TẮT DIỄN BIẾN & GIỌNG ĐỌC AI */}
                    {(searchResult.detailedPlot || searchResult.synopsis) && (
                      <div className="modal-section synopsis-section">
                        <AudioPlotReader
                          text={formatDetailedPlot(searchResult.detailedPlot || searchResult.synopsis, 300)}
                          title="Tóm tắt diễn biến"
                          spoilerTag={searchResult.detailedPlot ? "Spoiler" : ""}
                          defaultExpanded={false}
                        />
                      </div>
                    )}

                    {/* DÀN DIỄN VIÊN CHÍNH */}
                    {Array.isArray(searchResult.cast) && searchResult.cast.length > 0 && (
                      <div className="modal-cast-section">
                        <h4 className="section-mini-title">Dàn Diễn Viên Chính</h4>
                        <div className="cast-tags-list">
                          {searchResult.cast.map((actor, idx) => (
                            <span key={idx} className="cast-tag">{actor}</span>
                          ))}
                        </div>
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
                        <Search size={15} /> Nhập Tên Phim Khác
                      </button>
                      <button className="ai-btn-primary" onClick={handleImport}>
                        <Plus size={17} /> Thêm Vào Kho Phim & Xem Chi Tiết
                      </button>
                    </div>
                  </div>
                </>
              )}
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

      {/* MODAL CHI TIẾT PHÂN LOẠI ĐỘ TUỔI TỪ KẾT QUẢ TÌM KIẾM AI */}
      {isAgeAdvisoryOpen && searchResult && (
        <AgeRatingDetailModal
          movie={searchResult}
          onClose={() => setIsAgeAdvisoryOpen(false)}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { searchMovieWithGemini, loadCandidateDetails } from '../services/geminiService.js';
import { ScoreBadge } from './ScoreBadge.jsx';
import { calculateUnifiedScore, getMovieBadge } from '../services/scoreEngine.js';
import { resolveMovieTitles } from '../utils/movieTitleResolver.js';
import { formatQuickSynopsis, formatDetailedPlot, formatFilmReview, parseYearToNumber, getAgeRatingBadge, formatMovieCredits, compareCandidates } from '../utils/searchUtils.js';
import { isAdvisoryEligible } from '../utils/ageRatingAdvisory.js';
import { AgeRatingDetailModal } from './AgeRatingDetailModal.jsx';
import {
  Sparkles,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
  Check,
  Calendar,
  Clock,
  Film,
  Quote,
  X,
  Users,
  Building2,
  Globe,
  Info
} from 'lucide-react';
import { AudioPlotReader } from './AudioPlotReader.jsx';
import './MovieDetailModal.css';
import './AISearchSection.css';

const QUICK_SUGGESTIONS = [
  'The Last House 2026',
  'Mai (2024)',
  'Đào, Phở và Piano',
  'Werewolves (2024)',
  'Deadpool & Wolverine',
  'Inside Out 2',
  'Dune: Part Two',
  'Lật Mặt 7',
  'Alien: Romulus'
];

export function AISearchSection({
  searchQuery = '',
  aiSearchTrigger,
  onAddMovieToLibrary,
  onOpenSettings,
  onResultStateChange,
  weights
}) {
  const [query, setQuery] = useState(searchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchResult, setSearchResult] = useState(null);
  const [isAgeAdvisoryOpen, setIsAgeAdvisoryOpen] = useState(false);
  const [error, setError] = useState(null);
  const sectionRef = useRef(null);

  // Khi có lệnh tra cứu trực tiếp từ Topbar -> Chạy tìm kiếm ngay lập tức!
  useEffect(() => {
    if (aiSearchTrigger && aiSearchTrigger.query && aiSearchTrigger.timestamp > 0) {
      setQuery(aiSearchTrigger.query);
      handleSearch(aiSearchTrigger.query);
    }
  }, [aiSearchTrigger]);

  // Đồng bộ khi reset về trang chủ
  useEffect(() => {
    if (searchQuery === '') {
      setQuery('');
      setSearchResult(null);
      setError(null);
    }
  }, [searchQuery]);

  const searchSteps = [
    '🔍 Đang kết nối kho dữ liệu IMDb & tìm các bản phát hành...',
    '🍅 Đang trích xuất Tomatometer & Popcornmeter từ Rotten Tomatoes...',
    'Ⓜ Đang phân tích chỉ số phê bình Metascore từ Metacritic...',
    '✨ Trí tuệ nhân tạo Gemini đang tổng hợp & chuẩn hóa tiếng Việt...'
  ];

  const handleSearch = async (targetQuery = query) => {
    const q = (targetQuery || query).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    setCurrentStep(0);

    // Tạm thời ẩn banner ngay khi bắt đầu tra cứu
    if (onResultStateChange) onResultStateChange(true);

    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < searchSteps.length - 1 ? prev + 1 : prev));
    }, 400);

    try {
      const result = await searchMovieWithGemini(q);
      clearInterval(stepInterval);
      setCurrentStep(searchSteps.length - 1);
      setSearchResult(result);
      if (onResultStateChange) onResultStateChange(true);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Không tìm thấy thông tin phù hợp cho phim này.');
      if (onResultStateChange) onResultStateChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = async (cand) => {
    if (!cand.imdbID || cand.imdbID === searchResult?.id) return;
    setIsSwitching(true);
    try {
      const details = await loadCandidateDetails(cand.imdbID, cand.imdbRating);
      // Đảm bảo tên phim sạch sẽ không bị working title
      const cleanTitle = cand.title || details.title;
      const verifiedYear = parseYearToNumber(details.year);

      setSearchResult(prev => {
        const prevCandidates = prev?.candidates || [];
        const updatedCandidates = prevCandidates.map(c => {
          if (c.imdbID === cand.imdbID || c.imdbID === details.id) {
            return {
              ...c,
              year: verifiedYear || c.year,
              imdbRating: details.ratings?.imdb || c.imdbRating,
              title: cleanTitle
            };
          }
          return c;
        });

        return {
          ...details,
          title: cleanTitle,
          vietnameseTitle: cleanTitle,
          poster: cand.poster || details.poster,
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
    }
  };

  const handleClearResult = () => {
    setSearchResult(null);
    setError(null);
    setQuery('');
    if (onResultStateChange) onResultStateChange(false);
  };

  const unifiedScore = searchResult ? calculateUnifiedScore(searchResult.ratings, weights) : 0;
  const isUpcoming = searchResult && searchResult.year && searchResult.year > 2024 &&
    searchResult.ratings?.imdb === null && searchResult.ratings?.rtCritics === null;

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

  return (
    <section className="ai-search-section" ref={sectionRef} id="ai-search-section">
      <div className="container">
        <div className="ai-search-card glass-panel">
          {/* HEADER */}
          <div className="ai-section-header">
            <div className="ai-icon-badge">
              <Sparkles size={20} />
            </div>
            <div className="ai-header-titles">
              <h2>Tra Cứu Phim Đa Nguồn Với Gemini AI</h2>
              <p>Tự động trích xuất điểm số thời gian thực từ IMDb, Rotten Tomatoes & Metacritic</p>
            </div>
          </div>

          {/* SEARCH INPUT BAR */}
          <div className="ai-search-bar-wrap">
            <div className="ai-search-input-box">
              <Search className="ai-input-icon" size={20} />
              <input
                type="text"
                className="ai-search-input"
                placeholder="Nhập tên bất kỳ bộ phim nào (ví dụ: The Last House 2026, Mai, Dune 2, Werewolves...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
              />
              {query && (
                <button className="clear-query-btn" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              className="ai-search-btn"
              onClick={() => handleSearch()}
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>Đang Tra Cứu...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Tra Cứu Với AI</span>
                </>
              )}
            </button>
          </div>

          {/* QUICK SUGGESTIONS */}
          {!searchResult && !isLoading && (
            <div className="ai-quick-tags">
              <span className="tags-label">Gợi ý tìm nhanh:</span>
              <div className="tags-scroll">
                {QUICK_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="tag-pill-btn"
                    onClick={() => {
                      setQuery(item);
                    }}
                    title={`Chọn "${item}"`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LOADING STEPS PROGRESS */}
          {isLoading && (
            <div className="ai-inline-loading">
              <div className="loading-animation-cluster">
                <div className="pulse-circle" />
                <Sparkles size={28} className="center-sparkle" />
              </div>
              <div className="loading-steps-stack">
                {searchSteps.map((step, idx) => {
                  const isDone = idx < currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div
                      key={idx}
                      className={`step-row ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''}`}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} className="step-ic done-ic" />
                      ) : isCurrent ? (
                        <Loader2 size={16} className="step-ic spin-icon active-ic" />
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

          {/* ERROR NOTICE */}
          {error && (
            <div className="ai-inline-error">
              <AlertCircle size={20} className="err-icon" />
              <div className="err-content">
                <strong>Không tìm thấy kết quả:</strong> {error}
              </div>
            </div>
          )}

          {/* LIVE SEARCH RESULT */}
          {searchResult && !isLoading && (
            <div className="ai-inline-result animate-fade-in">
              {/* DISMISS BUTTON */}
              <button className="dismiss-result-btn" onClick={handleClearResult} title="Đóng kết quả tra cứu">
                <X size={18} />
              </button>

              {/* CANDIDATES LIST IF MULTIPLE RELEASES FOUND */}
              {sortedCandidates && sortedCandidates.length > 1 && (
                <div className="candidates-section">
                  <div className="candidates-head">
                    <Layers size={16} className="head-ic" />
                    <span>Tìm thấy {sortedCandidates.length} tác phẩm cùng tên / liên quan trên IMDb:</span>
                  </div>
                  <div className="candidates-scroll-row">
                    {sortedCandidates.map(cand => {
                      const isSelected = cand.imdbID === searchResult.id;
                      return (
                        <button
                          key={cand.imdbID}
                          type="button"
                          className={`candidate-card ${isSelected ? 'active' : ''}`}
                          onClick={() => handleSelectCandidate(cand)}
                        >
                          {cand.poster && (
                            <img
                              src={cand.poster}
                              alt={cand.title}
                              className="candidate-poster-mini"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div className="candidate-info-text">
                            <div className="cand-title-row">
                              <span className="candidate-title">{cand.title}</span>
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
                            <span className="candidate-active-tag">
                              <Check size={12} /> Đang xem
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MAIN MOVIE CARD (SYNCHRONIZED WITH MOVIE DETAIL MODAL) */}
              <div className="result-main-card glass-panel ai-movie-detail-card">
                {isSwitching ? (
                  <div className="switching-placeholder">
                    <Loader2 size={24} className="spin-icon" />
                    <span>Đang tải thông tin bản phát hành...</span>
                  </div>
                ) : (
                  <>
                    {/* HERO BANNER SECTION */}
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
                      {/* HEADER INFO SECTION */}
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

                      {/* BẢNG ĐIỂM NGUỒN UY TÍN */}
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

                      {/* DÀN DIỄN VIÊN & THỂ LOẠI */}
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

                      {/* ACTIONS */}
                      <div className="result-actions-footer">
                        <button className="ai-btn-secondary" onClick={() => handleSearch()}>
                          <Search size={15} /> Tra Cứu Lại
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
        </div>
      </div>

      {/* MODAL CHI TIẾT PHÂN LOẠI ĐỘ TUỔI TỪ KẾT QUẢ TÌM KIẾM AI */}
      {isAgeAdvisoryOpen && searchResult && (
        <AgeRatingDetailModal
          movie={searchResult}
          onClose={() => setIsAgeAdvisoryOpen(false)}
        />
      )}
    </section>
  );
}

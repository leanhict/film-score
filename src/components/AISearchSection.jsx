import React, { useState, useEffect, useRef } from 'react';
import { searchMovieWithGemini, loadCandidateDetails } from '../services/geminiService.js';
import { ScoreBadge } from './ScoreBadge.jsx';
import { calculateUnifiedScore } from '../services/scoreEngine.js';
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
  User,
  X
} from 'lucide-react';
import { AudioPlotReader } from './AudioPlotReader.jsx';
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
      const details = await loadCandidateDetails(cand.imdbID);
      // Đảm bảo tên phim sạch sẽ không bị working title
      const cleanTitle = cand.title || details.title;
      setSearchResult(prev => ({
        ...details,
        title: cleanTitle,
        vietnameseTitle: cleanTitle,
        poster: cand.poster || details.poster,
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
              {searchResult.candidates && searchResult.candidates.length > 1 && (
                <div className="candidates-section">
                  <div className="candidates-head">
                    <Layers size={16} className="head-ic" />
                    <span>Tìm thấy {searchResult.candidates.length} tác phẩm cùng tên / liên quan trên IMDb:</span>
                  </div>
                  <div className="candidates-scroll-row">
                    {searchResult.candidates.map(cand => {
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
                            <span className="candidate-title">{cand.title}</span>
                            <span className="candidate-meta">
                              {cand.year ? `${cand.year}` : 'N/A'} {cand.cast ? `• ${cand.cast}` : ''}
                            </span>
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

              {/* VERIFIED SOURCE BADGE */}
              <div className="verified-source-bar">
                <span className="source-tag">
                  <Sparkles size={13} /> {searchResult.source || 'IMDb, Rotten Tomatoes & Metacritic'}
                </span>
                <span className="live-pulse-badge">
                  <span className="live-dot" /> Dữ liệu trực tuyến
                </span>
              </div>

              {/* MAIN MOVIE CARD */}
              {isSwitching ? (
                <div className="switching-placeholder">
                  <Loader2 size={24} className="spin-icon" />
                  <span>Đang tải thông tin bản phát hành...</span>
                </div>
              ) : (
                <div className="movie-result-body">
                  <div className="movie-poster-column">
                    <img
                      src={searchResult.poster}
                      alt={searchResult.title}
                      className="movie-poster-large"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>

                  <div className="movie-details-column">
                    <div className="title-and-year-row">
                      <h3 className="result-main-title">
                        {searchResult.vietnameseTitle || searchResult.title}
                      </h3>
                      {searchResult.year && (
                        <span className="year-pill">{searchResult.year}</span>
                      )}
                    </div>

                    {searchResult.vietnameseTitle && searchResult.vietnameseTitle !== searchResult.title && (
                      <h4 className="result-original-title">{searchResult.title}</h4>
                    )}

                    <div className="meta-pills-row">
                      {searchResult.runtime && searchResult.runtime !== 'N/A' && (
                        <span className="meta-pill"><Clock size={13} /> {searchResult.runtime}</span>
                      )}
                      {searchResult.director && searchResult.director !== 'N/A' && (
                        <span className="meta-pill"><User size={13} /> Đạo diễn: {searchResult.director}</span>
                      )}
                      {searchResult.genres?.map((g, idx) => (
                        <span key={idx} className="genre-tag-pill">{g}</span>
                      ))}
                    </div>

                    {/* SCORE CLUSTER */}
                    <div className="scores-grid-cluster">
                      {isUpcoming ? (
                        <div className="upcoming-notice-pill">
                          <Calendar size={16} />
                          <span>Tác phẩm chuẩn bị ra mắt năm {searchResult.year} • Chưa có điểm số đánh giá chính thức</span>
                        </div>
                      ) : (
                        <>
                          <ScoreBadge type="unified" score={unifiedScore} size="medium" />
                          <ScoreBadge type="imdb" score={searchResult.ratings?.imdb} votes={searchResult.ratings?.imdbVotes} />
                          <ScoreBadge type="rtCritics" score={searchResult.ratings?.rtCritics} />
                          <ScoreBadge type="rtAudience" score={searchResult.ratings?.rtAudience} />
                          <ScoreBadge type="metacritic" score={searchResult.ratings?.metascore} />
                        </>
                      )}
                    </div>

                    {/* VIỆT HÓA TÓM TẮT TIỀN ĐỀ */}
                    {searchResult.synopsis && (
                      <p className="result-plot-text">{searchResult.synopsis}</p>
                    )}

                    {/* THẺ TÓM TẮT CỐT TRUYỆN CHI TIẾT (SPOILER) KÈM CHỨC NĂNG ĐỌC GIỌNG NÓI AI */}
                    {(searchResult.detailedPlot || searchResult.synopsis) && (
                      <AudioPlotReader
                        text={searchResult.detailedPlot || searchResult.synopsis}
                        title="Tóm Tắt Cốt Truyện & Diễn Biến"
                        spoilerTag="Spoiler • Tiết lộ nội dung"
                      />
                    )}

                    {/* CRITIC CONSENSUS */}
                    {searchResult.criticConsensus && (
                      <div className="result-consensus-box">
                        <div className="consensus-title">Nhận định chuyên môn:</div>
                        <p>{searchResult.criticConsensus}</p>
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div className="result-cta-footer">
                      <button className="cta-add-btn" onClick={handleImport}>
                        <Plus size={18} /> Thêm Vào Kho Phim & Xem Chi Tiết
                      </button>
                      <button className="cta-retry-btn" onClick={() => handleSearch()}>
                        Tra Cứu Lại
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

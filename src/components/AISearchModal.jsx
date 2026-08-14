import React, { useState, useEffect } from 'react';
import { searchMovieWithGemini, loadCandidateDetails, getStoredGeminiKey } from '../services/geminiService';
import { ScoreBadge } from './ScoreBadge';
import { calculateUnifiedScore, getMovieBadge } from '../services/scoreEngine';
import { AudioPlotReader } from './AudioPlotReader';
import { Sparkles, Search, Loader2, CheckCircle2, AlertCircle, ArrowRight, Key, Film, Plus, Layers, Check } from 'lucide-react';
import './AISearchModal.css';

const SEARCH_SUGGESTIONS = [
  'The Last House (2026)',
  'Mai (2024)',
  'Đào, Phở và Piano',
  'Lật Mặt 7',
  'Werewolves (2024)',
  'Deadpool & Wolverine',
  'Inside Out 2',
  'Dune: Part Two',
  'Bố Già (Trấn Thành)',
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ai-search-modal glass-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
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
              placeholder="Nhập tên bất kỳ bộ phim nào (ví dụ: The Last House 2026, Mai, Dune 2...)"
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
        {!searchResult && !isLoading && (
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
        {error && (
          <div className="ai-error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* SEARCH RESULT CARD */}
        {searchResult && !isLoading && (
          <div className="ai-result-container glass-panel animate-fade-in">
            {/* OTHER MATCHING CANDIDATES IF MULTIPLE MOVIES FOUND */}
            {searchResult.candidates && searchResult.candidates.length > 1 && (
              <div className="matching-candidates-box">
                <div className="candidates-header">
                  <Layers size={15} />
                  <span>Các tác phẩm cùng tên / liên quan trên IMDb ({searchResult.candidates.length}):</span>
                </div>
                <div className="candidates-list-scroll">
                  {searchResult.candidates.map(cand => {
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
                          <span className="cand-title">{cand.title}</span>
                          <span className="cand-year">{cand.year ? `${cand.year}` : 'N/A'} {cand.cast ? `• ${cand.cast}` : ''}</span>
                        </div>
                        {isSelected && (
                          <span className="cand-check-badge">
                            <Check size={12} /> Đang chọn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="result-top-badge">
              <Sparkles size={14} /> Nguồn dữ liệu: <strong>{searchResult.source || 'IMDb, Rotten Tomatoes & Metacritic'}</strong>
            </div>

            {isSwitching ? (
              <div className="switching-loading-box">
                <Loader2 size={24} className="spin-icon" />
                <span>Đang tải thông tin và điểm số bản phát hành đã chọn...</span>
              </div>
            ) : (
              <div className="result-content-grid">
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

                <div className="result-info-wrap">
                  <h4 className="result-title">
                    {searchResult.vietnameseTitle || searchResult.title}
                  </h4>
                  {searchResult.vietnameseTitle && searchResult.vietnameseTitle !== searchResult.title && (
                    <span className="result-sub">{searchResult.title}</span>
                  )}

                  <div className="result-meta">
                    <span className="result-year-badge">{searchResult.year}</span>
                    <span>•</span>
                    <span>{searchResult.runtime}</span>
                    <span>•</span>
                    <span>Đạo diễn: {searchResult.director}</span>
                  </div>

                  {/* SCORES SUMMARY */}
                  <div className="result-scores-row">
                    <ScoreBadge
                      type="unified"
                      score={calculateUnifiedScore(searchResult.ratings)}
                      size="medium"
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

                  {(searchResult.detailedPlot || searchResult.synopsis) && (
                    <AudioPlotReader
                      text={searchResult.detailedPlot || searchResult.synopsis}
                      title="Tóm Tắt Cốt Truyện & Diễn Biến"
                      spoilerTag="Spoiler • Tiết lộ nội dung"
                    />
                  )}

                  {searchResult.criticConsensus && (
                    <div className="result-consensus-box">
                      <strong>Nhận định chuyên môn:</strong> {searchResult.criticConsensus}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="result-actions-footer">
              <button className="ai-btn-secondary" onClick={() => handleSearch()}>
                Tra cứu lại
              </button>
              <button className="ai-btn-primary" onClick={handleImport}>
                <Plus size={18} /> Thêm Vào Kho Phim & Xem Chi Tiết
              </button>
            </div>
          </div>
        )}

        {/* FOOTER TIP */}
        <div className="ai-footer-tip">
          <Key size={14} className="key-icon" />
          <span>
            {hasKey ? (
              <span className="key-active-text">Đang sử dụng Google Gemini API Key riêng của bạn.</span>
            ) : (
              <span>Đang ở chế độ sẵn sàng. Bạn có thể thêm Gemini API Key trong phần Cài đặt để tra cứu không giới hạn.</span>
            )}
          </span>
          <button className="open-settings-link" onClick={() => { onClose(); onOpenSettings(); }}>
            Quản lý Key →
          </button>
        </div>
      </div>
    </div>
  );
}

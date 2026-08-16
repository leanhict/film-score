import React, { useState, useEffect } from 'react';
import { calculateUnifiedScore, getMovieBadge } from '../services/scoreEngine';
import { resolveMovieTitles } from '../utils/movieTitleResolver';
import { formatQuickSynopsis, formatDetailedPlot, formatFilmReview, getAgeRatingBadge, formatMovieCredits } from '../utils/searchUtils';
import { isAdvisoryEligible } from '../utils/ageRatingAdvisory';
import { AgeRatingDetailModal } from './AgeRatingDetailModal';
import { AudioPlotReader } from './AudioPlotReader';
import { ScoreBadge } from './ScoreBadge';
import { fetchMovieById, generateFallbackFilmReview } from '../services/movieDataService';
import { X, Play, Bookmark, Award, Film, Clock, Calendar, Tv, DollarSign, Quote, Sparkles, Users, Building2, Globe, Info } from 'lucide-react';
import './MovieDetailModal.css';

export function MovieDetailModal({
  movie,
  weights,
  onClose,
  onOpenTrailer,
  isWatchlisted = false,
  onToggleWatchlist
}) {
  if (!movie) return null;

  const [currentMovie, setCurrentMovie] = useState(movie);
  const [isAgeAdvisoryOpen, setIsAgeAdvisoryOpen] = useState(false);

  useEffect(() => {
    setCurrentMovie(movie);
    if (!movie) return;

    // Tự động tải thông tin Diễn viên, Đạo diễn, Hãng sản xuất thật từ TMDB / IMDb nếu thiếu
    const needsCredits = (!movie.cast || movie.cast.length === 0 || !movie.director || movie.director === 'Đạo diễn Netflix' || !movie.production) && movie.id;
    if (needsCredits) {
      let isMounted = true;
      fetchMovieById(movie.id)
        .then(fullData => {
          if (isMounted && fullData) {
            setCurrentMovie(prev => ({
              ...prev,
              ...fullData,
              ratings: fullData.ratings?.imdb ? fullData.ratings : prev.ratings
            }));
          }
        })
        .catch(err => {
          console.warn('Không tải được credits chi tiết:', err);
        });
      return () => { isMounted = false; };
    }
  }, [movie]);

  const activeMovie = currentMovie || movie;
  const unifiedScore = calculateUnifiedScore(activeMovie.ratings, weights);
  const badge = getMovieBadge(activeMovie.ratings);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="movie-detail-modal glass-modal" onClick={(e) => e.stopPropagation()}>
        {/* TOP ACTIONS */}
        <div className="modal-top-actions">
          {onToggleWatchlist && (
            <button
              className={`modal-action-btn ${isWatchlisted ? 'active' : ''}`}
              onClick={() => onToggleWatchlist(movie)}
              title={isWatchlisted ? 'Đã lưu vào danh sách' : 'Lưu vào danh sách'}
            >
              <Bookmark size={18} fill={isWatchlisted ? 'currentColor' : 'none'} />
            </button>
          )}
          <button className="modal-action-btn" onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* HERO BANNER WITH OVERLAY */}
        <div className="modal-hero-banner">
          <img
            src={activeMovie.backdrop || activeMovie.poster}
            alt={activeMovie.title}
            className="modal-banner-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="modal-banner-overlay" />

          {/* CỤM BADGE & THỂ LOẠI Ở GÓC TRÁI BANNER */}
          <div className="modal-top-left-group">
            {badge && (
              <div className="modal-top-left-badge">
                <span className={`badge ${badge.className}`}>
                  {badge.icon} {badge.label}
                </span>
              </div>
            )}
            {(() => {
              const genresList = Array.isArray(activeMovie.genres) 
                ? activeMovie.genres 
                : (typeof activeMovie.genres === 'string' ? activeMovie.genres.split(',').map(g => g.trim()).filter(Boolean) : []);
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

        {/* BODY CONTENT */}
        <div className="modal-body-content">
          {/* HEADER INFO SECTION (PULLED DOWN WITH OVERLAPPING POSTER) */}
          <div className="modal-header-info-wrap">
            <div className="modal-poster-wrap">
              <img
                src={activeMovie.poster}
                alt={activeMovie.title}
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
                const ageBadge = getAgeRatingBadge(activeMovie);
                const eligible = isAdvisoryEligible(activeMovie);
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
                const modalTitles = resolveMovieTitles(activeMovie);
                return (
                  <>
                    <h2 className="modal-movie-title">
                      {modalTitles.vietnameseTitle}
                    </h2>
                    {modalTitles.englishTitle && modalTitles.englishTitle !== modalTitles.vietnameseTitle && (
                      <h3 className="modal-movie-original">{modalTitles.englishTitle}</h3>
                    )}
                  </>
                );
              })()}

              <div className="modal-meta-grid">
                {activeMovie.year && <span><Calendar size={14} /> {activeMovie.year}</span>}
                <span><Clock size={14} /> {activeMovie.runtime}</span>
              </div>

              {activeMovie.trailerUrl && (
                <div className="modal-cta-row">
                  <button
                    className="modal-btn modal-btn-play"
                    onClick={() => onOpenTrailer && onOpenTrailer(activeMovie)}
                  >
                    <Play size={16} /> Xem Trailer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CỤM ĐIỂM SỐ 3 NGUỒN */}
          <div className="modal-scores-section">
            <h4 className="section-mini-title">Bảng Điểm Nguồn Uy Tín</h4>
            <div className="modal-scores-cluster">
              <ScoreBadge type="unified" score={unifiedScore} size="large" />
              <div className="modal-source-badges">
                <ScoreBadge type="imdb" score={activeMovie.ratings?.imdb} votes={activeMovie.ratings?.imdbVotes} showSubtitle={true} />
                <ScoreBadge type="rtCritics" score={activeMovie.ratings?.rtCritics} showSubtitle={true} />
                <ScoreBadge type="rtAudience" score={activeMovie.ratings?.rtAudience} showSubtitle={true} />
                <ScoreBadge type="metacritic" score={activeMovie.ratings?.metascore} showSubtitle={true} />
              </div>
            </div>
          </div>

          {/* KHU VỰC THÔNG TIN DIỄN VIÊN, ĐẠO DIỄN, HÃNG SẢN XUẤT VÀ QUỐC GIA (DƯỚI BẢNG ĐIỂM NGUỒN UY TÍN) */}
          {(() => {
            const credits = formatMovieCredits(activeMovie);
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

                {activeMovie.country && (
                  <div className="credit-row">
                    <span className="credit-label">
                      <Globe size={14} className="credit-icon" /> Quốc gia:
                    </span>
                    <span className="credit-value">{activeMovie.country}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* GIỚI THIỆU PHIM (NETFLIX-STYLE) */}
          {activeMovie.synopsis && (
            <div className="modal-quick-synopsis-box">
              <span className="quick-synopsis-tag">Giới thiệu phim:</span> {formatQuickSynopsis(activeMovie.synopsis, 60)}
            </div>
          )}

          {/* THẺ PHÊ BÌNH PHIM (TỐI ĐA 200 TỪ) */}
          {(() => {
            const reviewText = activeMovie.filmReview || activeMovie.movieReview || generateFallbackFilmReview(activeMovie);
            if (!reviewText) return null;
            return (
              <div className="modal-film-review-card">
                <div className="film-review-header">
                  <div className="film-review-title-wrap">
                    <div className="film-review-icon-badge">
                      <Sparkles size={16} />
                    </div>
                    <h4 className="film-review-heading">Phê bình phim</h4>
                  </div>
                  <span className="film-review-tag">Đánh giá Đa chiều</span>
                </div>
                <p className="film-review-body">
                  {formatFilmReview(reviewText, 200)}
                </p>
              </div>
            );
          })()}

          {/* TÓM TẮT DIỄN BIẾN & GIỌNG ĐỌC AI */}
          {(activeMovie.detailedPlot || activeMovie.synopsis) && (
            <div className="modal-section synopsis-section">
              <AudioPlotReader
                text={formatDetailedPlot(activeMovie.detailedPlot || activeMovie.synopsis, 300)}
                title="Tóm tắt diễn biến"
                spoilerTag={activeMovie.detailedPlot ? "Spoiler" : ""}
                defaultExpanded={false}
              />
            </div>
          )}

          {/* DÀN DIỄN VIÊN CHÍNH */}
          {activeMovie.cast && activeMovie.cast.length > 0 && (
            <div className="modal-cast-section">
              <h4 className="section-mini-title">Dàn Diễn Viên Chính</h4>
              <div className="cast-tags-list">
                {activeMovie.cast.map((actor, idx) => (
                  <span key={idx} className="cast-pill">{actor}</span>
                ))}
              </div>
            </div>
          )}

          {/* BOX OFFICE & AWARDS & STREAMING */}
          <div className="modal-footer-stats">
            {activeMovie.boxOffice && (
              <div className="stat-card">
                <DollarSign size={18} className="stat-icon" />
                <div>
                  <span className="stat-label">Doanh Thu Phòng Vé</span>
                  <span className="stat-val">{activeMovie.boxOffice}</span>
                </div>
              </div>
            )}

            {activeMovie.awards && (
              <div className="stat-card">
                <Award size={18} className="stat-icon award-color" />
                <div>
                  <span className="stat-label">Giải Thưởng & Thành Tựu</span>
                  <span className="stat-val">{activeMovie.awards}</span>
                </div>
              </div>
            )}

            {activeMovie.streaming && activeMovie.streaming.length > 0 && (
              <div className="stat-card">
                <Tv size={18} className="stat-icon stream-color" />
                <div>
                  <span className="stat-label">Nền Tảng Chiếu Trực Tuyến</span>
                  <span className="stat-val">{activeMovie.streaming.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT CẢNH BÁO ĐỘ TUỔI & MỐC THỜI GIAN */}
      {isAgeAdvisoryOpen && (
        <AgeRatingDetailModal
          movie={activeMovie}
          onClose={() => setIsAgeAdvisoryOpen(false)}
        />
      )}
    </div>
  );
}

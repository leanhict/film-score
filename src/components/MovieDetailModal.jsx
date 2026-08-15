import React from 'react';
import { calculateUnifiedScore, getMovieBadge } from '../services/scoreEngine';
import { resolveMovieTitles } from '../utils/movieTitleResolver';
import { formatQuickSynopsis, formatDetailedPlot, formatFilmReview } from '../utils/searchUtils';
import { ScoreBadge } from './ScoreBadge';
import { AudioPlotReader } from './AudioPlotReader';
import { X, Play, Bookmark, Award, Film, Clock, Calendar, Tv, DollarSign, Quote, Sparkles } from 'lucide-react';
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

  const unifiedScore = calculateUnifiedScore(movie.ratings, weights);
  const badge = getMovieBadge(movie.ratings);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="movie-detail-modal glass-modal" onClick={(e) => e.stopPropagation()}>
        {/* TOP ACTIONS (WATCHLIST + CLOSE BUTTONS) */}
        <div className="modal-top-actions">
          <button
            className={`modal-action-btn modal-watchlist-btn ${isWatchlisted ? 'active' : ''}`}
            onClick={() => onToggleWatchlist && onToggleWatchlist(movie)}
            aria-label={isWatchlisted ? 'Đã lưu vào danh sách muốn xem' : 'Thêm vào muốn xem'}
            title={isWatchlisted ? 'Đã lưu vào Watchlist (Bấm để hủy)' : 'Thêm Vào Muốn Xem'}
          >
            <Bookmark size={18} fill={isWatchlisted ? 'currentColor' : 'none'} />
          </button>

          <button
            className="modal-action-btn modal-close-btn"
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* HERO BANNER SECTION (CLEAN & FULL VISIBILITY) */}
        <div className="modal-hero-banner">
          <img
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            className="modal-banner-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80';
            }}
          />
          <div className="modal-banner-overlay" />
        </div>

        {/* MODAL BODY */}
        <div className="modal-body-content">
          {/* HEADER INFO SECTION (PULLED DOWN WITH POSTER & TITLE/METADATA) */}
          <div className="modal-header-info-wrap">
            <div className="modal-poster-wrap">
              <img
                src={movie.poster}
                alt={movie.title}
                className="modal-poster-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            <div className="modal-banner-info">
              <div className="modal-badge-row">
                {badge && (
                  <span className={`badge ${badge.className}`}>
                    {badge.icon} {badge.label}
                  </span>
                )}
                {movie.country && (
                  <span className="country-badge">📍 {movie.country}</span>
                )}
              </div>

              {(() => {
                const modalTitles = resolveMovieTitles(movie);
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
                <span><Calendar size={14} /> {movie.year}</span>
                <span><Clock size={14} /> {movie.runtime}</span>
                <span><Film size={14} /> {movie.director}</span>
              </div>

              {movie.trailerUrl && (
                <div className="modal-cta-row">
                  <button
                    className="modal-btn modal-btn-play"
                    onClick={() => onOpenTrailer && onOpenTrailer(movie)}
                  >
                    <Play size={16} fill="currentColor" /> Xem Trailer
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
                <ScoreBadge type="imdb" score={movie.ratings?.imdb} votes={movie.ratings?.imdbVotes} showSubtitle={true} />
                <ScoreBadge type="rtCritics" score={movie.ratings?.rtCritics} showSubtitle={true} />
                <ScoreBadge type="rtAudience" score={movie.ratings?.rtAudience} showSubtitle={true} />
                <ScoreBadge type="metacritic" score={movie.ratings?.metascore} showSubtitle={true} />
              </div>
            </div>
          </div>

          {/* NHẬN ĐỊNH CHUYÊN MÔN & CẢM NHẬN KHÁN GIẢ */}
          <div className="consensus-cards-grid">
            {movie.criticConsensus && (
              <div className="consensus-card critic-quote-card">
                <div className="quote-header">
                  <Quote size={18} className="quote-icon critic-color" />
                  <h5>Nhận Định Của Giới Phê Bình (Consensus)</h5>
                </div>
                <p className="quote-body">{movie.criticConsensus}</p>
              </div>
            )}

            {movie.audienceSentiment && (
              <div className="consensus-card audience-quote-card">
                <div className="quote-header">
                  <Quote size={18} className="quote-icon audience-color" />
                  <h5>Cảm Nhận Của Khán Giả Đại Chúng</h5>
                </div>
                <p className="quote-body">{movie.audienceSentiment}</p>
              </div>
            )}
          </div>
 
          {/* TÓM TẮT NHANH (NETFLIX-STYLE) */}
          {movie.synopsis && (
            <div className="modal-quick-synopsis-box">
              <span className="quick-synopsis-tag">Tóm tắt nhanh:</span> {formatQuickSynopsis(movie.synopsis, 60)}
            </div>
          )}

          {/* THẺ PHÊ BÌNH PHIM (TỐI ĐA 200 TỪ) */}
          {(movie.filmReview || movie.movieReview || movie.criticConsensus) && (
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
                {formatFilmReview(movie.filmReview || movie.movieReview || movie.criticConsensus, 200)}
              </p>
            </div>
          )}

          {/* TÓM TẮT DIỄN BIẾN & GIỌNG ĐỌC AI */}
          {(movie.detailedPlot || movie.synopsis) && (
            <div className="modal-section synopsis-section">
              <AudioPlotReader
                text={formatDetailedPlot(movie.detailedPlot || movie.synopsis, 200)}
                title="Tóm tắt diễn biến"
                spoilerTag={movie.detailedPlot ? "Spoiler" : ""}
                defaultExpanded={false}
              />
            </div>
          )}

          {/* DÀN DIỄN VIÊN & THỂ LOẠI */}
          <div className="modal-details-grid">
            <div className="detail-block">
              <h4 className="section-mini-title">Dàn Diễn Viên Chính</h4>
              <div className="cast-tags-list">
                {movie.cast?.map((actor, idx) => (
                  <span key={idx} className="cast-pill">{actor}</span>
                ))}
              </div>
            </div>

            <div className="detail-block">
              <h4 className="section-mini-title">Thể Loại</h4>
              <div className="genre-tags-list">
                {movie.genres?.map((genre, idx) => (
                  <span key={idx} className="genre-pill-lg">{genre}</span>
                ))}
              </div>
            </div>
          </div>

          {/* BOX OFFICE & AWARDS & STREAMING */}
          <div className="modal-footer-stats">
            {movie.boxOffice && (
              <div className="stat-card">
                <DollarSign size={18} className="stat-icon" />
                <div>
                  <span className="stat-label">Doanh Thu Phòng Vé</span>
                  <span className="stat-val">{movie.boxOffice}</span>
                </div>
              </div>
            )}

            {movie.awards && (
              <div className="stat-card">
                <Award size={18} className="stat-icon award-color" />
                <div>
                  <span className="stat-label">Giải Thưởng & Thành Tựu</span>
                  <span className="stat-val">{movie.awards}</span>
                </div>
              </div>
            )}

            {movie.streaming && movie.streaming.length > 0 && (
              <div className="stat-card">
                <Tv size={18} className="stat-icon stream-color" />
                <div>
                  <span className="stat-label">Nền Tảng Chiếu Trực Tuyến</span>
                  <span className="stat-val">{movie.streaming.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

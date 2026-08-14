import React from 'react';
import { calculateUnifiedScore, getMovieBadge } from '../services/scoreEngine';
import { ScoreBadge } from './ScoreBadge';
import { ScoreComparisonBar } from './ScoreComparisonBar';
import { AudioPlotReader } from './AudioPlotReader';
import { X, Play, Bookmark, Award, Film, Clock, Calendar, Tv, DollarSign, Quote } from 'lucide-react';
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
        {/* CLOSE BUTTON */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        {/* HERO BANNER SECTION */}
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

          <div className="modal-banner-content">
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

              <h2 className="modal-movie-title">
                {movie.vietnameseTitle || movie.title}
              </h2>
              {movie.vietnameseTitle && movie.vietnameseTitle !== movie.title && (
                <h3 className="modal-movie-original">{movie.title}</h3>
              )}

              <div className="modal-meta-grid">
                <span><Calendar size={14} /> {movie.year}</span>
                <span><Clock size={14} /> {movie.runtime}</span>
                <span><Film size={14} /> {movie.director}</span>
              </div>

              <div className="modal-cta-row">
                {movie.trailerUrl && (
                  <button
                    className="modal-btn modal-btn-play"
                    onClick={() => onOpenTrailer && onOpenTrailer(movie)}
                  >
                    <Play size={16} fill="currentColor" /> Xem Trailer
                  </button>
                )}

                <button
                  className={`modal-btn modal-btn-bookmark ${isWatchlisted ? 'active' : ''}`}
                  onClick={() => onToggleWatchlist && onToggleWatchlist(movie)}
                >
                  <Bookmark size={16} fill={isWatchlisted ? 'currentColor' : 'none'} />
                  {isWatchlisted ? 'Đã Lưu Vào Watchlist' : 'Thêm Vào Muốn Xem'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="modal-body-content">
          {/* CỤM ĐIỂM SỐ 3 NGUỒN */}
          <div className="modal-scores-section">
            <h4 className="section-mini-title">Bảng Điểm Nguồn Uy Tín</h4>
            <div className="modal-score-badges-grid">
              <ScoreBadge type="unified" score={unifiedScore} size="large" />
              <ScoreBadge type="imdb" score={movie.ratings?.imdb} votes={movie.ratings?.imdbVotes} size="large" />
              <ScoreBadge type="rtCritics" score={movie.ratings?.rtCritics} size="large" />
              <ScoreBadge type="rtAudience" score={movie.ratings?.rtAudience} size="large" />
              <ScoreBadge type="metacritic" score={movie.ratings?.metascore} size="large" />
            </div>
          </div>

          {/* BIỂU ĐỒ SO SÁNH & ĐỐI CHIẾU CHÊNH LỆCH */}
          <ScoreComparisonBar ratings={movie.ratings} />

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

          {/* TÓM TẮT CỐT TRUYỆN & GIỌNG ĐỌC AI */}
          {(movie.detailedPlot || movie.synopsis) && (
            <div className="modal-section synopsis-section">
              <AudioPlotReader
                text={movie.detailedPlot || movie.synopsis}
                title={movie.detailedPlot ? "Tóm Tắt Cốt Truyện & Diễn Biến" : "Tóm Tắt Nội Dung Phim"}
                spoilerTag={movie.detailedPlot ? "Spoiler • Tiết lộ nội dung" : ""}
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

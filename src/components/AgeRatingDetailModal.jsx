import React, { useState } from 'react';
import { getMovieAdvisory, VIETNAM_AGE_STANDARDS } from '../utils/ageRatingAdvisory';
import { getAgeRatingBadge } from '../utils/searchUtils';
import { resolveMovieTitles } from '../utils/movieTitleResolver';
import { 
  X, 
  ShieldAlert, 
  Flame, 
  Swords, 
  Skull, 
  MessageSquareWarning, 
  Clock, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  Info
} from 'lucide-react';
import './AgeRatingDetailModal.css';

export function AgeRatingDetailModal({ movie, onClose }) {
  if (!movie) return null;

  const advisory = getMovieAdvisory(movie);
  const badge = getAgeRatingBadge(movie) || { code: 'T16', label: 'T16' };
  const standard = VIETNAM_AGE_STANDARDS[badge.code] || VIETNAM_AGE_STANDARDS['T16'];
  const titles = resolveMovieTitles(movie);

  // States
  const [activeTab, setActiveTab] = useState('all');
  const [hideSpoilers, setHideSpoilers] = useState(true);
  const [unmaskedScenes, setUnmaskedScenes] = useState({});

  if (!advisory) return null;

  const toggleSceneMask = (sceneId) => {
    setUnmaskedScenes(prev => ({
      ...prev,
      [sceneId]: !prev[sceneId]
    }));
  };

  // Filter scenes based on active tab
  const filteredScenes = advisory.scenes.filter(scene => {
    if (activeTab === 'all') return true;
    return scene.category === activeTab;
  });

  const getIntensityBadgeClass = (intensity) => {
    switch (intensity) {
      case 'severe': return 'intensity-severe';
      case 'moderate': return 'intensity-moderate';
      case 'mild': return 'intensity-mild';
      default: return 'intensity-none';
    }
  };

  return (
    <div className="modal-overlay age-advisory-overlay" onClick={onClose}>
      <div 
        className={`age-advisory-modal glass-modal age-theme-${badge.code.toLowerCase()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER SECTION */}
        <div className="age-modal-header">
          <div className="age-modal-header-left">
            <div className="age-badge-large-wrap">
              <span className={`age-badge-hero age-code-${badge.code.toLowerCase()}`}>
                {badge.code}
              </span>
            </div>
            <div className="age-modal-title-wrap">
              <div className="age-modal-subheading">
                <ShieldAlert size={15} className="shield-icon" />
                <span>Báo Cáo Phân Tích Độ Tuổi & Cảnh Báo Nội Dung</span>
              </div>
              <h2 className="age-movie-title">{titles.vietnameseTitle}</h2>
              {titles.englishTitle && titles.englishTitle !== titles.vietnameseTitle && (
                <h4 className="age-movie-original">{titles.englishTitle} ({movie.year || 'Phim'})</h4>
              )}
            </div>
          </div>

          <button className="age-modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* BODY SCROLLABLE */}
        <div className="age-modal-body">
          {/* TIÊU CHUẨN ĐIỆN ẢNH & LÝ DO GẮN NHÃN */}
          <div className="age-verdict-banner">
            <div className="verdict-tag-row">
              <span className="verdict-audience-badge">
                {standard.audience}
              </span>
              <span className="verdict-standard-ref">
                Theo Thông tư 05/2023/TT-BVHTTDL
              </span>
            </div>
            <p className="verdict-text">{advisory.verdict}</p>
          </div>

          {/* 3 THẺ CHỈ SỐ CỐT LÕI (CẢNH NÓNG, BẠO LỰC, KINH DỊ MÁU ME) */}
          <div className="age-stats-grid">
            {/* THẺ 1: CẢNH NÓNG */}
            <div 
              className={`age-stat-card ${activeTab === 'nudity' ? 'active-card' : ''}`}
              onClick={() => setActiveTab(activeTab === 'nudity' ? 'all' : 'nudity')}
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrap icon-flame">
                  <Flame size={20} />
                </div>
                <span className={`stat-level-pill ${getIntensityBadgeClass(advisory.stats?.nudity?.level)}`}>
                  {advisory.stats?.nudity?.label || 'Không có'}
                </span>
              </div>
              <div className="stat-card-middle">
                <span className="stat-count-num">{advisory.stats?.nudity?.count || 0}</span>
                <span className="stat-count-label">Cảnh nóng & Nhạy cảm</span>
              </div>
              <div className="stat-progress-bar">
                <div 
                  className="stat-progress-fill fill-flame"
                  style={{ width: `${Math.min(100, (advisory.stats?.nudity?.count || 0) * 33)}%` }}
                />
              </div>
            </div>

            {/* THẺ 2: BẠO LỰC */}
            <div 
              className={`age-stat-card ${activeTab === 'violence' ? 'active-card' : ''}`}
              onClick={() => setActiveTab(activeTab === 'violence' ? 'all' : 'violence')}
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrap icon-swords">
                  <Swords size={20} />
                </div>
                <span className={`stat-level-pill ${getIntensityBadgeClass(advisory.stats?.violence?.level)}`}>
                  {advisory.stats?.violence?.label || 'Không có'}
                </span>
              </div>
              <div className="stat-card-middle">
                <span className="stat-count-num">{advisory.stats?.violence?.count || 0}</span>
                <span className="stat-count-label">Cảnh bạo lực & Đánh đấm</span>
              </div>
              <div className="stat-progress-bar">
                <div 
                  className="stat-progress-fill fill-swords"
                  style={{ width: `${Math.min(100, (advisory.stats?.violence?.count || 0) * 20)}%` }}
                />
              </div>
            </div>

            {/* THẺ 3: KINH DỊ MÁU ME */}
            <div 
              className={`age-stat-card ${activeTab === 'horror' ? 'active-card' : ''}`}
              onClick={() => setActiveTab(activeTab === 'horror' ? 'all' : 'horror')}
            >
              <div className="stat-card-top">
                <div className="stat-icon-wrap icon-skull">
                  <Skull size={20} />
                </div>
                <span className={`stat-level-pill ${getIntensityBadgeClass(advisory.stats?.horror?.level)}`}>
                  {advisory.stats?.horror?.label || 'Không có'}
                </span>
              </div>
              <div className="stat-card-middle">
                <span className="stat-count-num">{advisory.stats?.horror?.count || 0}</span>
                <span className="stat-count-label">Kinh dị, Máu me & Giật gân</span>
              </div>
              <div className="stat-progress-bar">
                <div 
                  className="stat-progress-fill fill-skull"
                  style={{ width: `${Math.min(100, (advisory.stats?.horror?.count || 0) * 25)}%` }}
                />
              </div>
            </div>
          </div>

          {/* TOOLBAR: TAB LỌC & SPOILER TOGGLE */}
          <div className="age-timeline-toolbar">
            <div className="age-tab-filters">
              <button 
                className={`age-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tất cả mốc thời gian ({advisory.scenes?.length || 0})
              </button>
              <button 
                className={`age-tab-btn ${activeTab === 'nudity' ? 'active' : ''}`}
                onClick={() => setActiveTab('nudity')}
              >
                <Flame size={14} /> Cảnh nóng ({advisory.stats?.nudity?.count || 0})
              </button>
              <button 
                className={`age-tab-btn ${activeTab === 'violence' ? 'active' : ''}`}
                onClick={() => setActiveTab('violence')}
              >
                <Swords size={14} /> Bạo lực ({advisory.stats?.violence?.count || 0})
              </button>
              <button 
                className={`age-tab-btn ${activeTab === 'horror' ? 'active' : ''}`}
                onClick={() => setActiveTab('horror')}
              >
                <Skull size={14} /> Kinh dị ({advisory.stats?.horror?.count || 0})
              </button>
            </div>

            <div className="spoiler-toggle-wrap">
              <button 
                className={`spoiler-toggle-btn ${hideSpoilers ? 'active' : ''}`}
                onClick={() => setHideSpoilers(!hideSpoilers)}
                title="Bật/Tắt che nội dung tiết lộ cốt truyện"
              >
                {hideSpoilers ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{hideSpoilers ? 'Đang che Spoiler' : 'Hiện toàn bộ'}</span>
              </button>
            </div>
          </div>

          {/* TIMELINE LIST CÁC CẢNH QUAY KÈM MỐC THỜI GIAN */}
          <div className="age-timeline-container">
            {filteredScenes.length === 0 ? (
              <div className="no-scenes-box">
                <CheckCircle2 size={32} className="check-icon" />
                <p>Không ghi nhận phân cảnh đáng ngại nào trong danh mục này.</p>
              </div>
            ) : (
              <div className="timeline-track">
                {filteredScenes.map((scene, idx) => {
                  const isMasked = hideSpoilers && scene.isSpoiler && !unmaskedScenes[scene.id];

                  return (
                    <div key={scene.id || idx} className={`timeline-scene-card category-${scene.category}`}>
                      {/* Cột trái: Mốc thời gian */}
                      <div className="scene-time-col">
                        <div className="time-pill">
                          <Clock size={13} />
                          <span>{scene.timestamp}</span>
                        </div>
                        <div className="timeline-line-connector" />
                      </div>

                      {/* Cột phải: Chi tiết cảnh */}
                      <div className="scene-content-card glass-panel">
                        <div className="scene-header">
                          <div className="scene-tags-left">
                            <span className={`scene-category-tag tag-${scene.category}`}>
                              {scene.categoryIcon} {scene.categoryName}
                            </span>
                            <span className={`scene-intensity-tag ${getIntensityBadgeClass(scene.intensity)}`}>
                              Mức độ: {scene.intensityLabel}
                            </span>
                          </div>

                          {scene.isSpoiler && (
                            <span className="scene-spoiler-indicator">
                              <AlertTriangle size={12} /> Tiết lộ cốt truyện
                            </span>
                          )}
                        </div>

                        <h4 className="scene-title">{scene.title}</h4>

                        {/* NỘI DUNG MÔ TẢ (KÈM LÀM MỜ NẾU LÀ SPOILER) */}
                        <div className={`scene-desc-wrap ${isMasked ? 'is-masked' : ''}`}>
                          <p className="scene-desc-text">
                            {scene.description}
                          </p>

                          {isMasked && (
                            <div className="spoiler-blur-overlay">
                              <div className="spoiler-blur-content">
                                <AlertTriangle size={16} />
                                <span>Cảnh này có thể tiết lộ nội dung phim</span>
                                <button 
                                  className="reveal-spoiler-btn"
                                  onClick={() => toggleSceneMask(scene.id)}
                                >
                                  <Eye size={13} /> Bấm để xem chi tiết
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LỜI KHUYÊN PHỤ HUYNH & NGƯỜI XEM */}
          {advisory.parentalGuidance && (
            <div className="parental-guidance-box">
              <div className="guidance-header">
                <Info size={16} className="info-icon" />
                <h4>Khuyến Nghị Người Xem & Phụ Huynh</h4>
              </div>
              <p className="guidance-body">{advisory.parentalGuidance}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

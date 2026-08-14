import React, { useState, useEffect } from 'react';
import { DEFAULT_WEIGHTS } from '../services/scoreEngine';
import { getStoredGeminiKey, saveStoredGeminiKey } from '../services/geminiService';
import { getStoredOmdbKey, saveStoredOmdbKey } from '../services/movieDataService';
import { Sliders, Key, RotateCcw, Check, Sparkles, Shield, HelpCircle, ExternalLink, Database } from 'lucide-react';
import './WeightSettingsModal.css';

export function WeightSettingsModal({
  isOpen,
  onClose,
  weights,
  onUpdateWeights
}) {
  const [localWeights, setLocalWeights] = useState(weights || DEFAULT_WEIGHTS);
  const [geminiKey, setGeminiKey] = useState('');
  const [omdbKey, setOmdbKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [omdbKeySaved, setOmdbKeySaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalWeights(weights || DEFAULT_WEIGHTS);
      setGeminiKey(getStoredGeminiKey());
      setOmdbKey(getStoredOmdbKey());
      setKeySaved(false);
      setOmdbKeySaved(false);
    }
  }, [isOpen, weights]);

  if (!isOpen) return null;

  const totalWeight = localWeights.imdb + localWeights.rtCritics + localWeights.rtAudience + localWeights.metacritic;

  const handleSliderChange = (key, value) => {
    setLocalWeights(prev => ({
      ...prev,
      [key]: parseInt(value, 10) || 0
    }));
  };

  const applyPreset = (preset) => {
    setLocalWeights(preset);
  };

  const handleSaveWeights = () => {
    onUpdateWeights(localWeights);
  };

  const handleResetWeights = () => {
    setLocalWeights(DEFAULT_WEIGHTS);
    onUpdateWeights(DEFAULT_WEIGHTS);
  };

  const handleSaveApiKey = () => {
    saveStoredGeminiKey(geminiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal glass-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="settings-header">
          <div className="settings-title-wrap">
            <Sliders size={22} className="settings-icon" />
            <div>
              <h3>Cài Đặt Trọng Số & Gemini API Key</h3>
              <p className="settings-sub">Cá nhân hóa công thức tính Unified Score và quản lý kết nối AI</p>
            </div>
          </div>
          <button className="settings-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* SECTION 1: CÂN CHỈNH TRỌNG SỐ */}
          <div className="settings-section">
            <div className="section-head-row">
              <h4 className="section-title">1. Tùy Biến Trọng Số Điểm Số (Custom Weighting)</h4>
              <span className="total-weight-pill" style={{ color: totalWeight === 100 ? '#34d399' : '#fbbf24' }}>
                Tổng tỷ trọng: {totalWeight}%
              </span>
            </div>
            <p className="section-hint">
              Bạn tin tưởng nguồn đánh giá nào nhất? Kéo thanh trượt để hệ thống tự động tính lại điểm tổng hợp trên toàn bộ website theo đúng gu của bạn.
            </p>

            {/* PRESETS */}
            <div className="presets-row">
              <span className="preset-label">Mẫu thiết lập nhanh:</span>
              <button
                className="preset-btn"
                onClick={() => applyPreset(DEFAULT_WEIGHTS)}
              >
                ⚖️ Cân bằng chuẩn
              </button>
              <button
                className="preset-btn"
                onClick={() => applyPreset({ imdb: 45, rtCritics: 10, rtAudience: 40, metacritic: 5 })}
              >
                🍿 Ưu tiên Khán giả
              </button>
              <button
                className="preset-btn"
                onClick={() => applyPreset({ imdb: 10, rtCritics: 45, rtAudience: 5, metacritic: 40 })}
              >
                🎭 Ưu tiên Phê bình
              </button>
              <button
                className="preset-btn"
                onClick={() => applyPreset({ imdb: 70, rtCritics: 10, rtAudience: 10, metacritic: 10 })}
              >
                ⭐ Fan cứng IMDb
              </button>
            </div>

            {/* SLIDERS LIST */}
            <div className="sliders-list">
              {/* IMDb */}
              <div className="slider-item">
                <div className="slider-label-wrap">
                  <span className="slider-brand imdb-brand">IMDb (Đại chúng & Người dùng toàn cầu)</span>
                  <span className="slider-val">{localWeights.imdb}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={localWeights.imdb}
                  onChange={(e) => handleSliderChange('imdb', e.target.value)}
                  className="slider-input slider-imdb"
                />
              </div>

              {/* RT Critics */}
              <div className="slider-item">
                <div className="slider-label-wrap">
                  <span className="slider-brand rt-critic-brand">🍅 Rotten Tomatoes (Giới Phê Bình Chuyên Nghiệp)</span>
                  <span className="slider-val">{localWeights.rtCritics}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={localWeights.rtCritics}
                  onChange={(e) => handleSliderChange('rtCritics', e.target.value)}
                  className="slider-input slider-rt-critic"
                />
              </div>

              {/* RT Audience */}
              <div className="slider-item">
                <div className="slider-label-wrap">
                  <span className="slider-brand rt-audience-brand">🍿 Rotten Tomatoes (Khán Giả Đã Xem Rạp)</span>
                  <span className="slider-val">{localWeights.rtAudience}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={localWeights.rtAudience}
                  onChange={(e) => handleSliderChange('rtAudience', e.target.value)}
                  className="slider-input slider-rt-audience"
                />
              </div>

              {/* Metascore */}
              <div className="slider-item">
                <div className="slider-label-wrap">
                  <span className="slider-brand mc-brand">Ⓜ Metacritic (Metascore - Trọng số Báo chí)</span>
                  <span className="slider-val">{localWeights.metacritic}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={localWeights.metacritic}
                  onChange={(e) => handleSliderChange('metacritic', e.target.value)}
                  className="slider-input slider-mc"
                />
              </div>
            </div>

            <div className="weights-action-row">
              <button className="reset-weights-btn" onClick={handleResetWeights}>
                <RotateCcw size={16} /> Khôi phục mặc định
              </button>
              <button className="apply-weights-btn" onClick={handleSaveWeights}>
                <Check size={16} /> Áp dụng trọng số
              </button>
            </div>
          </div>

          {/* SECTION 2: GEMINI API KEY */}
          <div className="settings-section">
            <div className="section-head-row">
              <h4 className="section-title">2. Cấu hình Google Gemini AI Key</h4>
              <span className="gemini-chip">
                <Sparkles size={13} /> Tra cứu thời gian thực
              </span>
            </div>
            <p className="section-hint">
              Nhập API Key của bạn để sử dụng AI tra cứu và tổng hợp điểm số từ IMDb, Rotten Tomatoes và Metacritic cho bất kỳ bộ phim nào chưa có trong hệ thống.
            </p>

            <div className="api-key-form">
              <div className="key-input-wrap">
                <Key size={18} className="key-input-icon" />
                <input
                  type={showKey ? 'text' : 'password'}
                  className="key-input"
                  placeholder="Dán mã Gemini API Key (ví dụ: AIzaSy...)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-key-visibility"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? 'Ẩn' : 'Hiện'}
                </button>
              </div>

              <button className="save-key-btn" onClick={handleSaveApiKey}>
                {keySaved ? (
                  <>
                    <Check size={16} /> Đã lưu
                  </>
                ) : (
                  'Lưu Key'
                )}
              </button>
            </div>

            <div className="key-guide-box">
              <Shield size={16} className="guide-icon" />
              <div className="guide-text">
                <span>Key của bạn được lưu an toàn trong trình duyệt (LocalStorage), không chia sẻ ra bên ngoài.</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="guide-link"
                >
                  Nhận API Key miễn phí tại Google AI Studio <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* SECTION 3: OMDB LIVE API KEY */}
          <div className="settings-section">
            <div className="section-head-row">
              <h4 className="section-title">3. Nguồn Dữ Liệu Thực Tế OMDb (IMDb, RT, Metacritic)</h4>
              <span className="gemini-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <Database size={13} /> Sẵn sàng hoạt động
              </span>
            </div>
            <p className="section-hint">
              Hệ thống đã tích hợp sẵn kho API Key OMDb công khai để lấy điểm số thực tế 100% từ IMDb, Rotten Tomatoes và Metacritic. Bạn cũng có thể dùng key cá nhân nếu muốn.
            </p>

            <div className="api-key-form">
              <div className="key-input-wrap">
                <Key size={18} className="key-input-icon" />
                <input
                  type="text"
                  className="key-input"
                  placeholder="Mã OMDb API Key cá nhân (tùy chọn)"
                  value={omdbKey}
                  onChange={(e) => setOmdbKey(e.target.value)}
                />
              </div>

              <button className="save-key-btn" onClick={() => {
                saveStoredOmdbKey(omdbKey);
                setOmdbKeySaved(true);
                setTimeout(() => setOmdbKeySaved(false), 3000);
              }}>
                {omdbKeySaved ? (
                  <>
                    <Check size={16} /> Đã lưu
                  </>
                ) : (
                  'Lưu Key'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="done-btn" onClick={onClose}>
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}

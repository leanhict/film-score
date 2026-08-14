import React from 'react';
import { normalizeScores, calculateDiscrepancy, getScoreColor } from '../services/scoreEngine';
import { BarChart3, Users, Award, Scale } from 'lucide-react';
import './ScoreComparisonBar.css';

export function ScoreComparisonBar({ ratings = {}, compact = false }) {
  const normalized = normalizeScores(ratings);
  const discrepancy = calculateDiscrepancy(ratings);

  const sources = [
    {
      id: 'imdb',
      label: 'IMDb',
      score: normalized.imdb,
      display: ratings.imdb ? `${ratings.imdb.toFixed(1)} / 10` : 'N/A',
      color: '#f5c518',
      icon: '★',
      type: 'Khán giả & Đại chúng'
    },
    {
      id: 'rtCritics',
      label: 'Rotten Tomatoes (Phê bình)',
      score: normalized.rtCritics,
      display: ratings.rtCritics ? `${ratings.rtCritics}%` : 'N/A',
      color: '#fa320a',
      icon: '🍅',
      type: 'Giới Chuyên Môn'
    },
    {
      id: 'rtAudience',
      label: 'Rotten Tomatoes (Khán giả)',
      score: normalized.rtAudience,
      display: ratings.rtAudience ? `${ratings.rtAudience}%` : 'N/A',
      color: '#f9c80e',
      icon: '🍿',
      type: 'Khán Giả Rạp'
    },
    {
      id: 'metascore',
      label: 'Metacritic (Metascore)',
      score: normalized.metascore,
      display: ratings.metascore ? `${ratings.metascore} / 100` : 'N/A',
      color: '#66cc33',
      icon: 'Ⓜ',
      type: 'Báo Chí & Hàn Lâm'
    }
  ];

  if (compact) {
    return (
      <div className="score-bars-compact">
        {sources.map(src => src.score !== null && (
          <div key={src.id} className="compact-bar-item">
            <div className="compact-bar-info">
              <span className="compact-bar-icon">{src.icon}</span>
              <span className="compact-bar-label">{src.label.split(' ')[0]}</span>
              <span className="compact-bar-value" style={{ color: src.color }}>{src.display}</span>
            </div>
            <div className="compact-bar-track">
              <div
                className="compact-bar-fill"
                style={{ width: `${src.score}%`, backgroundColor: src.color }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="score-comparison-wrapper glass-panel">
      <div className="comparison-header">
        <div className="comparison-title-wrap">
          <BarChart3 className="header-icon" size={20} />
          <h3>Phân Tích & Đối Chiếu Điểm Số Đa Chiều</h3>
        </div>
        <span className="scale-pill">Chuẩn hóa thang điểm 100</span>
      </div>

      <div className="comparison-bars-list">
        {sources.map(src => {
          if (src.score === null) return null;
          return (
            <div key={src.id} className="bar-row">
              <div className="bar-label-group">
                <span className="source-badge-icon" style={{ borderColor: src.color }}>
                  {src.icon}
                </span>
                <div className="bar-text-meta">
                  <span className="bar-source-name">{src.label}</span>
                  <span className="bar-source-type">{src.type}</span>
                </div>
                <div className="bar-score-highlight" style={{ color: src.color }}>
                  {src.display}
                </div>
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${src.score}%`,
                    background: `linear-gradient(90deg, ${src.color}aa, ${src.color})`
                  }}
                >
                  <span className="bar-fill-indicator">{src.score}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* THẺ ĐỐI CHIẾU CHÊNH LỆCH PHÊ BÌNH VS KHÁN GIẢ */}
      <div className={`discrepancy-card discrepancy-${discrepancy.type}`}>
        <div className="discrepancy-header">
          <Scale size={18} className="disc-icon" />
          <span className="disc-title">Đối Chiếu: Giới Phê Bình vs. Khán Giả</span>
          {discrepancy.gap !== 0 && (
            <span className="disc-badge">
              Chênh lệch: {discrepancy.gap > 0 ? `+${discrepancy.gap}` : discrepancy.gap} điểm
            </span>
          )}
        </div>

        <div className="disc-metric-row">
          <div className="disc-pillar">
            <Award size={16} className="pillar-icon critic-color" />
            <div>
              <span className="pillar-label">Điểm Giới Phê Bình</span>
              <span className="pillar-val">{discrepancy.avgCritic !== null ? `${discrepancy.avgCritic}/100` : 'N/A'}</span>
            </div>
          </div>

          <div className="disc-vs">VS</div>

          <div className="disc-pillar">
            <Users size={16} className="pillar-icon audience-color" />
            <div>
              <span className="pillar-label">Điểm Khán Giả Đại Chúng</span>
              <span className="pillar-val">{discrepancy.avgAudience !== null ? `${discrepancy.avgAudience}/100` : 'N/A'}</span>
            </div>
          </div>
        </div>

        <p className="disc-desc">{discrepancy.description}</p>
      </div>
    </div>
  );
}

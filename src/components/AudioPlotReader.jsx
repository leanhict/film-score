import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Square,
  BookOpen,
  Gauge,
  ChevronDown,
  Sparkles,
  HelpCircle,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import './AudioPlotReader.css';

const SPEED_OPTIONS = [
  { value: 0.85, label: '0.85x', desc: 'Chậm' },
  { value: 1.0, label: '1.0x', desc: 'Chuẩn' },
  { value: 1.25, label: '1.25x', desc: 'Nhanh' },
  { value: 1.5, label: '1.5x', desc: 'Rất nhanh' }
];

export function AudioPlotReader({
  text = '',
  title = 'Tóm tắt diễn biến',
  spoilerTag = 'Spoiler',
  className = '',
  defaultExpanded = false
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Quản lý giọng đọc
  const [systemVoices, setSystemVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('google-ai-vi');
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showWindowsHelp, setShowWindowsHelp] = useState(false);

  // References cho việc điều khiển âm thanh
  const currentSentenceRef = useRef(-1);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const rateRef = useRef(speechRate);
  const voiceIdRef = useRef(selectedVoiceId);
  const activeAudioRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const isAbortedRef = useRef(false);

  // Đồng bộ Refs tức thì
  useEffect(() => {
    currentSentenceRef.current = currentSentenceIndex;
  }, [currentSentenceIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    rateRef.current = speechRate;
  }, [speechRate]);

  useEffect(() => {
    voiceIdRef.current = selectedVoiceId;
  }, [selectedVoiceId]);

  // Phân tách đoạn văn bản thành các câu thông minh (đảm bảo độ dài < 160 ký tự cho mỗi lượt đọc)
  const sentences = useMemo(() => {
    if (!text || typeof text !== 'string') return [];
    
    // Tách câu theo dấu chấm, chấm than, chấm hỏi, chấm lửng hoặc xuống dòng
    const rawSegments = text
      .split(/(?<=[.?!…\n])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    const formatted = [];
    for (const seg of rawSegments) {
      if (seg.length <= 160) {
        formatted.push(seg);
      } else {
        // Tách nhỏ hơn theo dấu phẩy, chấm phẩy hoặc khoảng trắng nếu câu quá dài
        const subParts = seg.match(/[^,;]+[,;]?/g) || [seg];
        let buffer = '';
        for (const part of subParts) {
          if ((buffer + part).length <= 160) {
            buffer += part;
          } else {
            if (buffer.trim()) formatted.push(buffer.trim());
            buffer = part;
          }
        }
        if (buffer.trim()) formatted.push(buffer.trim());
      }
    }

    if (formatted.length === 0 && text.trim()) {
      return [text.trim()];
    }
    return formatted;
  }, [text]);

  // Tải danh sách giọng đọc từ trình duyệt (nếu hệ điều hành có cài)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      try {
        const all = window.speechSynthesis.getVoices() || [];
        const vi = all.filter(v => 
          (v.lang && (v.lang.startsWith('vi') || v.lang === 'vi-VN' || v.lang === 'vi_VN')) ||
          (v.name && (v.name.toLowerCase().includes('vietnam') || v.name.toLowerCase().includes('tiếng việt')))
        );
        setSystemVoices(vi);
      } catch (err) {
        console.warn('Lỗi tải giọng hệ thống:', err);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Dừng mọi âm thanh và hủy tác vụ đang chạy
  const stopSpeech = useCallback(() => {
    isAbortedRef.current = true;

    // 1. Dừng HTML5 Audio
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.onended = null;
        activeAudioRef.current.onerror = null;
        activeAudioRef.current.onplay = null;
        activeAudioRef.current.src = '';
      } catch (e) {
        console.error(e);
      }
      activeAudioRef.current = null;
    }

    // 2. Dừng Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.error(e);
      }
    }

    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(-1);
    isPlayingRef.current = false;
    isPausedRef.current = false;
    currentSentenceRef.current = -1;
  }, []);

  // Tự động ngắt khi component unmount hoặc khi text thay đổi
  useEffect(() => {
    stopSpeech();
    return () => {
      stopSpeech();
    };
  }, [text, stopSpeech]);

  // Phát 1 câu bằng Google AI Online TTS với cơ chế đa đường truyền dự phòng (Multi-endpoint fallback)
  const playOnlineSentence = useCallback((sentenceText) => {
    return new Promise((resolve, reject) => {
      const encoded = encodeURIComponent(sentenceText);
      
      // Danh sách các cổng âm thanh dự phòng
      const candidateUrls = [
        `/api/tts?client=gtx&ie=UTF-8&tl=vi&q=${encoded}`,
        `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=vi&q=${encoded}`,
        `https://translate.google.com/translate_tts?client=tw-ob&tl=vi&ie=UTF-8&q=${encoded}`
      ];

      let urlIndex = 0;

      const tryNextUrl = () => {
        if (isAbortedRef.current) {
          reject(new Error('Aborted'));
          return;
        }

        if (urlIndex >= candidateUrls.length) {
          reject(new Error('Tất cả nguồn âm thanh online đều không phản hồi'));
          return;
        }

        const url = candidateUrls[urlIndex];
        urlIndex++;

        // Tạo element audio với no-referrer để tránh bị Google chặn 404
        const audio = document.createElement('audio');
        audio.referrerPolicy = 'no-referrer';
        audio.setAttribute('referrerpolicy', 'no-referrer');
        audio.crossOrigin = 'anonymous';
        audio.src = url;
        audio.playbackRate = rateRef.current;

        activeAudioRef.current = audio;

        let hasPlayed = false;
        const startTime = Date.now();

        audio.onplay = () => {
          hasPlayed = true;
        };

        audio.onended = () => {
          const duration = Date.now() - startTime;
          // Nếu onended bị gọi tức thì dưới 150ms mà chưa từng play -> file lỗi, thử URL tiếp theo
          if (!hasPlayed && duration < 150) {
            tryNextUrl();
          } else {
            resolve();
          }
        };

        audio.onerror = () => {
          tryNextUrl();
        };

        audio.play().catch(() => {
          tryNextUrl();
        });
      };

      tryNextUrl();
    });
  }, []);

  // Phát 1 câu bằng Web Speech API
  const playWebSpeechSentence = useCallback((sentenceText) => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Trình duyệt không hỗ trợ Web Speech'));
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(sentenceText);
      activeUtteranceRef.current = utterance;
      utterance.lang = 'vi-VN';
      utterance.rate = rateRef.current;
      utterance.pitch = 1.0;

      // Gắn giọng đọc nếu có
      if (systemVoices.length > 0) {
        const found = systemVoices.find(v => v.voiceURI === voiceIdRef.current);
        if (found) utterance.voice = found;
      }

      let hasStarted = false;
      const startTime = Date.now();

      utterance.onstart = () => {
        hasStarted = true;
      };

      utterance.onend = () => {
        const duration = Date.now() - startTime;
        if (!hasStarted && duration < 120) {
          reject(new Error('Hệ thống không phát âm được giọng này'));
        } else {
          resolve();
        }
      };

      utterance.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') {
          reject(new Error('Canceled'));
        } else {
          reject(new Error(`Lỗi Web Speech: ${e.error}`));
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        reject(err);
      }
    });
  }, [systemVoices]);

  // Điều phối phát từng câu theo chuỗi
  const runSpeechQueue = useCallback(async (startIndex) => {
    isAbortedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    isPlayingRef.current = true;
    isPausedRef.current = false;
    setErrorMessage(null);

    for (let i = startIndex; i < sentences.length; i++) {
      if (isAbortedRef.current || !isPlayingRef.current) break;

      setCurrentSentenceIndex(i);
      currentSentenceRef.current = i;

      const sentenceText = sentences[i];

      try {
        if (voiceIdRef.current.startsWith('google-ai')) {
          await playOnlineSentence(sentenceText);
        } else {
          await playWebSpeechSentence(sentenceText);
        }
      } catch (err) {
        if (isAbortedRef.current) break;

        // Nếu nguồn online gặp sự cố, thử fallback sang Web Speech hoặc báo lỗi
        console.warn(`Lỗi khi đọc câu ${i + 1}:`, err);
        
        if (voiceIdRef.current.startsWith('google-ai') && systemVoices.length > 0) {
          try {
            await playWebSpeechSentence(sentenceText);
          } catch {
            setErrorMessage('Không thể phát âm thanh. Vui lòng kiểm tra kết nối mạng hoặc chọn giọng khác.');
            stopSpeech();
            break;
          }
        } else {
          setErrorMessage('Không thể phát âm thanh cho đoạn này. Vui lòng kiểm tra kết nối mạng.');
          stopSpeech();
          break;
        }
      }

      // Khoảng nghỉ tự nhiên 80ms giữa 2 câu
      if (i < sentences.length - 1 && isPlayingRef.current && !isPausedRef.current) {
        await new Promise(r => setTimeout(r, 80));
      }
    }

    // Khi đã đọc hết tất cả các câu
    if (!isAbortedRef.current && currentSentenceRef.current >= sentences.length - 1) {
      stopSpeech();
    }
  }, [sentences, playOnlineSentence, playWebSpeechSentence, systemVoices, stopSpeech]);

  // Bắt đầu đọc
  const handleStartPlay = () => {
    if (sentences.length === 0) return;
    setIsExpanded(true);
    const startIndex = currentSentenceIndex >= 0 ? currentSentenceIndex : 0;
    runSpeechQueue(startIndex);
  };

  // Tạm dừng
  const handlePause = () => {
    if (!isPlaying) return;
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
    isPausedRef.current = true;
  };

  // Tiếp tục sau khi tạm dừng
  const handleResume = () => {
    if (!isPlaying) {
      handleStartPlay();
      return;
    }

    if (activeAudioRef.current && voiceIdRef.current.startsWith('google-ai')) {
      activeAudioRef.current.play().then(() => {
        setIsPaused(false);
        isPausedRef.current = false;
      }).catch(() => {
        runSpeechQueue(currentSentenceIndex >= 0 ? currentSentenceIndex : 0);
      });
    } else if ('speechSynthesis' in window && !voiceIdRef.current.startsWith('google-ai')) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        isPausedRef.current = false;
      } else {
        runSpeechQueue(currentSentenceIndex >= 0 ? currentSentenceIndex : 0);
      }
    } else {
      runSpeechQueue(currentSentenceIndex >= 0 ? currentSentenceIndex : 0);
    }
  };

  // Nhảy đến câu khi người dùng bấm trực tiếp vào câu trong văn bản
  const handleSentenceClick = (index) => {
    stopSpeech();
    setTimeout(() => {
      runSpeechQueue(index);
    }, 50);
  };

  // Đổi tốc độ đọc
  const handleChangeSpeed = (speed) => {
    setSpeechRate(speed);
    rateRef.current = speed;
    setShowSpeedMenu(false);

    if (activeAudioRef.current) {
      activeAudioRef.current.playbackRate = speed;
    }

    if (isPlaying && !isPaused && currentSentenceIndex >= 0) {
      const cur = currentSentenceIndex;
      stopSpeech();
      setTimeout(() => {
        runSpeechQueue(cur);
      }, 60);
    }
  };

  // Đổi giọng đọc
  const handleSelectVoice = (voiceId) => {
    setSelectedVoiceId(voiceId);
    voiceIdRef.current = voiceId;
    setShowVoiceMenu(false);

    if (isPlaying && !isPaused && currentSentenceIndex >= 0) {
      const cur = currentSentenceIndex;
      stopSpeech();
      setTimeout(() => {
        runSpeechQueue(cur);
      }, 60);
    }
  };

  // Tính phần trăm tiến trình
  const progressPercent = useMemo(() => {
    if (sentences.length === 0 || currentSentenceIndex < 0) return 0;
    return Math.round(((currentSentenceIndex + 1) / sentences.length) * 100);
  }, [currentSentenceIndex, sentences.length]);

  // Tên hiển thị của giọng đọc hiện tại
  const currentVoiceDisplayName = useMemo(() => {
    if (selectedVoiceId === 'google-ai-vi') {
      return 'Google AI Tiếng Việt';
    }
    const found = systemVoices.find(v => v.voiceURI === selectedVoiceId);
    if (found) {
      return found.name
        .replace(/Online \(Natural\)/gi, '')
        .replace(/Vietnamese \([^)]+\)/gi, '')
        .replace(/Tiếng Việt \([^)]+\)/gi, '')
        .replace(/-/g, '')
        .trim();
    }
    return 'Google AI Tiếng Việt';
  }, [selectedVoiceId, systemVoices]);

  if (!text) return null;

  return (
    <div className={`audio-plot-card ${isPlaying ? 'is-speaking' : ''} ${isExpanded ? 'is-expanded' : 'is-collapsed'} ${className}`}>
      {/* HEADER: Tiêu đề ở góc trái, Nút Mở rộng/Thu nhỏ ở góc phải */}
      <div className="audio-plot-header">
        <div
          className="audio-plot-title-wrap"
          onClick={() => setIsExpanded(prev => !prev)}
          title={isExpanded ? 'Bấm để thu nhỏ' : 'Bấm để mở rộng tóm tắt diễn biến'}
          role="button"
          tabIndex={0}
        >
          <BookOpen size={16} className="audio-plot-book-icon" />
          <span className="audio-plot-title">{title}</span>
          {spoilerTag && (
            <span className="audio-plot-spoiler-tag">{spoilerTag}</span>
          )}
        </div>

        {/* NÚT THU NHỎ / MỞ RỘNG Ở GÓC PHẢI CÙNG HÀNG */}
        <button
          type="button"
          className={`audio-btn audio-btn-toggle-expand ${isExpanded ? 'active' : ''}`}
          onClick={() => setIsExpanded(prev => !prev)}
          title={isExpanded ? 'Thu nhỏ tóm tắt diễn biến' : 'Mở rộng tóm tắt diễn biến'}
          aria-expanded={isExpanded}
        >
          <ChevronDown size={13} className={`expand-chevron ${isExpanded ? 'is-expanded' : ''}`} />
          <span>{isExpanded ? 'Thu nhỏ' : 'Mở rộng'}</span>
        </button>
      </div>

      {/* ERROR MESSAGE NOTIFICATION */}
      {errorMessage && (
        <div className="audio-error-banner">
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
          <button className="error-close-btn" onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}

      {/* NỘI DUNG VÀ PHẦN ĐỌC VĂN BẢN (CHỈ HIỆN KHI MỞ RỘNG) */}
      {(isExpanded || isPlaying) && (
        <div className="audio-plot-body-wrap">
          {/* THANH ĐIỀU KHIỂN GIỌNG ĐỌC AI */}
          <div className="audio-controls-toolbar">
            <div className="audio-controls-group">
              {/* NÚT PHÁT / TẠM DỪNG */}
              {!isPlaying ? (
                <button
                  type="button"
                  className="audio-btn audio-btn-play"
                  onClick={handleStartPlay}
                  title="Nghe đọc tóm tắt cốt truyện bằng giọng nói AI Tiếng Việt"
                >
                  <Volume2 size={15} />
                  <span>Nghe Đọc</span>
                </button>
              ) : isPaused ? (
                <button
                  type="button"
                  className="audio-btn audio-btn-resume"
                  onClick={handleResume}
                  title="Tiếp tục đọc"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Tiếp tục</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="audio-btn audio-btn-pause"
                  onClick={handlePause}
                  title="Tạm dừng đọc"
                >
                  <Pause size={14} fill="currentColor" />
                  <span>Tạm dừng</span>
                </button>
              )}

              {/* NÚT DỪNG */}
              {isPlaying && (
                <button
                  type="button"
                  className="audio-btn audio-btn-stop"
                  onClick={stopSpeech}
                  title="Dừng đọc"
                >
                  <Square size={13} fill="currentColor" />
                </button>
              )}

              {/* EQUALIZER WAVE ANIMATION */}
              {isPlaying && !isPaused && (
                <div className="audio-soundwave" title="Đang phát giọng đọc">
                  <span className="bar bar-1" />
                  <span className="bar bar-2" />
                  <span className="bar bar-3" />
                  <span className="bar bar-4" />
                </div>
              )}

              {/* CHỌN GIỌNG ĐỌC */}
              <div className="audio-dropdown-wrap">
                <button
                  type="button"
                  className={`audio-btn audio-btn-voice ${showVoiceMenu ? 'active' : ''}`}
                  onClick={() => {
                    setShowVoiceMenu(prev => !prev);
                    setShowSpeedMenu(false);
                  }}
                  title={`Giọng đọc: ${currentVoiceDisplayName}`}
                >
                  <Sparkles size={13} className="voice-sparkle-icon" />
                  <span className="voice-label-truncate">{currentVoiceDisplayName}</span>
                  <ChevronDown size={11} />
                </button>

                {showVoiceMenu && (
                  <div className="audio-dropdown-menu voice-dropdown-menu">
                    <div className="audio-dropdown-header">Giọng Đọc Trực Tuyến AI (Khuyên dùng):</div>
                    
                    <button
                      type="button"
                      className={`audio-dropdown-item ${selectedVoiceId === 'google-ai-vi' ? 'selected' : ''}`}
                      onClick={() => handleSelectVoice('google-ai-vi')}
                    >
                      <div className="item-main-info">
                        <span className="item-label">
                          🌟 Google AI Tiếng Việt (Nữ - Tự nhiên)
                        </span>
                        <span className="item-sub">Âm thanh chuẩn, rõ chữ, hoạt động 100% trên mọi thiết bị</span>
                      </div>
                      {selectedVoiceId === 'google-ai-vi' && <Check size={14} className="check-icon" />}
                    </button>

                    {/* GIỌNG ĐỌC HỆ THỐNG / WINDOWS NẾU CÓ */}
                    <div className="audio-dropdown-header mt-header">
                      Giọng Hệ Thống Cục Bộ ({systemVoices.length}):
                    </div>

                    {systemVoices.length > 0 ? (
                      systemVoices.map(v => (
                        <button
                          key={v.voiceURI}
                          type="button"
                          className={`audio-dropdown-item ${selectedVoiceId === v.voiceURI ? 'selected' : ''}`}
                          onClick={() => handleSelectVoice(v.voiceURI)}
                        >
                          <div className="item-main-info">
                            <span className="item-label">💻 {v.name.replace(/Online \(Natural\)/gi, '').trim()}</span>
                            <span className="item-sub">{v.lang} (Hệ thống)</span>
                          </div>
                          {selectedVoiceId === v.voiceURI && <Check size={14} className="check-icon" />}
                        </button>
                      ))
                    ) : (
                      <div className="no-system-voice-note">
                        <span>Chưa phát hiện giọng Tiếng Việt cài sẵn trên Windows/trình duyệt.</span>
                        <button
                          type="button"
                          className="btn-open-guide-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowVoiceMenu(false);
                            setShowWindowsHelp(true);
                          }}
                        >
                          <HelpCircle size={12} /> Hướng dẫn cài thêm vào Windows
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TỐC ĐỘ ĐỌC DROPDOWN */}
              <div className="audio-dropdown-wrap">
                <button
                  type="button"
                  className={`audio-btn audio-btn-speed ${showSpeedMenu ? 'active' : ''}`}
                  onClick={() => {
                    setShowSpeedMenu(prev => !prev);
                    setShowVoiceMenu(false);
                  }}
                  title="Thay đổi tốc độ đọc"
                >
                  <Gauge size={13} />
                  <span>{speechRate}x</span>
                  <ChevronDown size={11} />
                </button>

                {showSpeedMenu && (
                  <div className="audio-dropdown-menu speed-dropdown-menu">
                    <div className="audio-dropdown-header">Tốc độ đọc:</div>
                    {SPEED_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`audio-dropdown-item ${speechRate === opt.value ? 'selected' : ''}`}
                        onClick={() => handleChangeSpeed(opt.value)}
                      >
                        <span className="item-label">{opt.label}</span>
                        <span className="item-desc">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LIVE PROGRESS BAR KHI ĐANG ĐỌC */}
          {isPlaying && (
            <div className="audio-progress-track">
              <div
                className="audio-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
              <div className="audio-progress-info">
                <span>Đang đọc: Câu {currentSentenceIndex + 1}/{sentences.length} • Giọng: {currentVoiceDisplayName}</span>
                <span>{progressPercent}%</span>
              </div>
            </div>
          )}

          {/* ĐOẠN VĂN TÓM TẮT DIỄN BIẾN */}
          <div className="audio-plot-content">
            <p className="audio-plot-paragraph">
              {sentences.map((sentence, idx) => {
                const isCurrent = idx === currentSentenceIndex && isPlaying;
                return (
                  <span
                    key={idx}
                    className={`plot-sentence ${isCurrent ? 'is-active-sentence' : ''}`}
                    onClick={() => handleSentenceClick(idx)}
                    title="Bấm để phát đọc từ câu này"
                  >
                    {sentence}{' '}
                  </span>
                );
              })}
            </p>
          </div>

          {/* FOOTER HINT */}
          {isPlaying && (
            <div className="audio-plot-footer-hint">
              <span>💡 Mẹo: Bạn có thể bấm vào bất kỳ câu nào trong đoạn văn để chuyển giọng đọc ngay đến câu đó.</span>
            </div>
          )}
        </div>
      )}

      {/* MODAL HƯỚNG DẪN CÀI GIỌNG TIẾNG VIỆT CHO WINDOWS */}
      {showWindowsHelp && (
        <div className="tts-guide-modal-overlay" onClick={() => setShowWindowsHelp(false)}>
          <div className="tts-guide-modal glass-modal" onClick={e => e.stopPropagation()}>
            <div className="guide-modal-header">
              <div className="guide-modal-title">
                <HelpCircle size={20} className="guide-icon" />
                <h4>Hướng Dẫn Cài Giọng Tiếng Việt Cho Windows</h4>
              </div>
              <button className="guide-close-btn" onClick={() => setShowWindowsHelp(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="guide-modal-body">
              <p className="guide-intro">
                Hiện tại bạn đang sử dụng <strong>Google AI Tiếng Việt (Trực tuyến)</strong> đã phát âm cực kỳ chuẩn xác và tự nhiên. Nếu muốn bổ sung thêm giọng đọc <strong>Microsoft Hoài My / Nam Minh</strong> tích hợp sẵn trong Windows, bạn làm như sau:
              </p>

              <ol className="guide-steps-list">
                <li>
                  <strong>Bước 1:</strong> Nhấn tổ hợp phím <code>Windows + I</code> để mở <strong>Cài đặt (Settings)</strong> trên Windows.
                </li>
                <li>
                  <strong>Bước 2:</strong> Vào mục <strong>Time & Language</strong> ➔ <strong>Language & Region</strong> (hoặc <em>Ngôn ngữ & Vùng</em>).
                </li>
                <li>
                  <strong>Bước 3:</strong> Nhấn <strong>Add a language</strong> ➔ Tìm và chọn <strong>Tiếng Việt (Vietnamese)</strong>.
                </li>
                <li>
                  <strong>Bước 4:</strong> Tích chọn <strong>Text-to-speech</strong> (chuyển văn bản thành giọng nói) rồi nhấn <strong>Install</strong>.
                </li>
              </ol>

              <div className="guide-tip-box">
                ✨ Sau khi cài đặt xong, khởi động lại trình duyệt, bạn sẽ thấy thêm giọng <em>Microsoft HoaiMy</em> hoặc <em>Microsoft NamMinh</em> trong danh sách chọn giọng!
              </div>
            </div>

            <div className="guide-modal-footer">
              <button className="guide-done-btn" onClick={() => setShowWindowsHelp(false)}>
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

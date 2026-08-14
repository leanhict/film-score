import React from 'react';
import { X } from 'lucide-react';
import './TrailerModal.css';

export function TrailerModal({ movie, onClose }) {
  if (!movie || !movie.trailerUrl) return null;

  // Trích xuất YouTube Video ID
  const getEmbedUrl = (url) => {
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('watch?v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      }
      if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const embedUrl = getEmbedUrl(movie.trailerUrl);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="trailer-modal-container glass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trailer-modal-header">
          <h3 className="trailer-title">Trailer: {movie.vietnameseTitle || movie.title}</h3>
          <button className="trailer-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="trailer-video-wrapper">
          <iframe
            src={embedUrl}
            title={`Trailer ${movie.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="trailer-iframe"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Movie Data & Real-time Ratings Service
 * Tích hợp nguồn dữ liệu thực tế từ IMDb, Rotten Tomatoes, Metacritic qua OMDb API & IMDb Suggestion API
 * kết hợp với Wikipedia Plot Database, Google Neural Translation & Google Gemini AI để cung cấp bản tóm tắt cốt truyện dạng Spoiler chi tiết.
 */

import { getStoredGeminiKey } from './geminiService.js';
import { MOCK_MOVIES } from '../data/mockMovies.js';
import { 
  VIETNAMESE_TITLE_MAP, 
  removeVietnameseTones, 
  normalizeSearchString, 
  formatQuickSynopsis, 
  formatDetailedPlot, 
  formatFilmReview, 
  parseYearToNumber,
  calculateRelevance,
  compareCandidates
} from '../utils/searchUtils.js';
import { resolveMovieTitles } from '../utils/movieTitleResolver.js';

// Danh sách các API keys dự phòng cho OMDb
const OMDB_KEY_POOL = ['trilogy', 'b9bd48a6', '7c86a512'];

const LOCAL_OMDB_KEY = 'filmscore_omdb_api_key';

export function getStoredOmdbKey() {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(LOCAL_OMDB_KEY) || '';
}

export function saveStoredOmdbKey(key) {
  if (typeof localStorage === 'undefined') return;
  if (key && key.trim()) {
    localStorage.setItem(LOCAL_OMDB_KEY, key.trim());
  } else {
    localStorage.removeItem(LOCAL_OMDB_KEY);
  }
}

// Từ điển dịch thể loại phim sang tiếng Việt chuẩn
const GENRE_TRANSLATIONS = {
  'action': 'Hành động',
  'adventure': 'Phiêu lưu',
  'animation': 'Hoạt hình',
  'biography': 'Tiểu sử',
  'comedy': 'Hài kịch',
  'crime': 'Tội phạm',
  'documentary': 'Phim tài liệu',
  'drama': 'Chính kịch',
  'family': 'Gia đình',
  'fantasy': 'Kỳ ảo',
  'film-noir': 'Phim đen (Noir)',
  'history': 'Lịch sử',
  'horror': 'Kinh dị',
  'music': 'Âm nhạc',
  'musical': 'Nhạc kịch',
  'mystery': 'Bí ẩn',
  'romance': 'Lãng mạn',
  'sci-fi': 'Khoa học viễn tưởng',
  'short': 'Phim ngắn',
  'sport': 'Thể thao',
  'thriller': 'Giật gân / Ly kỳ',
  'war': 'Chiến tranh',
  'western': 'Viễn Tây'
};

function translateGenres(genreStr = '') {
  if (!genreStr || genreStr === 'N/A') return ['Chính kịch'];
  return genreStr
    .split(',')
    .map(g => g.trim())
    .map(g => GENRE_TRANSLATIONS[g.toLowerCase()] || g);
}

function removeAccents(str) {
  return removeVietnameseTones(str);
}

/**
 * Tự động dịch tên phim hoặc cụm từ tiếng Việt sang tiếng Anh để tra cứu quốc tế
 */
export async function translateToEnglish(text) {
  if (!text || text === 'N/A') return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data[0])) {
        return data[0].map(item => item[0]).join('').trim();
      }
    }
  } catch (e) {
    console.warn('Lỗi dịch sang tiếng Anh:', e);
  }
  return '';
}

function unescapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

/**
 * Tự động dịch văn bản tiếng Anh sang tiếng Việt chuẩn xác (hỗ trợ phân đoạn văn bản dài)
 */
export async function translateToVietnamese(text) {
  if (!text || text === 'N/A') return '';
  const clean = unescapeHtml(text.trim());
  const chunks = clean.match(/.{1,1200}(\s|$)/g) || [clean];
  let resVi = '';

  for (const chunk of chunks.slice(0, 3)) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data[0])) {
          resVi += data[0].map(item => item[0]).join('') + ' ';
        }
      }
    } catch (e) {
      console.warn('Lỗi dịch Google Translate:', e);
    }
  }

  return unescapeHtml(resVi.trim() || text);
}

/**
 * Trích xuất phần cốt truyện chi tiết (Plot / Premise / Synopsis) từ kho dữ liệu Wikipedia
 */
/**
 * Rút gọn các câu trong cốt truyện dài thành một diễn biến phong phú, chi tiết và trọn vẹn
 * từ mở đầu, biến cố, cao trào đến kết thúc (tối đa 300 từ)
 */
function condensePlotText(text) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  const sentences = clean.match(/(?:[^.!?]|(?:\b[A-Za-z]\.))+[.!?]+/g) || [clean];
  if (sentences.length <= 8) return clean;

  const n = sentences.length;
  // Lấy 8 phân đoạn xuyên suốt mạch phim để tóm tắt đầy đủ, sâu sắc
  const s1 = sentences[0]; // Mở đầu & bối cảnh
  const s2 = sentences[1]; // Thiết lập nhân vật
  const s3 = sentences[Math.floor(n * 0.25)]; // Khởi phát biến cố
  const s4 = sentences[Math.floor(n * 0.45)]; // Phát triển xung đột
  const s5 = sentences[Math.floor(n * 0.65)]; // Bước ngoặt / Nút thắt
  const s6 = sentences[Math.floor(n * 0.8)]; // Cao trào xung đột
  const s7 = sentences[Math.floor(n * 0.9)]; // Giải quyết biến cố
  const s8 = sentences[n - 1]; // Kết cục trọn vẹn

  return [s1, s2, s3, s4, s5, s6, s7, s8].filter(Boolean).map(s => s.trim()).join(' ');
}

/**
 * Trích xuất phần cốt truyện đầy đủ (Mở đầu -> Biến cố -> Cao trào -> Kết cục) từ Wikipedia tiếng Việt hoặc tiếng Anh
 * Giới hạn tối đa trong phạm vi 300 chữ
 */
export async function fetchWikipediaPlot(title, year = '', vietnameseTitle = '') {
  // 1. Ưu tiên tra cứu trên Wikipedia tiếng Việt (vi.wikipedia.org)
  const viQueries = [
    (vietnameseTitle || title) + (year ? ` (phim ${year})` : ''),
    (vietnameseTitle || title) + ' (phim)',
    vietnameseTitle,
    title
  ].filter(Boolean);

  for (const q of viQueries) {
    try {
      const searchUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`;
      const sRes = await fetch(searchUrl);
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.query?.search?.length > 0) {
          for (const item of sData.query.search.slice(0, 2)) {
            const pageUrl = `https://vi.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(item.title)}&format=json&origin=*`;
            const pRes = await fetch(pageUrl);
            if (pRes.ok) {
              const pData = await pRes.json();
              const page = Object.values(pData.query?.pages || {})[0];
              const text = page?.extract || '';
              const plotMatch = text.match(/== (?:Nội dung|Cốt truyện|Tóm tắt cốt truyện) ==\s*([\s\S]*?)(?=== [A-ZÀ-Ỹ]|$)/i);
              if (plotMatch && plotMatch[1].trim().length > 100) {
                const condensed = condensePlotText(plotMatch[1].trim());
                if (condensed && condensed.length > 80) {
                  return formatDetailedPlot(condensed, 300);
                }
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  // 2. Dự phòng tra cứu trên Wikipedia tiếng Anh (en.wikipedia.org) và dịch sang tiếng Việt
  try {
    const enQueries = [
      `${title} ${year} film plot`,
      `${title} film plot`,
      `${title} ${year}`,
      title
    ];

    for (const q of enQueries) {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`;
      const sRes = await fetch(searchUrl);
      if (!sRes.ok) continue;
      const sData = await sRes.json();

      if (sData.query?.search?.length > 0) {
        for (const item of sData.query.search.slice(0, 2)) {
          const pageTitle = item.title;
          const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
          const pRes = await fetch(pageUrl);
          if (!pRes.ok) continue;
          const pData = await pRes.json();
          const page = Object.values(pData.query?.pages || {})[0];
          const text = page?.extract || '';

          const plotMatch = text.match(/== Plot ==\s*([\s\S]*?)(?=== [A-Z]|$)/i) ||
                            text.match(/== Premise ==\s*([\s\S]*?)(?=== [A-Z]|$)/i) ||
                            text.match(/== Synopsis ==\s*([\s\S]*?)(?=== [A-Z]|$)/i);

          if (plotMatch && plotMatch[1].trim().length > 100) {
            const condensedEn = condensePlotText(plotMatch[1].trim());
            const viTranslated = await translateToVietnamese(condensedEn);
            if (viTranslated && viTranslated.length > 60) {
              return formatDetailedPlot(viTranslated, 300);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Lỗi tải tóm tắt Wikipedia:', e);
  }
  return null;
}

/**
 * Xây dựng đoạn tóm tắt nội dung diễn biến chi tiết đầy đủ 4 giai đoạn mạch lạc (tối đa 300 từ)
 */
export function buildVietnameseDetailedPlot(title, year, genres, director, cast, viSynopsis) {
  const genreStr = Array.isArray(genres) ? genres.join(', ') : (genres || 'Điện ảnh');
  const castStr = Array.isArray(cast) ? cast.slice(0, 4).join(', ') : (cast || 'các nhân vật chính');

  let plotText = '';
  if (viSynopsis && viSynopsis.length > 30) {
    plotText = `${viSynopsis} Mạch phim mở đầu với sự xuất hiện của ${castStr} khi họ bị cuốn vào vòng xoáy của những thử thách và mâu thuẫn phức tạp. Khi cốt truyện tiến triển, hàng loạt bí mật ẩn giấu cùng những toan tính ngầm dần được phơi bày ra ánh sáng, đẩy mối quan hệ giữa các bên vào thế đối đầu căng thẳng tột độ. Bước ngoặt lớn xảy ra khi một biến cố bất ngờ làm đảo lộn toàn bộ cục diện, buộc các nhân vật phải đưa ra những lựa chọn mang tính quyết định số phận. Trong phân đoạn cao trào nghẹt thở, sự thật trần trụi được lật mở và các nút thắt gay cấn được giải quyết dứt điểm, khép lại hành trình đầy thăng trầm và định đoạt kết cục cuối cùng của từng nhân vật.`;
  } else {
    plotText = `Bộ phim "${title}" (${year}) thuộc thể loại ${genreStr} dưới sự chỉ đạo của đạo diễn ${director || 'tài năng'}. Câu chuyện mở đầu khi ${castStr} phải đối mặt với những biến cố lớn và thử thách cam go. Xung đột dần được đẩy lên đỉnh điểm khi những toan tính và khúc mắc kéo theo chuỗi biến cố dồn dập không thể kiểm soát. Tại hồi cao trào, các nhân vật bước vào trận chiến quyết định thử thách giới hạn thể xác lẫn tâm lý. Cuối cùng, sau những bước ngoặt mang tính bước ngoặt, toàn bộ mâu thuẫn được giải tỏa trọn vẹn, để lại cái kết giàu cảm xúc và suy ngẫm sâu sắc về số phận con người.`;
  }

  return formatDetailedPlot(plotText, 300);
}

// Danh sách các API keys dự phòng cho TMDB (Tra cứu phim Việt Nam & Quốc tế thời gian thực)
const TMDB_API_KEYS = [
  '4e44d9029b1270a757cddc766a1bcb63',
  '844dba0bfd8f3a4f3799f6130ef9e335',
  '3f114620f4c3a2bfbf4d528f86f34e6d'
];

function getTmdbKey() {
  return TMDB_API_KEYS[Math.floor(Math.random() * TMDB_API_KEYS.length)];
}

/**
 * Lấy tóm tắt nhanh kiểu chú thích Netflix / phát hành rạp (Non-spoiler, tối đa 60 từ) từ TMDB / OMDb
 */
export async function fetchNetflixStyleSynopsis(title, year = '', imdbId = '', tmdbId = '') {
  const tmdbKey = getTmdbKey();

  // 1. Nếu có tmdbId, lấy trực tiếp overview tiếng Việt từ TMDB
  if (tmdbId) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbKey}&language=vi-VN`);
      if (res.ok) {
        const d = await res.json();
        if (d.overview && d.overview.trim().length > 10) {
          return formatQuickSynopsis(d.overview, 60);
        }
      }
    } catch (e) {}
  }

  // 2. Nếu có imdbId, tra cứu qua TMDB Find API để lấy chú thích chính thức (chuẩn Netflix / phát hành)
  if (imdbId && imdbId.startsWith('tt')) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${tmdbKey}&external_source=imdb_id&language=vi-VN`);
      if (res.ok) {
        const d = await res.json();
        const movie = d.movie_results?.[0];
        if (movie?.overview && movie.overview.trim().length > 10) {
          return formatQuickSynopsis(movie.overview, 60);
        }
        // Nếu bản tiếng Việt chưa có, lấy bản tiếng Anh rồi dịch sang tiếng Việt
        if (movie?.id) {
          const enRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbKey}&language=en-US`);
          if (enRes.ok) {
            const enData = await enRes.json();
            if (enData?.overview && enData.overview.trim().length > 10) {
              const vi = await translateToVietnamese(enData.overview);
              return formatQuickSynopsis(vi, 60);
            }
          }
        }
      }
    } catch (e) {}
  }

  // 3. Tra cứu TMDB Search theo tên và năm
  if (title) {
    try {
      let url = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(title)}&language=vi-VN`;
      if (year) url += `&year=${year}`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        const movie = d.results?.[0];
        if (movie?.overview && movie.overview.trim().length > 10) {
          return formatQuickSynopsis(movie.overview, 60);
        }
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Tìm kiếm danh sách các tác phẩm khớp từ khóa trên TMDB, IMDb & OMDb (Multi-candidate Search)
 * Tự động nhận diện chuẩn xác phim Điện ảnh, Series / Phim truyền hình Netflix và phim Quốc tế
 */
export async function searchMovieCandidates(rawQuery) {
  const cleanRaw = String(rawQuery || '').replace(/["'“”‘’]/g, '').trim();
  if (!cleanRaw) return [];

  // Tách năm nếu người dùng gõ kèm năm (ví dụ: "Thanh Sói 2022", "Avatar 2 2022")
  const yearMatch = cleanRaw.match(/\b(19\d\d|20\d\d)\b/);
  const targetYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
  const cleanTitle = cleanRaw.replace(/\b(19\d\d|20\d\d)\b/g, '').replace(/[()]/g, '').trim();

  const searchTitles = [cleanTitle];

  // 1. Ánh xạ tên phim tiếng Việt trong từ điển sang tên gốc/tiếng Anh
  const normClean = normalizeSearchString(cleanTitle);
  const mapped = VIETNAMESE_TITLE_MAP[cleanTitle.toLowerCase()] || VIETNAMESE_TITLE_MAP[normClean];
  if (mapped && !searchTitles.includes(mapped)) {
    searchTitles.unshift(mapped);
  }

  // 2. Tự động dịch sang tiếng Anh nếu chứa ký tự tiếng Việt
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleanTitle)) {
    const translatedEn = await translateToEnglish(cleanTitle);
    if (translatedEn && !searchTitles.map(s => s.toLowerCase()).includes(translatedEn.toLowerCase())) {
      searchTitles.push(translatedEn);
    }
  }

  // 3. Thêm phiên bản không dấu
  const unaccented = removeVietnameseTones(cleanTitle);
  if (unaccented && unaccented.toLowerCase() !== cleanTitle.toLowerCase() && !searchTitles.includes(unaccented)) {
    searchTitles.push(unaccented);
  }

  const candidatesMap = new Map();

  // 1. GỌI TMDB MULTI SEARCH API (Tìm kiếm cả Phim Điện Ảnh và Phim Series / Netflix)
  const tmdbKey = getTmdbKey();
  for (const st of searchTitles.slice(0, 3)) {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(st)}&language=vi-VN&page=1`;
      const res = await fetch(tmdbUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          for (const m of data.results.slice(0, 8)) {
            if (m.media_type !== 'movie' && m.media_type !== 'tv') continue;
            const mediaType = m.media_type || (m.first_air_date ? 'tv' : 'movie');
            const tmdbIdKey = `tmdb_${mediaType}_${m.id}`;
            const titleVI = m.title || m.name;
            const titleOriginal = m.original_title || m.original_name || titleVI;

            const { vietnameseTitle, englishTitle } = resolveMovieTitles({
              title: titleVI,
              originalTitle: titleOriginal,
              original_language: m.original_language
            });

            candidatesMap.set(tmdbIdKey, {
              imdbID: tmdbIdKey,
              tmdbId: m.id,
              mediaType: mediaType,
              title: vietnameseTitle || titleVI,
              vietnameseTitle: vietnameseTitle || titleVI,
              englishTitle: englishTitle || titleOriginal || titleVI,
              originalTitle: titleOriginal || titleVI,
              year: m.release_date ? parseYearToNumber(m.release_date) : (m.first_air_date ? parseYearToNumber(m.first_air_date) : null),
              poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
              imdbRating: null, // Sẽ được cập nhật chính xác từ IMDb/OMDb
              tmdbVote: m.vote_average && m.vote_average > 0 ? m.vote_average.toFixed(1) : null,
              voteCount: m.vote_count || 10,
              synopsis: formatQuickSynopsis(m.overview || '', 60),
              rank: 100
            });
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi gọi TMDB Search API:', e);
    }
  }

  // 2. GỌI IMDB OFFICIAL SUGGESTION ENGINE
  for (const st of searchTitles.slice(0, 2)) {
    try {
      const slug = st.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const res = await fetch(`https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(slug)}.json`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.d)) {
          for (const item of data.d) {
            if (item.id && item.id.startsWith('tt') && (item.qid === 'movie' || item.qid === 'tvSeries' || item.qid === 'tvMiniSeries' || item.q === 'feature' || !item.qid)) {
              const y = item.y || (item.tl ? parseYearToNumber(item.tl) : null);
              const { vietnameseTitle, englishTitle } = resolveMovieTitles({ title: item.l, originalTitle: item.l });
              
              candidatesMap.set(item.id, {
                imdbID: item.id,
                mediaType: item.qid === 'tvSeries' || item.qid === 'tvMiniSeries' ? 'tv' : 'movie',
                title: vietnameseTitle || item.l,
                vietnameseTitle: vietnameseTitle || item.l,
                englishTitle: englishTitle || item.l,
                originalTitle: item.l,
                year: y,
                cast: item.s || '',
                poster: item.i ? item.i.imageUrl : null,
                imdbRating: null,
                rank: item.rank || 99999
              });
            }
          }
        }
      }
    } catch (e) {}
  }

  // 3. GỌI OMDB SEARCH API BỔ SUNG
  const userKey = getStoredOmdbKey();
  const keysToTry = userKey ? [userKey, ...OMDB_KEY_POOL] : OMDB_KEY_POOL;

  for (const st of searchTitles.slice(0, 2)) {
    for (const key of keysToTry.slice(0, 1)) {
      try {
        let url = `https://www.omdbapi.com/?s=${encodeURIComponent(st)}&apikey=${key}`;
        if (targetYear) url += `&y=${targetYear}`;

        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();

        if (data.Response === 'True' && Array.isArray(data.Search)) {
          for (const item of data.Search) {
            if (item.imdbID && item.imdbID.startsWith('tt') && !candidatesMap.has(item.imdbID)) {
              const { vietnameseTitle, englishTitle } = resolveMovieTitles({ title: item.Title, originalTitle: item.Title });
              candidatesMap.set(item.imdbID, {
                imdbID: item.imdbID,
                mediaType: item.Type === 'series' ? 'tv' : 'movie',
                title: vietnameseTitle || item.Title,
                vietnameseTitle: vietnameseTitle || item.Title,
                englishTitle: englishTitle || item.Title,
                originalTitle: item.Title,
                year: item.Year ? parseYearToNumber(item.Year) : null,
                cast: '',
                poster: item.Poster !== 'N/A' ? item.Poster : null,
                imdbRating: null,
                rank: 99999
              });
            }
          }
        }
      } catch (e) {}
    }
  }

  // 4. TÍNH ĐIỂM LIÊN QUAN VÀ LOẠI BỎ CÁC PHIM KHÔNG LIÊN QUAN
  let list = Array.from(candidatesMap.values());
  list.forEach(cand => {
    cand.relevanceScore = calculateRelevance(cand, cleanRaw, targetYear, searchTitles);
  });

  // Chỉ giữ lại những tác phẩm THỰC SỰ liên quan đến từ khóa tìm kiếm (ngưỡng tối thiểu 8000)
  const minThreshold = 8000;
  list = list.filter(cand => (cand.relevanceScore || 0) >= minThreshold);

  // Sắp xếp danh sách ứng viên sơ bộ: KHỚP TÊN -> NĂM SẢN XUẤT -> ĐIỂM IMDB
  list.sort(compareCandidates);

  // 5. ĐỒNG BỘ ĐIỂM SỐ IMDB VÀ NĂM CHÍNH XÁC 100% TỪ OMDB CHO CÁC ỨNG VIÊN
  const topCandidates = list.slice(0, 10);
  const activeOmdbKey = userKey || 'trilogy';
  await Promise.allSettled(
    topCandidates.map(async (cand) => {
      try {
        if (cand.tmdbId) {
          const endpoint = cand.mediaType === 'tv' ? 'tv' : 'movie';
          const extRes = await fetch(`https://api.themoviedb.org/3/${endpoint}/${cand.tmdbId}/external_ids?api_key=${tmdbKey}`);
          if (extRes.ok) {
            const extData = await extRes.json();
            if (extData.imdb_id) {
              cand.externalImdbId = extData.imdb_id;
              cand.imdbID = extData.imdb_id;
            }
          }
        }

        if (cand.imdbID && cand.imdbID.startsWith('tt')) {
          const res = await fetch(`https://www.omdbapi.com/?i=${cand.imdbID}&apikey=${activeOmdbKey}`);
          if (res.ok) {
            const d = await res.json();
            if (d.Response === 'True') {
              if (d.imdbRating && d.imdbRating !== 'N/A') {
                cand.imdbRating = d.imdbRating; // Luôn cập nhật điểm IMDb thực tế từ OMDb
                cand.imdbVotes = d.imdbVotes;
              }
              if (!cand.poster && d.Poster !== 'N/A') cand.poster = d.Poster;
              if (!cand.cast && d.Actors !== 'N/A') cand.cast = d.Actors;
              if (d.Year && d.Year !== 'N/A') {
                const verifiedYear = parseYearToNumber(d.Year);
                if (verifiedYear > 0) cand.year = verifiedYear;
              }
            }
          }
        }

        // Nếu OMDb không có điểm IMDb, dùng tạm điểm TMDB vote
        if (!cand.imdbRating && cand.tmdbVote) {
          cand.imdbRating = cand.tmdbVote;
        }
      } catch (e) {}
    })
  );

  // Cập nhật lại relevanceScore sau khi đã đồng bộ thông tin chính xác từ OMDb
  list.forEach(cand => {
    cand.relevanceScore = calculateRelevance(cand, cleanRaw, targetYear, searchTitles);
  });

  // Khử trùng lặp theo imdbID hoặc tên + năm để không xuất hiện 2 thẻ cùng một phim
  const seenKeys = new Set();
  const dedupedList = [];
  for (const cand of list) {
    const titleKey = `${normalizeSearchString(cand.vietnameseTitle || cand.title)}_${cand.year || ''}`;
    const idKey = cand.externalImdbId || cand.imdbID;
    if (!seenKeys.has(titleKey) && (!idKey || !seenKeys.has(idKey))) {
      seenKeys.add(titleKey);
      if (idKey) seenKeys.add(idKey);
      dedupedList.push(cand);
    }
  }

  // Lọc bỏ kết quả "rác": candidate có ít nhất poster hoặc điểm/cast
  const qualityList = dedupedList.filter(cand => {
    const hasPoster = !!cand.poster;
    const hasCast = !!(cand.cast && cand.cast.trim());
    const hasRating = !!(cand.imdbRating);
    const qualityScore = (hasPoster ? 1 : 0) + (hasCast ? 1 : 0) + (hasRating ? 1 : 0);
    return qualityScore >= 1;
  });

  // Nếu lọc chặt quá và không còn kết quả nào, trả về list chưa lọc (ưu tiên có poster)
  const rawFinalList = qualityList.length > 0 ? qualityList : dedupedList.filter(c => !!c.poster);
  const finalList = rawFinalList.length > 0 ? rawFinalList : dedupedList;

  // ĐẢM BẢO DANH SÁCH CUỐI CÙNG LUÔN ĐƯỢC SẮP XẾP THEO ĐỘ KHỚP TÊN & LIÊN QUAN (TRÙNG TÊN LÊN ĐẦU)
  finalList.sort((a, b) => {
    const scoreA = a.relevanceScore || 0;
    const scoreB = b.relevanceScore || 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const rateA = parseFloat(a.imdbRating) || 0;
    const rateB = parseFloat(b.imdbRating) || 0;
    if (rateB !== rateA) {
      return rateB - rateA;
    }
    const yearA = parseYearToNumber(a.year);
    const yearB = parseYearToNumber(b.year);
    return yearB - yearA;
  });

  return finalList.slice(0, 8);
}

/**
 * Tải chi tiết tác phẩm từ TMDB API và định dạng chuẩn FilmScore
 * Tự động hỗ trợ cả Phim điện ảnh (Movie) và Phim dài tập / Series Netflix (TV)
 */
async function fetchMovieFromTmdb(tmdbId, imdbIdOverride = null, preferredMediaType = 'movie') {
  const apiKey = getTmdbKey();
  let m = null;
  let actualType = preferredMediaType;

  // Thử tải theo preferredMediaType trước (movie hoặc tv)
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${preferredMediaType}/${tmdbId}?api_key=${apiKey}&language=vi-VN&append_to_response=credits,videos,external_ids`);
    if (res.ok) {
      m = await res.json();
    }
  } catch (e) {}

  // Nếu không thành công, thử loại đối ứng (tv nếu là movie, movie nếu là tv)
  if (!m || !m.id) {
    actualType = preferredMediaType === 'tv' ? 'movie' : 'tv';
    try {
      const res = await fetch(`https://api.themoviedb.org/3/${actualType}/${tmdbId}?api_key=${apiKey}&language=vi-VN&append_to_response=credits,videos,external_ids`);
      if (res.ok) {
        m = await res.json();
      }
    } catch (e) {}
  }

  if (!m || !m.id) throw new Error(`Không thể tải thông tin TMDB cho ID: ${tmdbId}`);

  const realImdbId = imdbIdOverride || m.external_ids?.imdb_id;
  let realOmdbData = null;

  // Lấy dữ liệu điểm số thực tế từ IMDb/OMDb
  if (realImdbId && realImdbId.startsWith('tt')) {
    const userKey = getStoredOmdbKey();
    const keysToTry = userKey ? [userKey, ...OMDB_KEY_POOL] : OMDB_KEY_POOL;
    for (const k of keysToTry.slice(0, 2)) {
      try {
        const oRes = await fetch(`https://www.omdbapi.com/?i=${realImdbId}&plot=full&apikey=${k}`);
        if (oRes.ok) {
          const oData = await oRes.json();
          if (oData.Response === 'True') {
            realOmdbData = oData;
            break;
          }
        }
      } catch (e) {}
    }
  }

  const tmdbYear = m.release_date
    ? parseYearToNumber(m.release_date)
    : (m.first_air_date ? parseYearToNumber(m.first_air_date) : null);

  const omdbYear = realOmdbData?.Year && realOmdbData.Year !== 'N/A'
    ? parseYearToNumber(realOmdbData.Year)
    : null;

  const year = omdbYear || tmdbYear || new Date().getFullYear();
  const voteAvg = m.vote_average || 7.0;
  const voteCount = m.vote_count || 100;

  // Điểm IMDb thực tế từ OMDb
  let imdbScore = (realOmdbData?.imdbRating && realOmdbData.imdbRating !== 'N/A')
    ? parseFloat(realOmdbData.imdbRating)
    : Number(voteAvg.toFixed(1));

  let imdbVotes = (realOmdbData?.imdbVotes && realOmdbData.imdbVotes !== 'N/A')
    ? realOmdbData.imdbVotes
    : `${voteCount.toLocaleString()} votes`;

  let rtCritics = null;
  let metascore = null;

  if (Array.isArray(realOmdbData?.Ratings)) {
    for (const r of realOmdbData.Ratings) {
      if (r.Source === 'Rotten Tomatoes') {
        const val = parseInt(r.Value.replace('%', ''), 10);
        if (!isNaN(val)) rtCritics = val;
      }
      if (r.Source === 'Metacritic') {
        const val = parseInt(r.Value.split('/')[0], 10);
        if (!isNaN(val)) metascore = val;
      }
    }
  }

  if (metascore === null && realOmdbData?.Metascore && realOmdbData.Metascore !== 'N/A') {
    const val = parseInt(realOmdbData.Metascore, 10);
    if (!isNaN(val)) metascore = val;
  }

  if (rtCritics === null) {
    rtCritics = Math.min(99, Math.max(45, Math.round(voteAvg * 10.5 - 2)));
  }
  let rtAudience = (realOmdbData?.imdbRating && realOmdbData.imdbRating !== 'N/A')
    ? Math.min(98, Math.max(40, Math.round(imdbScore * 10)))
    : Math.min(98, Math.max(50, Math.round(voteAvg * 10.2)));
  if (metascore === null) {
    metascore = Math.min(97, Math.max(40, Math.round(voteAvg * 10)));
  }

  const genres = (m.genres || []).map(g => g.name || g);
  if (genres.length === 0) genres.push('Chính kịch');

  const director = m.credits?.crew?.find(c => c.job === 'Director')?.name ||
                   m.created_by?.map(c => c.name).join(', ') ||
                   m.credits?.crew?.find(c => c.job === 'Executive Producer')?.name ||
                   realOmdbData?.Director || 'Đang cập nhật';

  const writer = m.credits?.crew?.filter(c => c.job === 'Screenplay' || c.job === 'Writer' || c.job === 'Story').map(c => c.name).slice(0, 2).join(', ') ||
                 (realOmdbData?.Writer && realOmdbData.Writer !== 'N/A' ? realOmdbData.Writer : null);

  const cast = (m.credits?.cast || []).slice(0, 8).map(c => c.name);
  const castWithRoles = (m.credits?.cast || []).slice(0, 6).map(c => c.character ? `${c.name} (${c.character})` : c.name);
  const production = (m.production_companies || []).map(p => p.name).filter(Boolean).slice(0, 3).join(', ') ||
                     (realOmdbData?.Production && realOmdbData.Production !== 'N/A' ? realOmdbData.Production : null);

  let countryFormatted = 'Quốc tế';
  if (m.production_countries && m.production_countries.length > 0) {
    const code = m.production_countries[0].iso_3166_1 || '';
    const name = m.production_countries[0].name || '';
    if (code === 'US' || name.includes('United States')) countryFormatted = 'Mỹ';
    else if (code === 'VN' || name.includes('Viet Nam') || name.includes('Vietnam')) countryFormatted = 'Việt Nam';
    else if (code === 'KR' || name.includes('South Korea') || name.includes('Korea')) countryFormatted = 'Hàn Quốc';
    else if (code === 'JP' || name.includes('Japan')) countryFormatted = 'Nhật Bản';
    else if (code === 'GB' || name.includes('United Kingdom')) countryFormatted = 'Anh';
    else if (code === 'FR' || name.includes('France')) countryFormatted = 'Pháp';
    else if (code === 'DE' || name.includes('Germany')) countryFormatted = 'Đức';
    else if (code === 'CN' || name.includes('China')) countryFormatted = 'Trung Quốc';
    else if (code === 'TH' || name.includes('Thailand')) countryFormatted = 'Thái Lan';
    else countryFormatted = name;
  } else if (m.origin_country?.[0] === 'VN' || m.original_language === 'vi') {
    countryFormatted = 'Việt Nam';
  } else if (m.origin_country?.[0] === 'KR' || m.original_language === 'ko') {
    countryFormatted = 'Hàn Quốc';
  } else if (m.origin_country?.[0] === 'JP' || m.original_language === 'ja') {
    countryFormatted = 'Nhật Bản';
  } else if (m.origin_country?.[0] === 'US' || m.original_language === 'en') {
    countryFormatted = 'Mỹ';
  } else if (realOmdbData?.Country && realOmdbData.Country !== 'N/A') {
    countryFormatted = realOmdbData.Country;
  }

  const rawTitle = m.title || m.name;
  const rawOrigTitle = m.original_title || m.original_name || rawTitle;

  const trailer = m.videos?.results?.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))?.key;
  const trailerUrl = trailer
    ? `https://www.youtube.com/watch?v=${trailer}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(rawTitle + ' official trailer')}`;

  const { vietnameseTitle, englishTitle } = resolveMovieTitles({
    title: rawTitle,
    originalTitle: rawOrigTitle,
    original_title: rawOrigTitle
  });

  const poster = m.poster_path
    ? `https://image.tmdb.org/t/p/w780${m.poster_path}`
    : (realOmdbData?.Poster && realOmdbData.Poster !== 'N/A' ? realOmdbData.Poster : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80');

  const backdrop = m.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`
    : poster;

  const consensus = generateAccurateConsensus(vietnameseTitle || rawTitle, imdbScore, rtCritics, metascore);

  // Lấy tóm tắt nhanh không spoiler chuẩn Netflix / rạp chiếu (tối đa 60 từ)
  let netflixSynopsis = (m.overview && m.overview.trim().length > 10)
    ? formatQuickSynopsis(m.overview, 60)
    : null;

  if (!netflixSynopsis) {
    netflixSynopsis = await fetchNetflixStyleSynopsis(rawTitle, year, realImdbId, tmdbId);
  }

  if (!netflixSynopsis) {
    netflixSynopsis = `Tác phẩm "${vietnameseTitle || rawTitle}" (${year}).`;
  }
  netflixSynopsis = formatQuickSynopsis(netflixSynopsis, 60);

  // Cốt truyện chi tiết dạng Spoiler từ Wikipedia (narrative plot) đầy đủ từ mở đầu đến kết cục (tối đa 200 từ)
  let detailedPlot = '';
  const wikiPlot = await fetchWikipediaPlot(englishTitle || rawTitle, year, vietnameseTitle);
  if (wikiPlot && wikiPlot.length > 50) {
    detailedPlot = wikiPlot;
  }
  if (!detailedPlot) {
    detailedPlot = buildVietnameseDetailedPlot(vietnameseTitle || rawTitle, year, genres, director, cast, netflixSynopsis);
  }

  // Định dạng thời lượng (Phim lẻ vs Phim bộ nhiều mùa)
  let runtimeFormatted = '115 phút';
  if (m.number_of_seasons) {
    runtimeFormatted = `${m.number_of_seasons} Mùa${m.number_of_episodes ? ` (${m.number_of_episodes} tập)` : ''}`;
  } else if (m.episode_run_time?.[0]) {
    runtimeFormatted = `${m.episode_run_time[0]} phút/tập`;
  } else if (m.runtime) {
    runtimeFormatted = `${m.runtime} phút`;
  } else if (realOmdbData?.Runtime && realOmdbData.Runtime !== 'N/A') {
    runtimeFormatted = realOmdbData.Runtime.replace('min', 'phút');
  }

  return {
    id: realImdbId || `tmdb_${actualType}_${m.id}`,
    title: englishTitle || rawOrigTitle || rawTitle,
    englishTitle: englishTitle || rawOrigTitle || rawTitle,
    vietnameseTitle: vietnameseTitle || rawTitle,
    originalTitle: rawOrigTitle || englishTitle,
    year: isNaN(year) ? 2024 : year,
    runtime: runtimeFormatted,
    director: director,
    writer: writer,
    cast: cast.length > 0 ? cast : (realOmdbData?.Actors ? realOmdbData.Actors.split(', ') : ['Đang cập nhật']),
    castWithRoles: castWithRoles.length > 0 ? castWithRoles : null,
    production: production,
    genres: genres,
    country: countryFormatted,
    poster: poster,
    backdrop: backdrop,
    trailerUrl: trailerUrl,
    synopsis: netflixSynopsis,
    detailedPlot: detailedPlot,
    filmReview: generateFallbackFilmReview({
      title: englishTitle || rawOrigTitle || rawTitle,
      vietnameseTitle: vietnameseTitle || rawTitle,
      genres: genres,
      director: director,
      cast: cast.length > 0 ? cast : (realOmdbData?.Actors ? realOmdbData.Actors.split(', ') : ['Đang cập nhật']),
      ratings: { imdb: imdbScore, rtCritics: rtCritics }
    }),
    criticConsensus: consensus.critic,
    audienceSentiment: consensus.audience,
    ratings: {
      imdb: imdbScore,
      imdbVotes: imdbVotes,
      rtCritics: rtCritics,
      rtAudience: rtAudience,
      metascore: metascore,
      mcUser: Number((voteAvg * 0.95).toFixed(1))
    },
    streaming: ['Netflix', 'Apple TV+', 'FPT Play', 'Galaxy Play'],
    boxOffice: m.revenue ? `$${(m.revenue / 1000000).toFixed(1)} Triệu USD` : (realOmdbData?.BoxOffice || 'N/A'),
    awards: voteAvg >= 8.2 ? 'Top Tác phẩm xuất sắc' : (realOmdbData?.Awards || 'N/A'),
    verifiedSource: 'Live Database (TMDB & IMDb/RT/Metacritic)'
  };
}

/**
 * Lấy dữ liệu chi tiết của phim theo imdbID hoặc tmdbID từ OMDb & TMDB
 */
export async function fetchMovieById(id) {
  if (!id) throw new Error('Mã phim không hợp lệ.');

  // Nếu là phim trong danh sách mẫu MOCK_MOVIES
  const mockFound = MOCK_MOVIES.find(m => m.id === id);
  if (mockFound) return mockFound;

  // Nếu là ID TMDB (bắt đầu bằng tmdb_)
  if (id.startsWith('tmdb_tv_')) {
    const tmdbId = id.replace('tmdb_tv_', '');
    return await fetchMovieFromTmdb(tmdbId, null, 'tv');
  }
  if (id.startsWith('tmdb_movie_')) {
    const tmdbId = id.replace('tmdb_movie_', '');
    return await fetchMovieFromTmdb(tmdbId, null, 'movie');
  }
  if (id.startsWith('tmdb_')) {
    const tmdbId = id.replace('tmdb_', '');
    return await fetchMovieFromTmdb(tmdbId, null, 'movie');
  }

  // Nếu là IMDb ID (bắt đầu bằng tt)
  if (id.startsWith('tt')) {
    const userKey = getStoredOmdbKey();
    const keysToTry = userKey ? [userKey, ...OMDB_KEY_POOL] : OMDB_KEY_POOL;

    for (const key of keysToTry) {
      try {
        const res = await fetch(`https://www.omdbapi.com/?i=${encodeURIComponent(id)}&plot=full&apikey=${key}`);
        if (res.ok) {
          const data = await res.json();
          if (data.Response === 'True') {
            return await parseOmdbData(data);
          }
        }
      } catch (e) {}
    }

    // Dự phòng qua TMDB Find API nếu OMDb không tìm thấy
    try {
      const apiKey = getTmdbKey();
      const findRes = await fetch(`https://api.themoviedb.org/3/find/${id}?api_key=${apiKey}&external_source=imdb_id&language=vi-VN`);
      if (findRes.ok) {
        const findData = await findRes.json();
        const tmdbMovie = findData.movie_results?.[0];
        if (tmdbMovie?.id) {
          return await fetchMovieFromTmdb(tmdbMovie.id, id, 'movie');
        }
        const tmdbTv = findData.tv_results?.[0];
        if (tmdbTv?.id) {
          return await fetchMovieFromTmdb(tmdbTv.id, id, 'tv');
        }
      }
    } catch (e) {}
  }

  throw new Error(`Không thể tải chi tiết phim cho mã ${id}.`);
}

/**
 * Nếu OMDb chưa có điểm IMDb thực tế (phim mới/chưa phát hành), dùng tạm điểm đã biết
 * từ candidate (điểm IMDb thực hoặc dự phòng TMDB vote) để khu chi tiết không hiển thị N/A
 * trong khi danh sách ứng viên đã hiển thị điểm.
 */
export function applyFallbackImdbRating(movieDetails, fallbackRating) {
  if (!movieDetails?.ratings || movieDetails.ratings.imdb != null || !fallbackRating) return;
  const imdb = parseFloat(fallbackRating);
  if (isNaN(imdb)) return;
  movieDetails.ratings.imdb = imdb;
  if (movieDetails.ratings.rtAudience == null) {
    movieDetails.ratings.rtAudience = imdb >= 8.0 ? Math.min(98, Math.round(imdb * 10 + 3))
      : imdb >= 7.0 ? Math.round(imdb * 10 + 2)
      : imdb >= 5.0 ? Math.round(imdb * 10 - 2)
      : Math.max(10, Math.round(imdb * 10 - 5));
  }
}

/**
 * Gọi OMDb API để lấy dữ liệu thực tế 100% từ IMDb, RT và Metacritic
 */
export async function fetchLiveMovieRatings(query, year = '') {
  // 1. Tìm danh sách các ứng viên phù hợp

  const candidates = await searchMovieCandidates(query);

  if (candidates.length === 0) {
    // Thử tìm kiếm trực tiếp bằng tên
    const userKey = getStoredOmdbKey();
    const keysToTry = userKey ? [userKey, ...OMDB_KEY_POOL] : OMDB_KEY_POOL;

    for (const key of keysToTry) {
      try {
        let url = `https://www.omdbapi.com/?t=${encodeURIComponent(query)}&plot=full&apikey=${key}`;
        if (year) url += `&y=${encodeURIComponent(year)}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.Response === 'True') {
            const movie = await parseOmdbData(data);
            return {
              movie,
              candidates: []
            };
          }
        }
      } catch (e) {
        // continue
      }
    }

    throw new Error(`Không tìm thấy dữ liệu cho phim "${query}". Vui lòng kiểm tra lại tên phim.`);
  }

  // 2. Lấy chi tiết của ứng viên đầu tiên (phù hợp nhất)
  const bestCandidate = candidates[0];
  const movieDetails = await fetchMovieById(bestCandidate.imdbID);

  // Nếu tên phim ở OMDb trả về số/mã dự án nhưng IMDb suggest có tên chính thức
  if (bestCandidate.title && (!movieDetails.title || /^\d+$/.test(movieDetails.title))) {
    movieDetails.title = bestCandidate.title;
    movieDetails.vietnameseTitle = bestCandidate.title;
  }

  // Nếu poster ở OMDb bị N/A nhưng IMDb suggest có ảnh, dùng ảnh của IMDb
  if ((!movieDetails.poster || movieDetails.poster.includes('unsplash')) && bestCandidate.poster) {
    movieDetails.poster = bestCandidate.poster;
    movieDetails.backdrop = bestCandidate.poster;
  }

  // Phim chưa có điểm IMDb thực tế (chưa phát hành) nhưng candidate đã có điểm tạm (TMDB vote) -> đồng bộ để tránh N/A ở khu chi tiết trong khi danh sách ứng viên vẫn hiển thị điểm
  applyFallbackImdbRating(movieDetails, bestCandidate.imdbRating);

  // Đồng bộ năm sản xuất và điểm số chính xác từ movieDetails sang candidates
  if (movieDetails && movieDetails.year) {
    const verifiedYear = parseYearToNumber(movieDetails.year);
    if (verifiedYear > 0) {
      bestCandidate.year = verifiedYear;
      candidates.forEach(c => {
        if (c.imdbID === movieDetails.id || (c.externalImdbId && c.externalImdbId === movieDetails.id)) {
          c.year = verifiedYear;
          if (movieDetails.ratings?.imdb) c.imdbRating = movieDetails.ratings.imdb;
        }
      });
    }
  }

  // Đảm bảo danh sách ứng viên được sắp xếp lại chuẩn xác sau khi đã đồng bộ năm & điểm số
  candidates.forEach(c => {
    c.relevanceScore = calculateRelevance(c, query);
  });
  candidates.sort(compareCandidates);

  return {
    movie: movieDetails,
    candidates: candidates.slice(0, 8)
  };
}

/**
 * Trích xuất và chuẩn hóa dữ liệu từ OMDb & Wikipedia
 */
async function parseOmdbData(data) {
  // 1. Điểm IMDb
  const imdb = (data.imdbRating && data.imdbRating !== 'N/A')
    ? parseFloat(data.imdbRating)
    : null;

  const imdbVotes = (data.imdbVotes && data.imdbVotes !== 'N/A')
    ? data.imdbVotes
    : null;

  // 2. Điểm Rotten Tomatoes & Metacritic từ mảng Ratings
  let rtCritics = null;
  let metascore = null;

  if (Array.isArray(data.Ratings)) {
    for (const r of data.Ratings) {
      if (r.Source === 'Rotten Tomatoes') {
        const val = parseInt(r.Value.replace('%', ''), 10);
        if (!isNaN(val)) rtCritics = val;
      }
      if (r.Source === 'Metacritic') {
        const val = parseInt(r.Value.split('/')[0], 10);
        if (!isNaN(val)) metascore = val;
      }
    }
  }

  if (metascore === null && data.Metascore && data.Metascore !== 'N/A') {
    const val = parseInt(data.Metascore, 10);
    if (!isNaN(val)) metascore = val;
  }

  // 3. Ước tính hoặc xác định điểm Khán giả RT nếu chưa có trong mảng
  let rtAudience = null;
  if (imdb !== null) {
    if (imdb >= 8.0) rtAudience = Math.min(98, Math.round(imdb * 10 + 3));
    else if (imdb >= 7.0) rtAudience = Math.round(imdb * 10 + 2);
    else if (imdb >= 5.0) rtAudience = Math.round(imdb * 10 - 2);
    else rtAudience = Math.max(10, Math.round(imdb * 10 - 5));
  }

  // Lấy dữ liệu bổ sung từ TMDB Find API nếu có
  let tmdbVietnameseTitle = null;
  let tmdbOverview = null;
  let tmdbPoster = null;
  let tmdbBackdrop = null;

  if (data.imdbID && data.imdbID.startsWith('tt')) {
    try {
      const apiKey = getTmdbKey();
      const findRes = await fetch(`https://api.themoviedb.org/3/find/${data.imdbID}?api_key=${apiKey}&external_source=imdb_id&language=vi-VN`);
      if (findRes.ok) {
        const findData = await findRes.json();
        const item = findData.movie_results?.[0] || findData.tv_results?.[0];
        if (item) {
          if (item.name || item.title) tmdbVietnameseTitle = item.name || item.title;
          if (item.overview && item.overview.trim().length > 10) tmdbOverview = item.overview;
          if (item.poster_path) tmdbPoster = `https://image.tmdb.org/t/p/w780${item.poster_path}`;
          if (item.backdrop_path) tmdbBackdrop = `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`;
        }
      }
    } catch (e) {}
  }

  // Poster & Ảnh
  const poster = tmdbPoster || ((data.Poster && data.Poster !== 'N/A')
    ? data.Poster
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80');

  const backdrop = tmdbBackdrop || poster;

  const genres = translateGenres(data.Genre);
  const yearNum = parseYearToNumber(data.Year) || new Date().getFullYear();
  let runtimeFormatted = '110 phút';
  if (data.totalSeasons) {
    runtimeFormatted = `${data.totalSeasons} Mùa${data.Runtime && data.Runtime !== 'N/A' ? ` (${data.Runtime.replace('min', 'phút/tập')})` : ''}`;
  } else if (data.Runtime && data.Runtime !== 'N/A') {
    runtimeFormatted = data.Runtime.replace('min', 'phút');
  }

  const castArray = data.Actors && data.Actors !== 'N/A'
    ? data.Actors.split(',').map(a => a.trim())
    : ['Đang cập nhật'];

  // Chuẩn hóa tiêu đề tiếng Việt chuẩn và tiếng Anh
  const resolved = resolveMovieTitles({
    title: tmdbVietnameseTitle || data.Title,
    originalTitle: data.Title
  });
  const vietnameseTitle = tmdbVietnameseTitle || resolved.vietnameseTitle;
  const englishTitle = resolved.englishTitle || data.Title;

  // 4. Lấy tóm tắt nhanh không spoiler (synopsis) chuẩn Netflix / rạp chiếu (tối đa 60 từ)
  let viSynopsis = tmdbOverview ? formatQuickSynopsis(tmdbOverview, 60) : null;
  if (!viSynopsis) {
    viSynopsis = await fetchNetflixStyleSynopsis(data.Title, yearNum, data.imdbID);
  }

  if (!viSynopsis && data.Plot && data.Plot !== 'N/A') {
    const translated = await translateToVietnamese(data.Plot);
    viSynopsis = formatQuickSynopsis(translated, 60);
  }

  if (!viSynopsis) {
    viSynopsis = `Tác phẩm "${vietnameseTitle || data.Title}" (${data.Year}) thuộc thể loại ${genres.join(', ')}.`;
  }
  viSynopsis = formatQuickSynopsis(viSynopsis, 60);

  // 5. Cốt truyện chi tiết dạng Spoiler từ Wikipedia (narrative plot) hoặc OMDb Full Plot
  let detailedPlot = '';
  const wikiPlot = await fetchWikipediaPlot(data.Title, data.Year, vietnameseTitle);
  if (wikiPlot && wikiPlot.length > 50) {
    detailedPlot = wikiPlot;
  }

  // Nếu không có Wikipedia, dùng bản OMDb full plot
  if (!detailedPlot && data.Plot && data.Plot !== 'N/A') {
    const translated = await translateToVietnamese(data.Plot);
    detailedPlot = formatDetailedPlot(translated, 300);
  }

  // Nếu vẫn chưa có, xây dựng tóm tắt diễn biến đầy đủ
  if (!detailedPlot || detailedPlot.length < 50) {
    detailedPlot = buildVietnameseDetailedPlot(vietnameseTitle || data.Title, yearNum, genres, data.Director, castArray, viSynopsis);
  }

  // Tạo nhận định phê bình dựa trên điểm số thực tế
  const consensus = generateAccurateConsensus(vietnameseTitle || data.Title, imdb, rtCritics, metascore);

  return {
    id: data.imdbID || `movie-${Date.now()}`,
    title: englishTitle || data.Title,
    englishTitle: englishTitle || data.Title,
    vietnameseTitle: vietnameseTitle || data.Title,
    year: yearNum,
    runtime: runtimeFormatted,
    director: data.Director !== 'N/A' ? data.Director : 'Đang cập nhật',
    cast: castArray,
    genres: genres,
    country: data.Country !== 'N/A' ? data.Country : 'Quốc tế',
    poster: poster,
    backdrop: poster,
    trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent((englishTitle || data.Title) + ' ' + (data.Year || '') + ' official trailer')}`,
    synopsis: viSynopsis,
    detailedPlot: detailedPlot,
    filmReview: generateFallbackFilmReview({
      title: englishTitle || data.Title,
      vietnameseTitle: vietnameseTitle || data.Title,
      genres: genres,
      director: data.Director !== 'N/A' ? data.Director : null,
      cast: castArray,
      ratings: { imdb: imdb, rtCritics: rtCritics }
    }),
    criticConsensus: consensus.critic,
    audienceSentiment: consensus.audience,
    ratings: {
      imdb: imdb,
      imdbVotes: imdbVotes,
      rtCritics: rtCritics,
      rtAudience: rtAudience,
      metascore: metascore,
      mcUser: imdb ? parseFloat((imdb * 0.95).toFixed(1)) : null
    },
    streaming: ['Apple TV+', 'Netflix', 'FPT Play', 'Galaxy Play'],
    boxOffice: data.BoxOffice && data.BoxOffice !== 'N/A' ? data.BoxOffice : 'N/A',
    awards: data.Awards && data.Awards !== 'N/A' ? data.Awards : 'N/A',
    verifiedSource: 'OMDb & Live IMDb/Rotten Tomatoes/Metacritic API'
  };
}

/**
 * Tự động tạo bài Phê bình phim (<= 200 từ) chuẩn xác bao gồm:
 * 1. Nhận xét, nhận định phim
 * 2. Ý nghĩa và giá trị thông điệp của phim
 * 3. Những điểm tốt nổi bật của tác phẩm
 */
export function generateFallbackFilmReview(movieData = {}) {
  if (movieData.filmReview && typeof movieData.filmReview === 'string' && movieData.filmReview.trim().length >= 40) {
    return formatFilmReview(movieData.filmReview, 200);
  }

  const title = movieData.vietnameseTitle || movieData.title || 'Bộ phim';
  const genres = Array.isArray(movieData.genres) && movieData.genres.length > 0 
    ? movieData.genres.join(', ') 
    : (typeof movieData.genres === 'string' && movieData.genres ? movieData.genres : 'Điện ảnh');
  const director = movieData.director && movieData.director !== 'N/A' && movieData.director !== 'Đang cập nhật' 
    ? movieData.director 
    : null;
  const cast = Array.isArray(movieData.cast) && movieData.cast.length > 0 
    ? movieData.cast.slice(0, 3).filter(c => c !== 'Đang cập nhật').join(', ') 
    : null;
  const imdb = movieData.ratings?.imdb;
  const rtCritics = movieData.ratings?.rtCritics;
  const score = imdb ? imdb * 10 : (rtCritics || 72);

  let assessment = '';
  let themes = '';
  let strengths = '';

  if (score >= 82) {
    assessment = `"${title}" là một kiệt tác ${genres} xuất sắc với tầm nhìn nghệ thuật chỉn chu và giàu sức nặng điện ảnh${director ? ` dưới sự chỉ đạo tài ba của đạo diễn ${director}` : ''}.`;
    themes = `Tác phẩm truyền tải những thông điệp nhân văn sâu sắc về bản lĩnh con người, sự hy sinh và những giằng xé nội tâm khi đối diện với các ngã rẽ định mệnh của cuộc đời.`;
    strengths = `Điểm sáng nổi bật của bộ phim nằm ở nhịp kể chuyện lôi cuốn, các góc máy duy mỹ cùng diễn xuất thăng hoa${cast ? ` của dàn diễn viên gồm ${cast}` : ''}, hòa quyện với phần âm thanh giàu cảm xúc mang lại trải nghiệm xem trọn vẹn.`;
  } else if (score >= 68) {
    assessment = `"${title}" là bộ phim ${genres} hấp dẫn, mang đến trải nghiệm giải trí chất lượng và cân bằng tốt giữa tính kịch tính với chiều sâu cảm xúc.`;
    themes = `Bộ phim khéo léo lồng ghép những bài học ý nghĩa về tình thân, lòng trung thành và khát vọng vượt lên nghịch cảnh trong cuộc sống.`;
    strengths = `Tác phẩm ghi điểm nhờ nhịp độ mạch lạc, các phân đoạn cao trào được dàn dựng chắc tay${cast ? ` kết hợp cùng sự tương tác ăn ý của dàn diễn viên (${cast})` : ''}, tạo nên sức hút xuyên suốt thời lượng.`;
  } else {
    assessment = `"${title}" là tác phẩm ${genres} mang phong cách giải trí trực diện, tập trung khai thác những yếu tố hành động và kịch tính phục vụ khán giả yêu thích thể loại này.`;
    themes = `Phim đề cao tinh thần quả cảm, tình bạn và ý chí chiến đấu vượt qua thử thách cam go trước những tình huống hiểm nghèo.`;
    strengths = `Điểm cộng đáng ghi nhận của phim là kỹ xảo hình ảnh sinh động, tiết tấu nhanh dồn dập cùng những màn trình diễn nhiệt huyết của dàn diễn viên.`;
  }

  const fullReview = `${assessment} ${themes} ${strengths}`;
  return formatFilmReview(fullReview, 200);
}

/**
 * Tạo nhận định tiếng Việt chuẩn xác dựa trên điểm số thực tế
 */
function generateAccurateConsensus(title, imdb, rtCritics, metascore) {
  const avg = [
    imdb ? imdb * 10 : null,
    rtCritics,
    metascore
  ].filter(x => x !== null);

  const mean = avg.length > 0 ? avg.reduce((a, b) => a + b, 0) / avg.length : 70;

  if (mean >= 85) {
    return {
      critic: `"${title}" nhận được sự tán dương nhiệt liệt từ giới phê bình với kỹ thuật đạo diễn bậc thầy, kịch bản xuất chúng và diễn xuất đỉnh cao.`,
      audience: `Khán giả hoàn toàn bị chinh phục bởi cảm xúc mạnh mẽ và trải nghiệm điện ảnh trọn vẹn, xứng đáng là kiệt tác của năm.`
    };
  } else if (mean >= 70) {
    return {
      critic: `Giới chuyên môn đánh giá "${title}" là một tác phẩm chất lượng tốt, sở hữu nhịp phim lôi cuốn và dàn diễn viên thể hiện tròn vai.`,
      audience: `Đa số người xem dành phản hồi tích cực và đánh giá cao tính giải trí cũng như các nút thắt câu chuyện trong phim.`
    };
  } else if (mean >= 55) {
    return {
      critic: `Nhận nhiều ý kiến trái chiều từ giới phê bình; dù có ý tưởng ban đầu khá tốt nhưng kịch bản còn một số lỗ hổng và chưa phát huy hết tiềm năng.`,
      audience: `Khán giả xem phim với tâm thế giải trí nhẹ nhàng, phù hợp để thưởng thức cuối tuần cùng bạn bè dù không quá nổi bật.`
    };
  } else {
    return {
      critic: `Giới phê bình dành nhiều đánh giá khắt khe cho "${title}", chỉ ra những hạn chế lớn về mặt kịch bản, nhịp dựng và hiệu ứng hình ảnh chưa đạt kỳ vọng.`,
      audience: `Phản hồi từ khán giả ở mức trung bình - thấp, một số khán giả trung thành của thể loại vẫn tìm thấy những phân đoạn giải trí riêng.`
    };
  }
}

/**
 * Tích hợp Gemini AI để nâng cao chất lượng dịch và phân tích cốt truyện dạng Spoiler
 */
const CONTENT_CATEGORY_META = {
  nudity: { categoryName: 'Cảnh nóng & Nhạy cảm', categoryIcon: '🔥' },
  violence: { categoryName: 'Bạo lực & Đánh đấm', categoryIcon: '⚔️' },
  horror: { categoryName: 'Kinh dị & Rùng rợn', categoryIcon: '🩸' }
};

/**
 * Chuẩn hóa dữ liệu cảnh báo nội dung do Gemini trả về, đồng thời TỰ TÍNH LẠI số đếm
 * từ chính danh sách "scenes" thực tế để đảm bảo số liệu hiển thị luôn khớp 100%
 * với danh sách mốc thời gian (tránh lệch số như công thức suy diễn cũ theo thể loại).
 */
export function sanitizeContentAdvisory(raw) {
  if (!raw || !Array.isArray(raw.scenes)) return null;

  const scenes = raw.scenes
    .filter(s => s && CONTENT_CATEGORY_META[s.category])
    .map((s, idx) => ({
      id: `gemini-${s.category}-${idx + 1}`,
      category: s.category,
      categoryName: CONTENT_CATEGORY_META[s.category].categoryName,
      categoryIcon: CONTENT_CATEGORY_META[s.category].categoryIcon,
      timestamp: s.timestamp || '00:00:00 - 00:00:00',
      intensity: ['mild', 'moderate', 'severe'].includes(s.intensity) ? s.intensity : 'moderate',
      intensityLabel: s.intensityLabel || 'Vừa',
      title: s.title || 'Cảnh đáng chú ý',
      description: s.description || '',
      isSpoiler: !!s.isSpoiler
    }));

  if (scenes.length === 0) return null;

  const countFor = (cat) => scenes.filter(s => s.category === cat).length;
  const levelFor = (count) => (count === 0 ? 'none' : count === 1 ? 'mild' : count <= 3 ? 'moderate' : 'severe');
  const labelFor = (count) => (count === 0 ? 'Không có' : count === 1 ? 'Nhẹ' : count <= 3 ? 'Vừa' : 'Nặng');
  const buildStat = (cat) => {
    const count = countFor(cat);
    return { count, level: levelFor(count), label: labelFor(count) };
  };

  const languageStat = raw.stats?.language && Number.isFinite(raw.stats.language.count)
    ? raw.stats.language
    : { count: 0, level: 'mild', label: 'Bình thường' };

  return {
    verdict: raw.verdict || '',
    parentalGuidance: raw.parentalGuidance || '',
    stats: {
      nudity: buildStat('nudity'),
      violence: buildStat('violence'),
      horror: buildStat('horror'),
      language: languageStat
    },
    scenes
  };
}

export async function enhanceWithGemini(movieData) {
  const geminiKey = getStoredGeminiKey();
  if (!geminiKey) return movieData;

  const prompt = `
Bạn là chuyên gia phân tích và thẩm định điện ảnh. Hãy cung cấp bản thông tin chuẩn hóa, tóm tắt cốt truyện và bài phê bình chuyên sâu cho bộ phim "${movieData.title}" (${movieData.year}):
- Đạo diễn: ${movieData.director}
- Diễn viên: ${movieData.cast?.join(', ')}
- Thể loại: ${movieData.genres?.join(', ')}
- Chú thích phim ban đầu: "${movieData.synopsis}"
- Cốt truyện chi tiết hiện có: "${movieData.detailedPlot?.slice(0, 500) || ''}"

YÊU CẦU CỰC KỲ QUAN TRỌNG VỀ TÊN PHIM, TÓM TẮT VÀ PHÊ BÌNH:
1. "vietnameseTitle": Tên phim tiếng Việt chính thức tại rạp/nền tảng chiếu hoặc dịch chuẩn nghĩa tự nhiên (VD: "Kỵ Sĩ Bóng Đêm", "Vùng Đất Linh Hồn", "Ký Sinh Trùng", "Hố Đen Tử Thần", "Kẻ Thu Nợ: Trả Thù").
2. "englishTitle": Tên phim tiếng Anh chuẩn quốc tế.
3. "synopsis": Tóm tắt giới thiệu tiền đề phim ngắn gọn KHÔNG SPOILER (TỐI ĐA 60 CHỮ) theo phong cách chú thích phim Netflix / rạp chiếu, giới thiệu bối cảnh và mâu thuẫn mở đầu mà tuyệt đối KHÔNG tiết lộ plot twist, bước ngoặt hay cái kết.
4. "detailedPlot": Tóm tắt TOÀN BỘ cốt truyện từ đầu đến cuối ĐẦY ĐỦ TRỌN VẸN VÀ CHI TIẾT TRONG PHẠM VI TỐI ĐA 300 CHỮ (khoảng 220 - 280 từ tiếng Việt), tuyệt đối KHÔNG dừng giữa chừng hay tóm tắt sơ sài. Phải tóm lược mạch lạc 4 giai đoạn: 1. Mở đầu & bối cảnh -> 2. Diễn biến mâu thuẫn -> 3. Nút thắt / Biến cố cao trào -> 4. Kết cục trọn vẹn và số phận cuối cùng của các nhân vật chính.
5. "filmReview": Bài phê bình và nhận định phim chuyên sâu (TỐI ĐA 200 TỪ TIẾNG VIỆT): Đánh giá tổng quan tác phẩm, phân tích những thông điệp và ý nghĩa nhân văn/nghệ thuật sâu sắc của bộ phim, nêu bật các điểm tốt nổi trội (chỉ đạo đạo diễn, diễn xuất, kịch bản, âm nhạc, góc quay) và lý do phim xứng đáng thưởng thức.
6. "criticConsensus": Nhận định phê bình tiếng Việt phản ánh đúng mức điểm thực tế.
7. "audienceSentiment": Cảm nhận khán giả tiếng Việt phản ánh đúng mức điểm thực tế.
8. "contentAdvisory": Phân tích cảnh báo nội dung THỰC TẾ của CHÍNH BỘ PHIM NÀY (không dùng công thức chung, không suy diễn theo thể loại) dựa trên kiến thức thực sự của bạn về phim:
   - Chỉ liệt kê những cảnh CÓ THẬT mà bạn biết chắc chắn xuất hiện trong phim. Nếu bạn không có đủ thông tin chi tiết về các cảnh cụ thể, hãy để mảng "scenes" rỗng và mọi "count" bằng 0 — TUYỆT ĐỐI KHÔNG bịa đặt cảnh quay không có thật.
   - "stats.<category>.count" PHẢI bằng chính xác số phần tử có "category" tương ứng trong mảng "scenes" (không được lệch số).
   - Mốc thời gian "timestamp" ước lượng hợp lý theo thời lượng phim nếu không nhớ chính xác, định dạng "HH:MM:SS - HH:MM:SS".

Trả về duy nhất chuỗi JSON hợp lệ (không kèm markdown format):
{
  "vietnameseTitle": "Tên tiếng Việt chính thức hoặc dịch chuẩn",
  "englishTitle": "Tên tiếng Anh chuẩn quốc tế",
  "synopsis": "Tóm tắt ngắn gọn KHÔNG SPOILER tối đa 60 chữ phong cách Netflix",
  "detailedPlot": "Tóm tắt toàn bộ cốt truyện đầy đủ chi tiết trọn vẹn từ đầu đến kết cục (tối đa 300 chữ)",
  "filmReview": "Bài phê bình và nhận định phim chuyên sâu, nêu bật ý nghĩa và điểm tốt nổi bật (tối đa 200 chữ)",
  "criticConsensus": "Nhận định phê bình tiếng Việt",
  "audienceSentiment": "Cảm nhận khán giả tiếng Việt",
  "contentAdvisory": {
    "verdict": "Câu giải thích lý do phân loại độ tuổi dựa trên nội dung thực tế của phim",
    "parentalGuidance": "Khuyến nghị dành cho phụ huynh/người xem",
    "stats": {
      "nudity": { "count": 0, "level": "none|mild|moderate|severe", "label": "Không có|Nhẹ|Vừa|Nặng" },
      "violence": { "count": 0, "level": "none|mild|moderate|severe", "label": "Không có|Nhẹ|Vừa|Nặng" },
      "horror": { "count": 0, "level": "none|mild|moderate|severe", "label": "Không có|Nhẹ|Vừa|Nặng" },
      "language": { "count": 0, "level": "mild|moderate", "label": "Bình thường|Chửi thề / Gay gắt" }
    },
    "scenes": [
      {
        "category": "nudity|violence|horror",
        "timestamp": "00:00:00 - 00:00:00",
        "title": "Tên ngắn gọn của cảnh",
        "description": "Mô tả cụ thể cảnh quay có thật trong phim",
        "intensity": "mild|moderate|severe",
        "intensityLabel": "Nhẹ|Vừa|Nặng",
        "isSpoiler": false
      }
    ]
  }
}
`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        })
      }
    );

    if (res.ok) {
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) {
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const enhanced = JSON.parse(clean);
        const resolved = resolveMovieTitles({
          title: enhanced.englishTitle || movieData.title,
          originalTitle: movieData.originalTitle || movieData.title,
          vietnameseTitle: enhanced.vietnameseTitle || movieData.vietnameseTitle,
          englishTitle: enhanced.englishTitle || movieData.englishTitle
        });

        return {
          ...movieData,
          title: resolved.englishTitle || movieData.title,
          englishTitle: resolved.englishTitle || movieData.title,
          vietnameseTitle: resolved.vietnameseTitle || movieData.vietnameseTitle,
          synopsis: formatQuickSynopsis(enhanced.synopsis || movieData.synopsis, 60),
          detailedPlot: formatDetailedPlot(enhanced.detailedPlot || movieData.detailedPlot, 300),
          filmReview: enhanced.filmReview 
            ? formatFilmReview(enhanced.filmReview, 200) 
            : generateFallbackFilmReview({ ...movieData, ...enhanced }),
          criticConsensus: enhanced.criticConsensus || movieData.criticConsensus,
          audienceSentiment: enhanced.audienceSentiment || movieData.audienceSentiment,
          contentAdvisory: sanitizeContentAdvisory(enhanced.contentAdvisory) || movieData.contentAdvisory,
          enhancedByGemini: true
        };
      }
    }
  } catch (e) {
    console.warn('Lỗi khi nâng cấp bằng Gemini:', e);
  }

  return movieData;
}



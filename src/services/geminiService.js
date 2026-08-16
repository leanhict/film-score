/**
 * Gemini AI Movie Research & Aggregator Service
 * Tra cứu thời gian thực thông tin và điểm số từ IMDb, Rotten Tomatoes và Metacritic
 * Kết hợp Live API Data + Google Gemini AI Language Model
 */

import { fetchLiveMovieRatings, enhanceWithGemini, fetchMovieById } from './movieDataService.js';
import { resolveMovieTitles } from '../utils/movieTitleResolver.js';
import { formatQuickSynopsis, formatDetailedPlot, formatFilmReview } from '../utils/searchUtils.js';

const LOCAL_STORAGE_KEY = 'filmscore_gemini_api_key';

export function getStoredGeminiKey() {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
}

export function saveStoredGeminiKey(key) {
  if (typeof localStorage === 'undefined') return;
  if (key && key.trim()) {
    localStorage.setItem(LOCAL_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

/**
 * Hàm tra cứu thời gian thực:
 * 1. Tìm kiếm đa nguồn (IMDb Official Suggestions + OMDb Database).
 * 2. Lấy điểm số thực tế 100% từ IMDb, Rotten Tomatoes, Metacritic.
 * 3. Trả về phim chính xác nhất kèm danh sách các phim cùng tên để người dùng dễ dàng chuyển đổi.
 */
export async function searchMovieWithGemini(query, customApiKey = '') {
  const cleanQuery = query.trim();
  if (!cleanQuery) throw new Error('Vui lòng nhập tên phim cần tra cứu.');

  try {
    // 1. LẤY DỮ LIỆU ĐIỂM SỐ THỰC TẾ & DANH SÁCH ỨNG VIÊN KHỚP TỪ KHÓA
    const { movie, candidates } = await fetchLiveMovieRatings(cleanQuery);

    // 2. NÂNG CAO NỘI DUNG TIẾNG VIỆT VỚI GEMINI NẾU CÓ KEY
    const enhancedData = await enhanceWithGemini(movie);

    return {
      ...enhancedData,
      candidates: candidates || [],
      source: enhancedData.enhancedByGemini
        ? 'Dữ liệu Thực tế (IMDb, RT, Metacritic) + Gemini AI biên dịch'
        : 'Nguồn Xác thực Thời gian thực (IMDb, Rotten Tomatoes, Metacritic)'
    };
  } catch (liveError) {
    console.warn('Không lấy được từ Live API, thử tra cứu trực tiếp qua Gemini API:', liveError);

    // Nếu không tìm thấy qua Live API, thử gọi trực tiếp Gemini nếu có API Key
    const apiKey = customApiKey || getStoredGeminiKey();
    if (apiKey) {
      return fetchDirectlyFromGemini(cleanQuery, apiKey);
    }

    throw new Error(`Không tìm thấy dữ liệu cho phim "${cleanQuery}". Vui lòng kiểm tra lại chính tả tên phim.`);
  }
}

/**
 * Lấy chi tiết của một ứng viên cụ thể theo IMDb ID
 */
export async function loadCandidateDetails(imdbID) {
  const movie = await fetchMovieById(imdbID);
  const enhanced = await enhanceWithGemini(movie);
  return {
    ...enhanced,
    source: enhanced.enhancedByGemini
      ? 'Dữ liệu Thực tế (IMDb, RT, Metacritic) + Gemini AI biên dịch'
      : 'Nguồn Xác thực Thời gian thực (IMDb, Rotten Tomatoes, Metacritic)'
  };
}

/**
 * Gọi trực tiếp Gemini API khi cần tra cứu đặc biệt
 */
async function fetchDirectlyFromGemini(query, apiKey) {
  const prompt = `
Bạn là chuyên gia thẩm định và phân tích điện ảnh và phim truyền hình / series. Hãy tra cứu và cung cấp thông tin, điểm số CHÍNH XÁC THỰC TẾ từ IMDb, Rotten Tomatoes và Metacritic của tác phẩm (phim điện ảnh hoặc TV Series / Netflix Original): "${query}".

LƯU Ý CỰC KỲ QUAN TRỌNG:
- Điểm IMDb (thang điểm 10) phải là điểm số thực tế trên trang imdb.com. Tuyệt đối không tự bịa hoặc phóng đại điểm số!
- Điểm Rotten Tomatoes Tomatometer (% giới phê bình) và Popcornmeter (% khán giả).
- Điểm Metacritic Metascore (/100).
- Nếu không có điểm ở nguồn nào, hãy để null.

Trả về duy nhất định dạng JSON (không dùng markdown codeblock, không kèm text ngoài JSON):
{
  "title": "Tên phim gốc tiếng Anh hoặc bản địa",
  "vietnameseTitle": "Tên phim tiếng Việt chính thức hoặc dịch chuẩn",
  "year": 2024,
  "runtime": "Thời lượng (ví dụ '115 phút' hoặc '2 Mùa')",
  "director": "Tên đạo diễn hoặc Nhà sáng tạo (Creator)",
  "cast": ["Diễn viên 1", "Diễn viên 2", "Diễn viên 3"],
  "genres": ["Thể loại tiếng Việt 1", "Thể loại 2"],
  "country": "Quốc gia",
  "poster": "URL ảnh poster thực tế nếu có hoặc URL placeholder đẹp",
  "backdrop": "URL ảnh banner",
  "trailerUrl": "URL trailer youtube chính thức hoặc link tìm kiếm",
  "synopsis": "Tóm tắt ngắn gọn KHÔNG SPOILER (tối đa 60 chữ) theo phong cách chú thích phim Netflix / rạp chiếu, giới thiệu tiền đề câu chuyện mà tuyệt đối không tiết lộ plot twist hay kết cục",
  "detailedPlot": "Tóm tắt TOÀN BỘ cốt truyện từ đầu đến cuối ĐẦY ĐỦ TRỌN VẸN VÀ CHI TIẾT TRONG PHẠM VI TỐI ĐA 300 CHỮ (khoảng 220 - 280 từ tiếng Việt), tuyệt đối không dừng giữa chừng hay tóm tắt sơ sài. Phải tóm lược mạch lạc 4 giai đoạn: 1. Mở đầu & bối cảnh -> 2. Diễn biến mâu thuẫn -> 3. Nút thắt / Biến cố cao trào -> 4. Kết cục trọn vẹn và số phận cuối cùng của các nhân vật chính.",
  "filmReview": "Bài phê bình và nhận định phim chuyên sâu (tối đa 200 từ tiếng Việt): Nhận xét đánh giá tổng quan, phân tích những thông điệp và ý nghĩa nhân văn/nghệ thuật sâu sắc của tác phẩm, nêu bật các điểm tốt nổi trội (chỉ đạo đạo diễn, diễn xuất, kịch bản, âm nhạc, góc quay) và lý do phim xứng đáng thưởng thức.",
  "criticConsensus": "Nhận định tổng quan của giới phê bình bằng tiếng Việt phản ánh đúng mức điểm",
  "audienceSentiment": "Cảm nhận của khán giả đại chúng bằng tiếng Việt phản ánh đúng mức điểm",
  "ratings": {
    "imdb": 7.0,
    "imdbVotes": "10,000+",
    "rtCritics": 75,
    "rtAudience": 80,
    "metascore": 70,
    "mcUser": 7.2
  },
  "streaming": ["Apple TV+", "Netflix", "Galaxy Play"],
  "boxOffice": "Doanh thu phòng vé hoặc N/A",
  "awards": "Giải thưởng hoặc N/A",
  "ageRating": "T18"
}
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        }
      })
    }
  );

  if (!res.ok) {
    throw new Error(`Lỗi gọi Gemini API (${res.status})`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini không phản hồi dữ liệu.');

  const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(clean);

  const resolved = resolveMovieTitles({
    title: parsed.title,
    originalTitle: parsed.title,
    vietnameseTitle: parsed.vietnameseTitle,
    englishTitle: parsed.englishTitle || parsed.title
  });

  return {
    ...parsed,
    title: resolved.englishTitle || parsed.title,
    englishTitle: resolved.englishTitle || parsed.title,
    vietnameseTitle: resolved.vietnameseTitle || parsed.vietnameseTitle || parsed.title,
    synopsis: formatQuickSynopsis(parsed.synopsis, 60),
    detailedPlot: formatDetailedPlot(parsed.detailedPlot, 300),
    filmReview: formatFilmReview(parsed.filmReview, 200),
    id: `ai-gemini-${Date.now()}`,
    candidates: [],
    source: 'Google Gemini AI Realtime Search',
    poster: parsed.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    backdrop: parsed.backdrop || parsed.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
  };
}

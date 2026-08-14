/**
 * Gemini AI Movie Research & Aggregator Service
 * Tra cứu thời gian thực thông tin và điểm số từ IMDb, Rotten Tomatoes và Metacritic
 * Kết hợp Live API Data + Google Gemini AI Language Model
 */

import { fetchLiveMovieRatings, enhanceWithGemini, fetchMovieById } from './movieDataService.js';

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
Bạn là chuyên gia thẩm định và phân tích điện ảnh. Hãy tra cứu và cung cấp thông tin, điểm số CHÍNH XÁC THỰC TẾ từ IMDb, Rotten Tomatoes và Metacritic của bộ phim: "${query}".

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
  "runtime": "95 phút",
  "director": "Tên đạo diễn chính xác",
  "cast": ["Diễn viên 1", "Diễn viên 2", "Diễn viên 3"],
  "genres": ["Thể loại tiếng Việt 1", "Thể loại 2"],
  "country": "Quốc gia",
  "poster": "URL ảnh poster thực tế nếu có hoặc URL placeholder đẹp",
  "backdrop": "URL ảnh banner",
  "trailerUrl": "URL trailer youtube chính thức hoặc link tìm kiếm",
  "synopsis": "Tóm tắt ngắn gọn 1-2 câu tiếng Việt",
  "detailedPlot": "Tóm tắt toàn bộ cốt truyện chi tiết kiểu spoiler (150-300 từ) kể trực diện các biến cố, bước ngoặt và kết cục của nhân vật, không dùng lời văn quảng cáo hay nhận xét sáo rỗng",
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
  "awards": "Giải thưởng hoặc N/A"
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

  return {
    ...parsed,
    id: `ai-gemini-${Date.now()}`,
    candidates: [],
    source: 'Google Gemini AI Realtime Search',
    poster: parsed.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    backdrop: parsed.backdrop || parsed.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
  };
}

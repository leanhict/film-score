/**
 * Bộ công cụ hỗ trợ tìm kiếm tiếng Việt thông minh (Hỗ trợ có dấu, không dấu, viết tắt, và từ đồng nghĩa)
 */

import { MOVIE_TITLE_DATABASE } from './movieTitleResolver.js';

// Bảng tra cứu tên phim tiếng Việt phổ biến sang tên gốc quốc tế
export const VIETNAMESE_TITLE_MAP = {
  'ky si bong dem': 'The Dark Knight',
  'kỵ sĩ bóng đêm': 'The Dark Knight',
  'hiep si bong dem': 'The Dark Knight',
  'vung dat linh hon': 'Spirited Away',
  'vùng đất linh hồn': 'Spirited Away',
  'ky sinh trung': 'Parasite',
  'ký sinh trùng': 'Parasite',
  'ho den tu than': 'Interstellar',
  'hố đen tử thần': 'Interstellar',
  'ho tu than': 'Interstellar',
  'hanh tinh cat': 'Dune',
  'hành tinh cát': 'Dune',
  'hanh tinh cat 2': 'Dune: Part Two',
  'hành tinh cát 2': 'Dune: Part Two',
  'cha de bom nguyen tu': 'Oppenheimer',
  'cha đẻ bom nguyên tử': 'Oppenheimer',
  'bo gia': 'The Godfather',
  'bố già': 'The Godfather',
  'nguoi nhen': 'Spider-Man',
  'người nhện': 'Spider-Man',
  'nguoi doi': 'Batman',
  'người dơi': 'Batman',
  'nguoi sat': 'Iron Man',
  'người sắt': 'Iron Man',
  'biet doi sieu anh hung': 'The Avengers',
  'biệt đội siêu anh hùng': 'The Avengers',
  'chua te nhung chiec nhan': 'The Lord of the Rings',
  'chúa tể những chiếc nhẫn': 'The Lord of the Rings',
  'ke huy diet': 'The Terminator',
  'kẻ hủy diệt': 'The Terminator',
  'ma tran': 'The Matrix',
  'ma trận': 'The Matrix',
  'vua su tu': 'The Lion King',
  'vua sư tử': 'The Lion King',
  'chuyen tau sinh tu': 'Train to Busan',
  'chuyến tàu sinh tử': 'Train to Busan',
  'su im lang cua bay cuu': 'The Silence of the Lambs',
  'sự im lặng của bầy cừu': 'The Silence of the Lambs',
  'ke cap mat trang': 'Despicable Me',
  'kẻ cắp mặt trăng': 'Despicable Me',
  'nhung manh ghep cam xuc': 'Inside Out',
  'những mảnh ghép cảm xúc': 'Inside Out',
  'nu hoang bang gia': 'Frozen',
  'nữ hoàng băng giá': 'Frozen',
  'cau chuyen do choi': 'Toy Story',
  'câu chuyện đồ chơi': 'Toy Story',
  'di tim nemo': 'Finding Nemo',
  'đi tìm nemo': 'Finding Nemo',
  'vut bay': 'Up',
  'vút bay': 'Up',
  'vung dat cam lang': 'A Quiet Place',
  'vùng đất câm lặng': 'A Quiet Place',
  'nha tu shawshank': 'The Shawshank Redemption',
  'nhà tù shawshank': 'The Shawshank Redemption',
  'sat thu john wick': 'John Wick',
  'sát thủ john wick': 'John Wick',
  'nhiem vu bat kha thi': 'Mission: Impossible',
  'nhiệm vụ bất khả thi': 'Mission: Impossible',
  'qua nhanh qua nguy hiem': 'Fast and Furious',
  'quá nhanh quá nguy hiểm': 'Fast and Furious',
  'the than': 'Avatar',
  'thế thân': 'Avatar',
  'tham tu lung danh conan': 'Detective Conan',
  'thám tử lừng danh conan': 'Detective Conan',
  'thanh guom diet quy': 'Demon Slayer',
  'thanh gươm diệt quỷ': 'Demon Slayer',
  'chu thuat hoi chien': 'Jujutsu Kaisen',
  'chú thuật hồi chiến': 'Jujutsu Kaisen',
  'dao hai tac': 'One Piece',
  'đảo hải tặc': 'One Piece',
  'bay vien ngoc rong': 'Dragon Ball',
  'bảy viên ngọc rồng': 'Dragon Ball',
  'mat biec': 'Dreamy Eyes',
  'mắt biếc': 'Dreamy Eyes',
  'dao pho va piano': 'Peach Blossom, Pho and Piano',
  'đào phở và piano': 'Peach Blossom, Pho and Piano',
  'dao, pho va piano': 'Peach Blossom, Pho and Piano',
  'đào, phở và piano': 'Peach Blossom, Pho and Piano',
  'lat mat': 'Face Off',
  'lật mặt': 'Face Off',
  'lat mat 7': 'Face Off 7: One Wish',
  'lật mặt 7': 'Face Off 7: One Wish',
  'nu tu chien binh': 'Warrior Nun',
  'nữ tu chiến binh': 'Warrior Nun',
  'tro choi con muc': 'Squid Game',
  'trò chơi con mực': 'Squid Game',
  'vinh quang trong thu han': 'The Glory',
  'vinh quang trong thù hận': 'The Glory',
  'ha canh noi anh': 'Crash Landing on You',
  'hạ cánh nơi anh': 'Crash Landing on You',
  'tho san quai vat': 'The Witcher',
  'thợ săn quái vật': 'The Witcher',
  'cau be mat tich': 'Stranger Things',
  'cậu bé mất tích': 'Stranger Things',
  'nu hoang nuoc mat': 'Queen of Tears',
  'nữ hoàng nước mắt': 'Queen of Tears',
  'phi vu trieu do': 'Money Heist',
  'phi vụ triệu đô': 'Money Heist',
  'bong ma anh quoc': 'Peaky Blinders',
  'bóng ma anh quốc': 'Peaky Blinders',
  'tam the': '3 Body Problem',
  'tam thể': '3 Body Problem'
};

/**
 * Xóa dấu tiếng Việt chuẩn xác
 */
export function removeVietnameseTones(str = '') {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Chuẩn hóa chuỗi tìm kiếm (xóa dấu, chuyển thường, xóa ký tự đặc biệt thừa)
 */
export function normalizeSearchString(str = '') {
  if (!str) return '';
  return removeVietnameseTones(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kiểm tra xem phim có khớp với từ khóa tìm kiếm tiếng Việt hoặc tiếng Anh hay không
 */
export function matchMovieSearch(movie, query = '') {
  const q = query.trim();
  if (!q) return true;
  if (!movie) return false;

  const rawQ = q.toLowerCase();
  const normQ = normalizeSearchString(q);

  // 1. Kiểm tra ánh xạ tên phim tiếng Việt sang tiếng Anh
  const mappedTitle = VIETNAMESE_TITLE_MAP[rawQ] || VIETNAMESE_TITLE_MAP[normQ] || MOVIE_TITLE_DATABASE[rawQ]?.en || MOVIE_TITLE_DATABASE[rawQ]?.vi;
  if (mappedTitle) {
    const normMapped = normalizeSearchString(mappedTitle);
    if (normalizeSearchString(movie.title).includes(normMapped) || normalizeSearchString(movie.vietnameseTitle).includes(normMapped)) {
      return true;
    }
  }

  // 2. Thu thập toàn bộ các trường dữ liệu có thể tìm kiếm của phim
  const searchFields = [
    movie.title || '',
    movie.vietnameseTitle || '',
    movie.director || '',
    movie.country || '',
    movie.year ? String(movie.year) : '',
    Array.isArray(movie.cast) ? movie.cast.join(' ') : (movie.cast || ''),
    Array.isArray(movie.genres) ? movie.genres.join(' ') : (movie.genres || ''),
    movie.synopsis || ''
  ];

  // Kiểm tra khớp trực tiếp (Có dấu)
  for (const field of searchFields) {
    if (field.toLowerCase().includes(rawQ)) {
      return true;
    }
  }

  // Kiểm tra khớp không dấu (Không dấu)
  const normFields = searchFields.map(f => normalizeSearchString(f));
  for (const normField of normFields) {
    if (normField.includes(normQ)) {
      return true;
    }
  }

  // 3. Khớp từng từ (Word-by-word match, ví dụ: "bố già 2021" hoặc "trấn thành mai")
  const queryWords = normQ.split(' ').filter(w => w.length > 0);
  if (queryWords.length > 1) {
    const combinedNormText = normFields.join(' ');
    const allWordsMatch = queryWords.every(word => combinedNormText.includes(word));
    if (allWordsMatch) return true;
  }

  return false;
}

/**
 * Đếm số từ trong đoạn văn bản
 */
export function countWords(text = '') {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Định dạng và chuẩn hóa Tóm tắt nhanh phong cách Netflix (Non-spoiler, tối đa 60 từ)
 */
export function formatQuickSynopsis(text = '', maxWords = 60) {
  if (!text || typeof text !== 'string') return '';
  let clean = text.replace(/\s+/g, ' ').trim();
  
  // Loại bỏ các tiền tố thừa nếu có
  clean = clean.replace(/^(Tóm tắt nhanh|Tóm tắt|Chú thích|Nội dung tóm tắt|Nội dung|Cốt truyện|Giới thiệu)\s*:\s*/i, '');

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return clean;
  }

  // Cắt tới maxWords từ
  const truncated = words.slice(0, maxWords).join(' ');
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExcl = truncated.lastIndexOf('!');
  const lastQ = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExcl, lastQ);

  // Nếu trong phạm vi >= 25 từ có điểm kết thúc câu hoàn chỉnh thì lấy trọn vẹn câu
  if (lastSentenceEnd > 0) {
    const candidate = truncated.slice(0, lastSentenceEnd + 1).trim();
    const cWords = candidate.split(/\s+/).filter(Boolean).length;
    if (cWords >= 25) {
      return candidate;
    }
  }

  // Cắt mượt mà và thêm dấu ...
  const polished = truncated.replace(/[,;:\-\s]+$/, '');
  return `${polished}...`;
}

/**
 * Định dạng và chuẩn hóa Tóm tắt diễn biến chi tiết (Spoiler, tối đa 200 từ)
 * Đảm bảo văn bản hoàn chỉnh, kết thúc bằng dấu câu trọn vẹn trong giới hạn 200 từ
 */
export function formatDetailedPlot(text = '', maxWords = 200) {
  if (!text || typeof text !== 'string') return '';
  let clean = text.replace(/\s+/g, ' ').trim();

  // Loại bỏ các tiền tố thừa nếu có
  clean = clean.replace(/^(Tóm tắt diễn biến|Tóm tắt cốt truyện|Cốt truyện chi tiết|Cốt truyện|Diễn biến)\s*:\s*/i, '');

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return clean;
  }

  // Cắt tới maxWords từ
  const truncated = words.slice(0, maxWords).join(' ');
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExcl = truncated.lastIndexOf('!');
  const lastQ = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExcl, lastQ);

  // Nếu trong phạm vi >= 60 từ có điểm kết thúc câu hoàn chỉnh thì lấy trọn vẹn câu
  if (lastSentenceEnd > 0) {
    const candidate = truncated.slice(0, lastSentenceEnd + 1).trim();
    const cWords = candidate.split(/\s+/).filter(Boolean).length;
    if (cWords >= 60) {
      return candidate;
    }
  }

  // Cắt mượt mà và thêm dấu ...
  const polished = truncated.replace(/[,;:\-\s]+$/, '');
  return `${polished}...`;
}

/**
 * Định dạng và chuẩn hóa Bài Phê Bình Phim (tối đa 200 từ)
 * Bao gồm nhận xét, nhận định phim, những ý nghĩa và các điểm tốt nổi bật của tác phẩm
 */
export function formatFilmReview(text = '', maxWords = 200) {
  if (!text || typeof text !== 'string') return '';
  let clean = text.replace(/\s+/g, ' ').trim();

  // Loại bỏ các tiền tố thừa nếu có
  clean = clean.replace(/^(Phê bình phim|Phê bình|Nhận định phê bình|Đánh giá chuyên sâu|Nhận xét & Ý nghĩa|Đánh giá phim|Bài phê bình)\s*:\s*/i, '');

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return clean;
  }

  // Cắt tới maxWords từ
  const truncated = words.slice(0, maxWords).join(' ');
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExcl = truncated.lastIndexOf('!');
  const lastQ = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExcl, lastQ);

  // Nếu trong phạm vi >= 60 từ có điểm kết thúc câu hoàn chỉnh thì lấy trọn vẹn câu
  if (lastSentenceEnd > 0) {
    const candidate = truncated.slice(0, lastSentenceEnd + 1).trim();
    const cWords = candidate.split(/\s+/).filter(Boolean).length;
    if (cWords >= 60) {
      return candidate;
    }
  }

  // Cắt mượt mà và thêm dấu ...
  const polished = truncated.replace(/[,;:\-\s]+$/, '');
  return `${polished}...`;
}

/**
 * Trích xuất năm sản xuất / phát hành thành số nguyên chuẩn xác
 * Hỗ trợ các định dạng: 2024, "2024", "2015–2020", "2015-", "2015-05-12", null, undefined
 */
export function parseYearToNumber(yearVal) {
  if (!yearVal && yearVal !== 0) return 0;
  if (typeof yearVal === 'number') return isNaN(yearVal) ? 0 : yearVal;
  const str = String(yearVal).trim();
  const match = str.match(/\b(18\d\d|19\d\d|20\d\d)\b/);
  if (match) return parseInt(match[1], 10);
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
}


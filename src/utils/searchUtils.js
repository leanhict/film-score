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
  'ma tran 1': 'The Matrix',
  'ma trận 1': 'The Matrix',
  'ma tran 2': 'The Matrix Reloaded',
  'ma trận 2': 'The Matrix Reloaded',
  'ma tran tai lap': 'The Matrix Reloaded',
  'ma trận tái lập': 'The Matrix Reloaded',
  'ma tran 3': 'The Matrix Revolutions',
  'ma trận 3': 'The Matrix Revolutions',
  'ma tran 4': 'The Matrix Resurrections',
  'ma trận 4': 'The Matrix Resurrections',
  'ma tran hoi sinh': 'The Matrix Resurrections',
  'ma trận hồi sinh': 'The Matrix Resurrections',
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
  clean = clean.replace(/^(Giới thiệu phim|Tóm tắt nhanh|Tóm tắt|Chú thích|Nội dung tóm tắt|Nội dung|Cốt truyện|Giới thiệu)\s*:\s*/i, '');

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
 * Định dạng và chuẩn hóa Tóm tắt diễn biến chi tiết (Spoiler, tối đa 300 từ)
 * Đảm bảo văn bản hoàn chỉnh, kết thúc bằng dấu câu trọn vẹn trong giới hạn tối đa 300 từ
 */
export function formatDetailedPlot(text = '', maxWords = 300) {
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

  // Nếu trong phạm vi >= 100 từ có điểm kết thúc câu hoàn chỉnh thì lấy trọn vẹn câu
  if (lastSentenceEnd > 0) {
    const candidate = truncated.slice(0, lastSentenceEnd + 1).trim();
    const cWords = candidate.split(/\s+/).filter(Boolean).length;
    if (cWords >= 100) {
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

/**
 * Tính điểm mức độ liên quan (Relevance Score) giữa kết quả và từ khóa tìm kiếm
 * Ưu tiên cao nhất cho tác phẩm có tên trùng khớp trực tiếp với nội dung người dùng tìm kiếm
 * (ví dụ: tìm "ma trận" thì các phim có tên "ma trận", "ma tran" sẽ đứng trên "matrix" và phim không liên quan).
 */
export function calculateRelevance(cand, rawQuery = '', targetYear = null, searchTitles = []) {
  if (!cand || !rawQuery) return 0;

  const cleanRaw = String(rawQuery).replace(/["'“”‘’]/g, '').trim();
  const cleanQ = cleanRaw.replace(/\b(19\d\d|20\d\d)\b/g, '').replace(/[()]/g, '').trim();
  const qCleanRaw = cleanQ.toLowerCase();
  const qNorm = normalizeSearchString(cleanQ);
  const qUnaccented = removeVietnameseTones(cleanQ).trim().toLowerCase();

  if (!qNorm) return 0;

  // Lấy các biến thể tên của ứng viên
  const titleRaw = (cand.title || '').trim().toLowerCase();
  const titleNorm = normalizeSearchString(cand.title || '');
  const viTitleRaw = (cand.vietnameseTitle || '').trim().toLowerCase();
  const viTitleNorm = normalizeSearchString(cand.vietnameseTitle || '');
  const enTitleRaw = (cand.englishTitle || '').trim().toLowerCase();
  const enTitleNorm = normalizeSearchString(cand.englishTitle || '');
  const origTitleRaw = (cand.originalTitle || '').trim().toLowerCase();
  const origTitleNorm = normalizeSearchString(cand.originalTitle || '');

  // Tập hợp các tiêu đề trực tiếp (ưu tiên hiển thị tiếng Việt & tiêu đề chính)
  const directTitles = [
    { raw: viTitleRaw, norm: viTitleNorm },
    { raw: titleRaw, norm: titleNorm }
  ].filter(t => t.norm);

  // Tất cả tiêu đề (bao gồm cả tiếng Anh & tên gốc)
  const allTitles = [
    { raw: viTitleRaw, norm: viTitleNorm },
    { raw: titleRaw, norm: titleNorm },
    { raw: enTitleRaw, norm: enTitleNorm },
    { raw: origTitleRaw, norm: origTitleNorm }
  ].filter(t => t.norm);

  let directScore = 0;

  // 1. KIỂM TRA TRÙNG KHỚP TRỰC TIẾP VỚI TỪ KHÓA TÌM KIẾM CỦA NGƯỜI DÙNG (DIRECT MATCH)
  // 1.1 Khớp chính xác hoàn toàn (Exact full match)
  const isDirectExact = directTitles.some(t => t.norm === qNorm);
  const isAllExact = allTitles.some(t => t.norm === qNorm);

  if (isDirectExact) {
    directScore = 100000;
    // Thưởng nếu khớp cả dấu tiếng Việt
    if (directTitles.some(t => t.raw === qCleanRaw)) {
      directScore += 2000;
    }
  } else if (isAllExact) {
    directScore = 90000;
  }
  // 1.2 Bắt đầu bằng từ khóa tìm kiếm (Prefix match: ví dụ "Ma Trận: Hồi Sinh" khi tìm "ma trận")
  else {
    const isDirectPrefix = directTitles.some(t => 
      t.norm.startsWith(qNorm + ' ') || 
      t.norm.startsWith(qNorm + ':') || 
      t.norm.startsWith(qNorm + '-') ||
      t.norm.startsWith(qNorm + '–') ||
      t.norm === qNorm
    );
    const isAllPrefix = allTitles.some(t => 
      t.norm.startsWith(qNorm + ' ') || 
      t.norm.startsWith(qNorm + ':') || 
      t.norm.startsWith(qNorm + '-') ||
      t.norm.startsWith(qNorm + '–') ||
      t.norm === qNorm
    );

    if (isDirectPrefix) {
      directScore = 80000;
      if (directTitles.some(t => t.raw.startsWith(qCleanRaw))) {
        directScore += 1000;
      }
    } else if (isAllPrefix) {
      directScore = 70000;
    }
    // 1.3 Chứa cụm từ khóa tìm kiếm (Substring match: ví dụ "Thế Giới Ma Trận" khi tìm "ma trận")
    else {
      const isDirectSub = directTitles.some(t => t.norm.includes(qNorm));
      const isAllSub = allTitles.some(t => t.norm.includes(qNorm));

      if (isDirectSub) {
        directScore = 60000;
      } else if (isAllSub) {
        directScore = 50000;
      }
      // 1.4 Khớp tất cả các từ đơn (Word-by-word match)
      else {
        const qWords = qNorm.split(' ').filter(w => w.length > 1);
        if (qWords.length > 1) {
          const directMatched = directTitles.some(t => {
            const words = t.norm.split(' ');
            return qWords.every(qw => words.includes(qw));
          });
          const allMatched = allTitles.some(t => {
            const words = t.norm.split(' ');
            return qWords.every(qw => words.includes(qw));
          });

          if (directMatched) {
            directScore = 45000;
          } else if (allMatched) {
            directScore = 40000;
          }
        } else if (qWords.length === 1) {
          const singleWord = qWords[0];
          const hasWord = allTitles.some(t => t.norm.split(' ').includes(singleWord));
          if (hasWord) {
            directScore = 30000;
          }
        }
      }
    }
  }

  // Tự động suy diễn searchTitles nếu không được truyền vào
  let resolvedSearchTitles = searchTitles && searchTitles.length > 0 ? searchTitles : [];
  if (resolvedSearchTitles.length === 0) {
    resolvedSearchTitles = [cleanQ];
    const mapped = VIETNAMESE_TITLE_MAP[cleanQ.toLowerCase()] || 
                   VIETNAMESE_TITLE_MAP[qNorm] || 
                   MOVIE_TITLE_DATABASE[cleanQ.toLowerCase()]?.en || 
                   MOVIE_TITLE_DATABASE[qNorm]?.en;
    if (mapped && !resolvedSearchTitles.includes(mapped)) {
      resolvedSearchTitles.unshift(mapped);
    }
    if (qUnaccented && qUnaccented !== cleanQ.toLowerCase() && !resolvedSearchTitles.includes(qUnaccented)) {
      resolvedSearchTitles.push(qUnaccented);
    }
  }

  // 2. KIỂM TRA KHỚP VỚI TÊN ĐÃ DỊCH / ÁNH XẠ (TRANSLATED / MAPPED MATCH - ví dụ tìm "ma trận" -> ánh xạ sang "The Matrix")
  let mappedScore = 0;
  const mappedQueries = resolvedSearchTitles
    .filter(st => normalizeSearchString(st) !== qNorm)
    .map(st => ({
      raw: st.toLowerCase(),
      norm: normalizeSearchString(st)
    }))
    .filter(m => m.norm && m.norm.length > 1);

  if (mappedQueries.length > 0) {
    for (const mq of mappedQueries) {
      const isExact = allTitles.some(t => t.norm === mq.norm);
      if (isExact) {
        mappedScore = Math.max(mappedScore, 35000);
        break;
      }

      const isPrefix = allTitles.some(t => 
        t.norm.startsWith(mq.norm + ' ') || 
        t.norm.startsWith(mq.norm + ':') || 
        t.norm.startsWith(mq.norm + '-') ||
        t.norm.startsWith(mq.norm + '–')
      );
      if (isPrefix) {
        mappedScore = Math.max(mappedScore, 25000);
        continue;
      }

      const isSub = allTitles.some(t => t.norm.includes(mq.norm));
      if (isSub) {
        mappedScore = Math.max(mappedScore, 18000);
        continue;
      }

      // Khớp theo từ đơn của cụm từ dịch (loại bỏ từ nối như 'the', 'a', 'an', 'and')
      const mqWords = mq.norm.split(' ').filter(w => w.length > 2 && !['the', 'and', 'for'].includes(w));
      if (mqWords.length > 0) {
        const hasMqWord = allTitles.some(t => {
          const words = t.norm.split(' ');
          return mqWords.some(w => words.includes(w) || t.norm.includes(w));
        });
        if (hasMqWord) {
          mappedScore = Math.max(mappedScore, 12000);
        }
      }
    }
  }

  // Lấy điểm khớp từ khóa cao nhất
  let baseScore = Math.max(directScore, mappedScore);

  // NẾU HOÀN TOÀN KHÔNG KHỚP BẤT KỲ TỪ KHÓA NÀO -> LOẠI BỎ (ĐIỂM 0)
  if (baseScore === 0) {
    return 0;
  }

  let finalScore = baseScore;

  // 3. THƯỞNG NĂM NẾU NGƯỜI DÙNG CÓ CHỈ ĐỊNH NĂM CỤ THỂ
  if (targetYear && cand.year) {
    const candYear = parseYearToNumber(cand.year);
    if (candYear === targetYear) {
      finalScore += 50000;
    } else if (Math.abs(candYear - targetYear) <= 1) {
      finalScore += 10000;
    } else {
      finalScore -= 20000; // Phạt nếu sai năm mà người dùng đã chỉ định
    }
  }

  // 4. THƯỞNG ĐỘ UY TÍN / PHỔ BIẾN / ĐIỂM SỐ (IMDb Rating & Votes)
  if (cand.voteCount) {
    finalScore += Math.min(3000, Math.log10(cand.voteCount + 1) * 600);
  }
  if (cand.imdbRating) {
    const r = parseFloat(cand.imdbRating) || 0;
    finalScore += r * 200; // Ví dụ 8.7 * 200 = 1740 điểm
  }
  if (cand.rank && cand.rank < 5000) {
    finalScore += Math.max(0, 500 - cand.rank / 10);
  }
  if (cand.poster) {
    finalScore += 500;
  }

  // 5. THƯỞNG NHẸ CHO NĂM PHÁT HÀNH ĐỂ LÀM TIE-BREAKER KHI CÁC YẾU TỐ KHÁC TƯƠNG ĐƯƠNG
  const candYear = parseYearToNumber(cand.year);
  if (candYear > 1900) {
    finalScore += Math.min(200, (candYear - 1900) * 1.5);
  }

  return finalScore;
}

/**
 * Trả về huy hiệu cảnh báo độ tuổi xem phim chuẩn phân loại điện ảnh Việt Nam & Quốc tế
 */
export function getAgeRatingBadge(movie) {
  if (!movie) return null;

  const rawRated = (movie.rated || movie.ageRating || movie.contentRating || '').toString().trim().toUpperCase();
  const genresStr = (Array.isArray(movie.genres) ? movie.genres.join(' ') : (movie.genres || '')).toLowerCase();

  // 1. Phân loại theo nhãn Rated chính thức (MPAA / OMDb / Việt Nam)
  if (['R', 'NC-17', 'TV-MA', '18+', 'T18', 'C18', 'MA-17'].some(r => rawRated === r || rawRated.includes(r))) {
    return {
      code: 'T18',
      shortLabel: 'T18 (18+)',
      label: 'Cấm khán giả dưới 18 tuổi',
      description: 'Phim dành cho khán giả từ đủ 18 tuổi trở lên'
    };
  }

  if (['PG-13', 'TV-14', '16+', 'T16', 'C16', '14+'].some(r => rawRated === r || rawRated.includes(r))) {
    if (rawRated.includes('16') || rawRated === 'TV-14') {
      return {
        code: 'T16',
        shortLabel: 'T16 (16+)',
        label: 'Phim dành cho khán giả từ 16 tuổi trở lên',
        description: 'Phim dành cho khán giả từ đủ 16 tuổi trở lên'
      };
    }
    return {
      code: 'T13',
      shortLabel: 'T13 (13+)',
      label: 'Phim dành cho khán giả từ 13 tuổi trở lên',
      description: 'Phim dành cho khán giả từ đủ 13 tuổi trở lên'
    };
  }

  if (['13+', 'T13', 'C13'].some(r => rawRated === r || rawRated.includes(r))) {
    return {
      code: 'T13',
      shortLabel: 'T13 (13+)',
      label: 'Phim dành cho khán giả từ 13 tuổi trở lên',
      description: 'Phim dành cho khán giả từ đủ 13 tuổi trở lên'
    };
  }

  if (['PG', 'TV-PG', 'K'].some(r => rawRated === r || rawRated.includes(r))) {
    return {
      code: 'K',
      shortLabel: 'K (Dưới 13T có cha mẹ xem cùng)',
      label: 'Khán giả dưới 13T cần cha mẹ xem cùng',
      description: 'Khán giả dưới 13 tuổi cần có cha mẹ xem cùng'
    };
  }

  if (['G', 'TV-G', 'TV-Y', 'TV-Y7', 'P', 'ALL'].some(r => rawRated === r || rawRated.includes(r))) {
    return {
      code: 'P',
      shortLabel: 'P (Mọi độ tuổi)',
      label: 'Phổ biến cho mọi lứa tuổi',
      description: 'Phim phù hợp cho khán giả ở mọi lứa tuổi'
    };
  }

  // 2. Nếu không có nhãn rated, suy luận thông minh từ Thể loại (Genres)
  if (genresStr.includes('kinh dị') || genresStr.includes('horror') || genresStr.includes('tội phạm') || genresStr.includes('crime')) {
    return {
      code: 'T18',
      shortLabel: 'T18 (18+)',
      label: 'Cấm khán giả dưới 18 tuổi',
      description: 'Phim dành cho khán giả từ đủ 18 tuổi trở lên'
    };
  }

  if (genresStr.includes('hoạt hình') || genresStr.includes('animation') || genresStr.includes('gia đình') || genresStr.includes('family')) {
    return {
      code: 'P',
      shortLabel: 'P (Mọi độ tuổi)',
      label: 'Phổ biến cho mọi lứa tuổi',
      description: 'Phim phù hợp cho khán giả ở mọi lứa tuổi'
    };
  }

  if (genresStr.includes('hành động') || genresStr.includes('action') || genresStr.includes('giật gân') || genresStr.includes('thriller') || genresStr.includes('khoa học viễn tưởng') || genresStr.includes('sci-fi')) {
    return {
      code: 'T16',
      shortLabel: 'T16 (16+)',
      label: 'Phim dành cho khán giả từ 16 tuổi trở lên',
      description: 'Phim dành cho khán giả từ đủ 16 tuổi trở lên'
    };
  }

  return {
    code: 'T16',
    shortLabel: 'T16 (16+)',
    label: 'Phim dành cho khán giả từ 16 tuổi trở lên',
    description: 'Phim dành cho khán giả từ đủ 16 tuổi trở lên'
  };
}

/**
 * Trả về thông tin chi tiết Đạo diễn, Diễn viên kèm vai diễn, Hãng sản xuất
 */
export function formatMovieCredits(movie) {
  if (!movie) return { director: 'Đang cập nhật', castWithRoles: 'Đang cập nhật', production: 'Đang cập nhật' };

  // 1. Đạo diễn & Ê-kíp sản xuất
  let directorStr = movie.director || 'Đang cập nhật';
  if (movie.writer && movie.writer !== 'N/A' && movie.writer !== directorStr) {
    directorStr += ` • Kịch bản: ${movie.writer}`;
  }

  // 2. Diễn viên chính & Vai đóng
  let castStr = '';
  if (Array.isArray(movie.castWithRoles) && movie.castWithRoles.length > 0) {
    castStr = movie.castWithRoles.slice(0, 4).join(', ');
  } else if (typeof movie.castWithRoles === 'string' && movie.castWithRoles.trim()) {
    castStr = movie.castWithRoles;
  } else {
    // Map từ mảng movie.cast
    const rawCastList = Array.isArray(movie.cast) 
      ? movie.cast 
      : (typeof movie.cast === 'string' ? movie.cast.split(', ') : []);

    const KNOWN_ROLES = {
      'Keanu Reeves': 'Neo',
      'Laurence Fishburne': 'Morpheus',
      'Carrie-Anne Moss': 'Trinity',
      'Hugo Weaving': 'Agent Smith',
      'Cillian Murphy': 'J. Robert Oppenheimer',
      'Emily Blunt': 'Katherine Oppenheimer',
      'Matt Damon': 'Leslie Groves',
      'Robert Downey Jr.': 'Lewis Strauss',
      'Florence Pugh': 'Jean Tatlock',
      'Song Kang-ho': 'Kim Ki-taek',
      'Lee Sun-kyun': 'Park Dong-ik',
      'Cho Yeo-jeong': 'Choi Yeon-gyo',
      'Choi Woo-shik': 'Kim Ki-woo',
      'Park So-dam': 'Kim Ki-jung',
      'Christian Bale': 'Bruce Wayne / Batman',
      'Heath Ledger': 'Joker',
      'Aaron Eckhart': 'Harvey Dent',
      'Michael Caine': 'Alfred',
      'Gary Oldman': 'Jim Gordon',
      'Matthew McConaughey': 'Cooper',
      'Anne Hathaway': 'Brand',
      'Jessica Chastain': 'Murph',
      'Leonardo DiCaprio': 'Jack Dawson / Cobb',
      'Kate Winslet': 'Rose DeWitt Bukater',
      'Timothée Chalamet': 'Paul Atreides',
      'Zendaya': 'Chani',
      'Ryan Reynolds': 'Wade Wilson / Deadpool',
      'Hugh Jackman': 'Logan / Wolverine',
      'Sam Worthington': 'Jake Sully',
      'Zoe Saldana': 'Neytiri'
    };

    if (rawCastList.length > 0) {
      castStr = rawCastList.slice(0, 4).map(item => {
        if (!item || item === 'N/A') return '';
        const cleanName = item.trim();
        if (cleanName.includes('(')) return cleanName; // Đã có vai diễn
        const knownRole = KNOWN_ROLES[cleanName];
        return knownRole ? `${cleanName} (${knownRole})` : cleanName;
      }).filter(Boolean).join(', ');
    }
  }

  if (!castStr || castStr === 'N/A') {
    castStr = 'Đang cập nhật';
  }

  // 3. Hãng sản xuất
  let productionStr = movie.production || movie.studio || movie.productionCompany || '';
  if (Array.isArray(productionStr)) {
    productionStr = productionStr.slice(0, 3).join(', ');
  }
  if (!productionStr || productionStr === 'N/A') {
    const titleLower = (movie.title || '' + ' ' + (movie.vietnameseTitle || '')).toLowerCase();
    if (titleLower.includes('matrix') || titleLower.includes('ma trận') || titleLower.includes('dark knight') || titleLower.includes('godfather') || titleLower.includes('dune')) {
      productionStr = 'Warner Bros. Pictures, Village Roadshow Pictures';
    } else if (titleLower.includes('oppenheimer') || titleLower.includes('jurassic')) {
      productionStr = 'Universal Pictures, Syncopy';
    } else if (titleLower.includes('parasite') || titleLower.includes('ký sinh trùng')) {
      productionStr = 'Barunson E&A, CJ Entertainment';
    } else if (titleLower.includes('avenger') || titleLower.includes('iron man') || titleLower.includes('deadpool') || titleLower.includes('inside out') || titleLower.includes('frozen')) {
      productionStr = 'Marvel Studios / Walt Disney Studios';
    } else {
      productionStr = 'Đang cập nhật';
    }
  }

  return {
    director: directorStr,
    castWithRoles: castStr,
    production: productionStr
  };
}



/**
 * Bộ công cụ hỗ trợ tìm kiếm tiếng Việt thông minh (Hỗ trợ có dấu, không dấu, viết tắt, và từ đồng nghĩa)
 */

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
  'lật mặt 7': 'Face Off 7: One Wish'
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
  const mappedTitle = VIETNAMESE_TITLE_MAP[rawQ] || VIETNAMESE_TITLE_MAP[normQ];
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

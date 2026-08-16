/**
 * Movie Title Resolver & Multi-language Standardization Engine
 * Chuẩn hóa tên phim tiếng Việt chuẩn xác (tiêu đề chính) và tên tiếng Anh quốc tế (tiêu đề phụ)
 * Xử lý triệt để các trường hợp tên gốc tiếng Thái, Hàn, Nhật, Trung hoặc không có tên dịch.
 */

// Bảng từ điển đối soát tên phim Quốc tế & Việt hóa chính thức
export const MOVIE_TITLE_DATABASE = {
  // --- THÁI LAN / ĐÔNG NAM Á ---
  'คนเดือดทวงแค้น': { vi: 'Kẻ Thu Nợ: Trả Thù', en: 'The Debt Collector' },
  'the debt collector': { vi: 'Kẻ Thu Nợ: Trả Thù', en: 'The Debt Collector' },
  'hunger': { vi: 'Khát Khao Thịnh Soạn', en: 'Hunger' },
  'the believer': { vi: 'Tín Đồ', en: 'The Believer' },
  'bad genius': { vi: 'Thiên Tài Bất Hảo', en: 'Bad Genius' },
  'how to make millions before grandma dies': { vi: 'Gia Tài Của Ngoại', en: 'How to Make Millions Before Grandma Dies' },
  'หลานม่า': { vi: 'Gia Tài Của Ngoại', en: 'How to Make Millions Before Grandma Dies' },
  'pee mak': { vi: 'Tình Người Duyên Ma', en: 'Pee Mak' },
  'the medium': { vi: 'Âm Hồn Nhập Xác', en: 'The Medium' },
  'ร่างทรง': { vi: 'Âm Hồn Nhập Xác', en: 'The Medium' },
  'death whisperer': { vi: 'Quỷ Ăn Tạng', en: 'Death Whisperer' },
  'ธี่หยด': { vi: 'Quỷ Ăn Tạng', en: 'Death Whisperer' },
  'death whisperer 2': { vi: 'Quỷ Ăn Tạng 2', en: 'Death Whisperer 2' },
  'ธี่หยด 2': { vi: 'Quỷ Ăn Tạng 2', en: 'Death Whisperer 2' },

  // --- TÂY BAN NHA / MỸ LATINH / CHÂU ÂU ---
  'deseo': { vi: 'Khát Khao (Deseo)', en: 'Deseo' },
  'culpa mia': { vi: 'Lỗi Của Tôi', en: 'My Fault' },
  'culpa mía': { vi: 'Lỗi Của Tôi', en: 'My Fault' },
  'culpa tuya': { vi: 'Lỗi Của Bạn', en: 'Your Fault' },
  'la sociedad de la nieve': { vi: 'Hội Tuyết Đói', en: 'Society of the Snow' },
  'society of the snow': { vi: 'Hội Tuyết Đói', en: 'Society of the Snow' },
  'el hoyo': { vi: 'Hố Sâu Đói Khát', en: 'The Platform' },
  'the platform': { vi: 'Hố Sâu Đói Khát', en: 'The Platform' },
  'the platform 2': { vi: 'Hố Sâu Đói Khát 2', en: 'The Platform 2' },
  'el hoyo 2': { vi: 'Hố Sâu Đói Khát 2', en: 'The Platform 2' },
  'under paris': { vi: 'Thủy Quái Sông Seine', en: 'Under Paris' },
  'sous la seine': { vi: 'Thủy Quái Sông Seine', en: 'Under Paris' },
  'money heist': { vi: 'Phi Vụ Triệu Đô', en: 'Money Heist' },
  'la casa de papel': { vi: 'Phi Vụ Triệu Đô', en: 'Money Heist' },
  'lupin': { vi: 'Siêu Trộm Lupin', en: 'Lupin' },
  'dark': { vi: 'Đêm Lặng (Dark)', en: 'Dark' },
  'the taste of things': { vi: 'Muôn Vị Nhân Gian', en: 'The Taste of Things' },
  'la passion de dodin bouffant': { vi: 'Muôn Vị Nhân Gian', en: 'The Taste of Things' },

  // --- ANIME / NHẬT BẢN ---
  'spirited away': { vi: 'Vùng Đất Linh Hồn', en: 'Spirited Away' },
  '千と千尋の神隠し': { vi: 'Vùng Đất Linh Hồn', en: 'Spirited Away' },
  'sen to chihiro no kamikakushi': { vi: 'Vùng Đất Linh Hồn', en: 'Spirited Away' },
  'demon slayer: kimetsu no yaiba - the movie: mugen train': { vi: 'Thanh Gươm Diệt Quỷ: Chuyến Tàu Vô Tận', en: 'Demon Slayer: Mugen Train' },
  'demon slayer: infinity castle': { vi: 'Thanh Gươm Diệt Quỷ: Vô Hạn Thành', en: 'Demon Slayer: Infinity Castle' },
  '劇場版「鬼滅の刃」無限城編 第一章 猗窩座再来': { vi: 'Thanh Gươm Diệt Quỷ: Vô Hạn Thành', en: 'Demon Slayer: Infinity Castle' },
  'chainsaw man - the movie: reze arc': { vi: 'Chainsaw Man: Chương Reze', en: 'Chainsaw Man - The Movie: Reze Arc' },
  '劇場版 チェンソーマン レゼ篇': { vi: 'Chainsaw Man: Chương Reze', en: 'Chainsaw Man - The Movie: Reze Arc' },
  'chainsaw man: reze arc': { vi: 'Chainsaw Man: Chương Reze', en: 'Chainsaw Man - The Movie: Reze Arc' },
  'jujutsu kaisen 0': { vi: 'Chú Thuật Hồi Chiến 0', en: 'Jujutsu Kaisen 0' },
  '劇場版 呪術廻戦 0': { vi: 'Chú Thuật Hồi Chiến 0', en: 'Jujutsu Kaisen 0' },
  'your name.': { vi: 'Tên Cậu Là Gì? (Your Name)', en: 'Your Name.' },
  'your name': { vi: 'Tên Cậu Là Gì? (Your Name)', en: 'Your Name.' },
  '君の名は。': { vi: 'Tên Cậu Là Gì? (Your Name)', en: 'Your Name.' },
  'weathering with you': { vi: 'Đứa Con Của Thời Tiết', en: 'Weathering with You' },
  '天気の子': { vi: 'Đứa Con Của Thời Tiết', en: 'Weathering with You' },
  'suzume': { vi: 'Khóa Chặt Cửa Nào Suzume', en: 'Suzume' },
  'すずめの戸締まり': { vi: 'Khóa Chặt Cửa Nào Suzume', en: 'Suzume' },
  'a silent voice': { vi: 'Dáng Hình Thanh Âm', en: 'A Silent Voice' },
  '聲の形': { vi: 'Dáng Hình Thanh Âm', en: 'A Silent Voice' },
  'the boy and the heron': { vi: 'Thiếu Niên Và Chim Diệc', en: 'The Boy and the Heron' },
  '君たちはどう生きるか': { vi: 'Thiếu Niên Và Chim Diệc', en: 'The Boy and the Heron' },
  'princess mononoke': { vi: 'Công Chúa Mononoke', en: 'Princess Mononoke' },
  'もののけ姫': { vi: 'Công Chúa Mononoke', en: 'Princess Mononoke' },
  'my neighbor totoro': { vi: 'Hàng Xóm Của Tôi Là Totoro', en: 'My Neighbor Totoro' },
  'となりのトトロ': { vi: 'Hàng Xóm Của Tôi Là Totoro', en: 'My Neighbor Totoro' },
  'howls moving castle': { vi: 'Lâu Đài Bay Của Pháp Sư Howl', en: "Howl's Moving Castle" },
  'howl\'s moving castle': { vi: 'Lâu Đài Bay Của Pháp Sư Howl', en: "Howl's Moving Castle" },
  'ハウルの動く城': { vi: 'Lâu Đài Bay Của Pháp Sư Howl', en: "Howl's Moving Castle" },
  'grave of the fireflies': { vi: 'Mộ Đom Đóm', en: 'Grave of the Fireflies' },
  '火垂るの墓': { vi: 'Mộ Đom Đóm', en: 'Grave of the Fireflies' },
  'monster': { vi: 'Quái Vật (Monster)', en: 'Monster' },
  '怪物': { vi: 'Quái Vật (Monster)', en: 'Monster' },
  'detective conan: the million-dollar pentagram': { vi: 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô', en: 'Detective Conan: The Million-Dollar Pentagram' },
  '名探偵コナン 100万ドルの五稜星': { vi: 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô', en: 'Detective Conan: The Million-Dollar Pentagram' },
  'doraemon: nobitas earth symphony': { vi: 'Doraemon: Bản Giao Hưởng Địa Cầu', en: "Doraemon: Nobita's Earth Symphony" },
  'doraemon: nobita\'s earth symphony': { vi: 'Doraemon: Bản Giao Hưởng Địa Cầu', en: "Doraemon: Nobita's Earth Symphony" },
  '映画ドラえもん のび太の地球交響楽': { vi: 'Doraemon: Bản Giao Hưởng Địa Cầu', en: "Doraemon: Nobita's Earth Symphony" },
  'haikyu!! the dumpster battle': { vi: 'Haikyu!! Trận Chiến Bãi Phế Liệu', en: 'Haikyu!! The Dumpster Battle' },
  '劇場版ハイキュー!! ゴミ捨て場の決戦': { vi: 'Haikyu!! Trận Chiến Bãi Phế Liệu', en: 'Haikyu!! The Dumpster Battle' },

  // --- HÀN QUỐC ---
  'parasite': { vi: 'Ký Sinh Trùng', en: 'Parasite' },
  '기생충': { vi: 'Ký Sinh Trùng', en: 'Parasite' },
  'gisaengchung': { vi: 'Ký Sinh Trùng', en: 'Parasite' },
  'exhuma': { vi: 'Quật Mộ Trùng Tang', en: 'Exhuma' },
  '파묘': { vi: 'Quật Mộ Trùng Tang', en: 'Exhuma' },
  'train to busan': { vi: 'Chuyến Tàu Sinh Tử', en: 'Train to Busan' },
  '부산행': { vi: 'Chuyến Tàu Sinh Tử', en: 'Train to Busan' },
  'past lives': { vi: 'Muôn Kiếp Nhân Duyên', en: 'Past Lives' },
  'oldboy': { vi: 'Báo Thù (Oldboy)', en: 'Oldboy' },
  '올드보이': { vi: 'Báo Thù (Oldboy)', en: 'Oldboy' },
  'memories of murder': { vi: 'Hồi Ức Kẻ Sát Nhân', en: 'Memories of Murder' },
  '살인의 추억': { vi: 'Hồi Ức Kẻ Sát Nhân', en: 'Memories of Murder' },
  'the handmaiden': { vi: 'Người Hầu Gái', en: 'The Handmaiden' },
  '아가씨': { vi: 'Người Hầu Gái', en: 'The Handmaiden' },
  'decision to leave': { vi: 'Quyết Tâm Chia Tay', en: 'Decision to Leave' },
  '헤어질 결심': { vi: 'Quyết Tâm Chia Tay', en: 'Decision to Leave' },
  'squid game': { vi: 'Trò Chơi Con Mực', en: 'Squid Game' },
  '오징어 게임': { vi: 'Trò Chơi Con Mực', en: 'Squid Game' },
  'all of us are dead': { vi: 'Ngôi Trường Xác Sống', en: 'All of Us Are Dead' },
  '지금 우리 학교는': { vi: 'Ngôi Trường Xác Sống', en: 'All of Us Are Dead' },
  'the glory': { vi: 'Vinh Quang Trong Thù Hận', en: 'The Glory' },
  '더 글로리': { vi: 'Vinh Quang Trong Thù Hận', en: 'The Glory' },
  'sweet home': { vi: 'Thế Giới Ma Quái', en: 'Sweet Home' },
  '스위트홈': { vi: 'Thế Giới Ma Quái', en: 'Sweet Home' },
  'citizen of a kind': { vi: 'Bà Thím Báo Thù', en: 'Citizen of a Kind' },
  '시민덕희': { vi: 'Bà Thím Báo Thù', en: 'Citizen of a Kind' },
  '6/45': { vi: 'Bỗng Dưng Trúng Số', en: '6/45' },
  '육사오': { vi: 'Bỗng Dưng Trúng Số', en: '6/45' },
  'extreme job': { vi: 'Nghề Siêu Khó', en: 'Extreme Job' },
  '극한직업': { vi: 'Nghề Siêu Khó', en: 'Extreme Job' },
  'the roundup: punishment': { vi: 'Vây Hãm: Kẻ Trừng Phạt', en: 'The Roundup: Punishment' },
  '범죄도시4': { vi: 'Vây Hãm: Kẻ Trừng Phạt', en: 'The Roundup: Punishment' },
  'the roundup: no way out': { vi: 'Vây Hãm: Không Lối Thoát', en: 'The Roundup: No Way Out' },
  '범죄도시3': { vi: 'Vây Hãm: Không Lối Thoát', en: 'The Roundup: No Way Out' },
  'the roundup': { vi: 'Thành Phố Tội Ác: Ngoài Vòng Pháp Luật', en: 'The Roundup' },
  'the outlaws': { vi: 'Ngoài Vòng Pháp Luật', en: 'The Outlaws' },

  // --- QUỐC TẾ / HOLLYWOOD / NETFLIX ORIGINALS ---
  'oppenheimer': { vi: 'Oppenheimer: Cha Đẻ Bom Nguyên Tử', en: 'Oppenheimer' },
  'the dark knight': { vi: 'Kỵ Sĩ Bóng Đêm', en: 'The Dark Knight' },
  'dune: part two': { vi: 'Dune: Hành Tinh Cát - Phần Hai', en: 'Dune: Part Two' },
  'dune': { vi: 'Dune: Hành Tinh Cát', en: 'Dune' },
  'interstellar': { vi: 'Hố Đen Tử Thần', en: 'Interstellar' },
  'inception': { vi: 'Kẻ Đánh Cắp Giấc Mơ', en: 'Inception' },
  'the godfather': { vi: 'Bố Già (The Godfather)', en: 'The Godfather' },
  'the shawshank redemption': { vi: 'Nhà Tù Shawshank', en: 'The Shawshank Redemption' },
  'pulp fiction': { vi: 'Chuyện Tào Lao (Pulp Fiction)', en: 'Pulp Fiction' },
  'fight club': { vi: 'Sàn Đấu Sinh Tử', en: 'Fight Club' },
  'forrest gump': { vi: 'Cuộc Đời Forrest Gump', en: 'Forrest Gump' },
  'the matrix': { vi: 'Ma Trận', en: 'The Matrix' },
  'matrix': { vi: 'Ma Trận', en: 'The Matrix' },
  'the matrix reloaded': { vi: 'Ma Trận: Tái Lập', en: 'The Matrix Reloaded' },
  'matrix reloaded': { vi: 'Ma Trận: Tái Lập', en: 'The Matrix Reloaded' },
  'the matrix revolutions': { vi: 'Ma Trận: Những Cuộc Cách Mạng', en: 'The Matrix Revolutions' },
  'matrix revolutions': { vi: 'Ma Trận: Những Cuộc Cách Mạng', en: 'The Matrix Revolutions' },
  'the matrix resurrections': { vi: 'Ma Trận: Hồi Sinh', en: 'The Matrix Resurrections' },
  'matrix resurrections': { vi: 'Ma Trận: Hồi Sinh', en: 'The Matrix Resurrections' },
  'the silence of the lambs': { vi: 'Sự Im Lặng Của Bầy Cừu', en: 'The Silence of the Lambs' },
  'saving private ryan': { vi: 'Giải Cứu Binh Nhì Ryan', en: 'Saving Private Ryan' },
  'schindlers list': { vi: 'Bản Danh Sách Của Schindler', en: "Schindler's List" },
  'schindler\'s list': { vi: 'Bản Danh Sách Của Schindler', en: "Schindler's List" },
  'the lord of the rings: the return of the king': { vi: 'Chúa Tể Những Chiếc Nhẫn: Sự Trở Về Của Nhà Vua', en: 'The Lord of the Rings: The Return of the King' },
  'the lord of the rings: the fellowship of the ring': { vi: 'Chúa Tể Những Chiếc Nhẫn: Hiệp Hội Nhẫn Thần', en: 'The Lord of the Rings: The Fellowship of the Ring' },
  'the lord of the rings: the two towers': { vi: 'Chúa Tể Những Chiếc Nhẫn: Hai Tòa Tháp', en: 'The Lord of the Rings: The Two Towers' },
  'gladiator': { vi: 'Võ Sĩ Giác Đấu', en: 'Gladiator' },
  'gladiator ii': { vi: 'Võ Sĩ Giác Đấu 2', en: 'Gladiator II' },
  'the departed': { vi: 'Điệp Vụ Nam Boston', en: 'The Departed' },
  'whiplash': { vi: 'Tay Trống Cự Phách', en: 'Whiplash' },
  'the prestige': { vi: 'Ảo Thuật Gia Đấu Trí', en: 'The Prestige' },
  'memento': { vi: 'Kẻ Mất Trí Nhớ', en: 'Memento' },
  'django unchained': { vi: 'Hành Trình Django', en: 'Django Unchained' },
  'inglourious basterds': { vi: 'Định Mệnh (Inglourious Basterds)', en: 'Inglourious Basterds' },
  'shutter island': { vi: 'Đảo Kinh Hoàng', en: 'Shutter Island' },
  'avengers: endgame': { vi: 'Avengers: Hồi Kết', en: 'Avengers: Endgame' },
  'avengers: infinity war': { vi: 'Avengers: Cuộc Chiến Vô Cực', en: 'Avengers: Infinity War' },
  'spider-man: into the spider-verse': { vi: 'Người Nhện: Vũ Trụ Mới', en: 'Spider-Man: Into the Spider-Verse' },
  'spider-man: across the spider-verse': { vi: 'Người Nhện: Du Hành Vũ Trụ Nhện', en: 'Spider-Man: Across the Spider-Verse' },
  'spider-man: no way home': { vi: 'Người Nhện: Không Còn Nhà', en: 'Spider-Man: No Way Home' },
  'titanic': { vi: 'Tàu Titanic', en: 'Titanic' },
  'avatar': { vi: 'Thế Thân (Avatar)', en: 'Avatar' },
  'avatar: the way of water': { vi: 'Avatar: Dòng Chảy Của Nước', en: 'Avatar: The Way of Water' },
  'the lion king': { vi: 'Vua Sư Tử', en: 'The Lion King' },
  'inside out': { vi: 'Những Mảnh Ghép Cảm Xúc', en: 'Inside Out' },
  'inside out 2': { vi: 'Những Mảnh Ghép Cảm Xúc 2', en: 'Inside Out 2' },
  'coco': { vi: 'Hội Ngộ Diệu Kỳ (Coco)', en: 'Coco' },
  'wall-e': { vi: 'Người Máy Biết Yêu (WALL-E)', en: 'WALL-E' },
  'up': { vi: 'Vút Bay (Up)', en: 'Up' },
  'toy story': { vi: 'Câu Chuyện Đồ Chơi', en: 'Toy Story' },
  'finding nemo': { vi: 'Đi Tìm Nemo', en: 'Finding Nemo' },
  'frozen': { vi: 'Nữ Hoàng Băng Giá', en: 'Frozen' },
  'frozen ii': { vi: 'Nữ Hoàng Băng Giá 2', en: 'Frozen II' },
  'moana': { vi: 'Hành Trình Moana', en: 'Moana' },
  'moana 2': { vi: 'Hành Trình Moana 2', en: 'Moana 2' },
  'zootopia': { vi: 'Phi Vụ Động Trời (Zootopia)', en: 'Zootopia' },
  'ratatouille': { vi: 'Chú Chuột Đầu Bếp', en: 'Ratatouille' },
  'the beekeeper': { vi: 'Người Nuôi Ong (The Beekeeper)', en: 'The Beekeeper' },
  'wrath of man': { vi: 'Cơn Thịnh Nộ Của Kẻ Đơn Độc', en: 'Wrath of Man' },
  'john wick': { vi: 'Sát Thủ John Wick', en: 'John Wick' },
  'john wick: chapter 4': { vi: 'Sát Thủ John Wick: Phần 4', en: 'John Wick: Chapter 4' },
  'mission: impossible - dead reckoning': { vi: 'Nhiệm Vụ Bất Khả Thi: Nghiệp Báo', en: 'Mission: Impossible - Dead Reckoning' },
  'deadpool & wolverine': { vi: 'Deadpool & Wolverine', en: 'Deadpool & Wolverine' },
  'joker': { vi: 'Gã Hề Joker', en: 'Joker' },
  'joker: folie a deux': { vi: 'Joker: Điên Có Đôi', en: 'Joker: Folie à Deux' },
  'joker: folie à deux': { vi: 'Joker: Điên Có Đôi', en: 'Joker: Folie à Deux' },
  'the batman': { vi: 'The Batman: Vạch Trần Sự Thật', en: 'The Batman' },
  'avatar: the last airbender': { vi: 'Huyền Thoại Aang: Tiết Khí Sư Cuối Cùng', en: 'Avatar: The Last Airbender' },
  'swapped': { vi: 'Cuộc Phiêu Lưu Biến Hóa', en: 'Swapped' },
  'carry-on': { vi: 'Hành Lý Xách Tay', en: 'Carry-On' },
  'the union': { vi: 'Liên Minh Đặc Nhiệm', en: 'The Union' },
  'damsel': { vi: 'Nàng Thơ Diệt Rồng', en: 'Damsel' },
  'atlas': { vi: 'Chiến Binh Atlas', en: 'Atlas' },
  'beverly hills cop: axel f': { vi: 'Cớm Beverly Hills: Axel F', en: 'Beverly Hills Cop: Axel F' },
  'extraction': { vi: 'Nhiệm Vụ Giải Cứu', en: 'Extraction' },
  'extraction 2': { vi: 'Nhiệm Vụ Giải Cứu 2', en: 'Extraction 2' },
  'red notice': { vi: 'Lệnh Truy Nã Đỏ', en: 'Red Notice' },
  'the gray man': { vi: 'Đặc Vụ Vô Hình', en: 'The Gray Man' },
  'glass onion: a knives out mystery': { vi: 'Kẻ Đâm Lén: Kính Vạn Hoa', en: 'Glass Onion: A Knives Out Mystery' },
  'knives out': { vi: 'Kẻ Đâm Lén', en: 'Knives Out' },
  'leave the world behind': { vi: 'Bỏ Lại Thế Giới Phía Sau', en: 'Leave the World Behind' },
  'rebel moon': { vi: 'Hạt Giống Nổi Loạn', en: 'Rebel Moon' },
  'a quiet place: day one': { vi: 'Vùng Đất Câm Lặng: Ngày Một', en: 'A Quiet Place: Day One' },
  'a quiet place': { vi: 'Vùng Đất Câm Lặng', en: 'A Quiet Place' },
  'alien: romulus': { vi: 'Quái Vật Không Gian: Romulus', en: 'Alien: Romulus' },
  'wicked': { vi: 'Phù Thủy Xứ Oz (Wicked)', en: 'Wicked' },
  'twisters': { vi: 'Lốc Xoáy Tử Thần', en: 'Twisters' },
  'the substance': { vi: 'Thần Dược (The Substance)', en: 'The Substance' },
  'longlegs': { vi: 'Kẻ Bí Ẩn Longlegs', en: 'Longlegs' },
  'smile 2': { vi: 'Cười 2 (Smile 2)', en: 'Smile 2' },
  'nosferatu': { vi: 'Ma Cà Rồng Nosferatu', en: 'Nosferatu' },

  // --- VIỆT NAM ---
  'thanh sói': { vi: 'Thanh Sói: Cúc Dại Trong Đêm', en: 'Furies' },
  'thanh soi': { vi: 'Thanh Sói: Cúc Dại Trong Đêm', en: 'Furies' },
  'thanh sói: cúc dại trong đêm': { vi: 'Thanh Sói: Cúc Dại Trong Đêm', en: 'Furies' },
  'thanh soi: cuc dai trong dem': { vi: 'Thanh Sói: Cúc Dại Trong Đêm', en: 'Furies' },
  'furies': { vi: 'Thanh Sói: Cúc Dại Trong Đêm', en: 'Furies' },
  'hai phượng': { vi: 'Hai Phượng', en: 'Furie' },
  'hai phuong': { vi: 'Hai Phượng', en: 'Furie' },
  'furie': { vi: 'Hai Phượng', en: 'Furie' },
  'lật mặt 6: tấm vé định mệnh': { vi: 'Lật Mặt 6: Tấm Vé Định Mệnh', en: 'Face Off 6: The Ticket of Destiny' },
  'lật mặt 6': { vi: 'Lật Mặt 6: Tấm Vé Định Mệnh', en: 'Face Off 6: The Ticket of Destiny' },
  'lat mat 6': { vi: 'Lật Mặt 6: Tấm Vé Định Mệnh', en: 'Face Off 6: The Ticket of Destiny' },
  'lật mặt 7: một điều ước': { vi: 'Lật Mặt 7: Một Điều Ước', en: 'Face Off 7: One Wish' },
  'lật mặt 7': { vi: 'Lật Mặt 7: Một Điều Ước', en: 'Face Off 7: One Wish' },
  'lat mat 7': { vi: 'Lật Mặt 7: Một Điều Ước', en: 'Face Off 7: One Wish' },
  'face off 7: one wish': { vi: 'Lật Mặt 7: Một Điều Ước', en: 'Face Off 7: One Wish' },
  'lật mặt': { vi: 'Lật Mặt', en: 'Face Off' },
  'lat mat': { vi: 'Lật Mặt', en: 'Face Off' },
  'lật mặt 3: ba chàng khuyết': { vi: 'Lật Mặt 3: Ba Chàng Khuyết', en: 'Face Off 3: The Three Disabled' },
  'lật mặt 3': { vi: 'Lật Mặt 3: Ba Chàng Khuyết', en: 'Face Off 3: The Three Disabled' },
  'siêu lừa gặp siêu lầy': { vi: 'Siêu Lừa Gặp Siêu Lầy', en: 'Hustler vs Scammer' },
  'sieu lua gap sieu lay': { vi: 'Siêu Lừa Gặp Siêu Lầy', en: 'Hustler vs Scammer' },
  'nghề siêu dễ': { vi: 'Nghề Siêu Dễ', en: 'Extremely Easy Job' },
  'nghe sieu de': { vi: 'Nghề Siêu Dễ', en: 'Extremely Easy Job' },
  'chiếm đoạt': { vi: 'Chiếm Đoạt', en: 'Possessive' },
  'chiem doat': { vi: 'Chiếm Đoạt', en: 'Possessive' },
  'kẻ ẩn danh': { vi: 'Kẻ Ẩn Danh', en: 'Bad Blood' },
  'ke an danh': { vi: 'Kẻ Ẩn Danh', en: 'Bad Blood' },
  'pháp sư mù': { vi: 'Pháp Sư Mù: Ai Chết Giơ Tay', en: 'Blind Shaman' },
  'phap su mu': { vi: 'Pháp Sư Mù: Ai Chết Giơ Tay', en: 'Blind Shaman' },
  'dân chơi không sợ con rơi': { vi: 'Dân Chơi Không Sợ Con Rơi', en: 'Playboy Falling in Love' },
  'dan choi khong so con roi': { vi: 'Dân Chơi Không Sợ Con Rơi', en: 'Playboy Falling in Love' },
  'mai': { vi: 'Mai', en: 'Mai' },
  'đào, phở và piano': { vi: 'Đào, Phở và Piano', en: 'Peach Blossom, Pho and Piano' },
  'đào phở và piano': { vi: 'Đào, Phở và Piano', en: 'Peach Blossom, Pho and Piano' },
  'dao pho va piano': { vi: 'Đào, Phở và Piano', en: 'Peach Blossom, Pho and Piano' },
  'peach blossom, pho and piano': { vi: 'Đào, Phở và Piano', en: 'Peach Blossom, Pho and Piano' },
  'song lang': { vi: 'Song Lang', en: 'Song Lang' },
  'gặp lại chị bầu': { vi: 'Gặp Lại Chị Bầu', en: 'Meet My Pregnant Sister Again' },
  'gap lai chi bau': { vi: 'Gặp Lại Chị Bầu', en: 'Meet My Pregnant Sister Again' },
  'kẻ ăn hồn': { vi: 'Kẻ Ăn Hồn', en: 'The Soul Reaper' },
  'ke an hon': { vi: 'Kẻ Ăn Hồn', en: 'The Soul Reaper' },
  'quỷ cẩu': { vi: 'Quỷ Cẩu', en: 'Demon Dog' },
  'quy cau': { vi: 'Quỷ Cẩu', en: 'Demon Dog' },
  'tết ở làng địa ngục': { vi: 'Tết Ở Làng Địa Ngục', en: 'Hellbound Village' },
  'tet o lang dia nguc': { vi: 'Tết Ở Làng Địa Ngục', en: 'Hellbound Village' },
  'mắt biếc': { vi: 'Mắt Biếc', en: 'Dreamy Eyes' },
  'mat biec': { vi: 'Mắt Biếc', en: 'Dreamy Eyes' },
  'bố già': { vi: 'Bố Già (Trấn Thành)', en: "Dad, I'm Sorry" },
  'bo gia': { vi: 'Bố Già (Trấn Thành)', en: "Dad, I'm Sorry" },
  'nhà bà nữ': { vi: 'Nhà Bà Nữ', en: 'The House of No Man' },
  'nha ba nu': { vi: 'Nhà Bà Nữ', en: 'The House of No Man' },
  'em chưa 18': { vi: 'Em Chưa 18', en: 'Jailbait' },
  'em chua 18': { vi: 'Em Chưa 18', en: 'Jailbait' },
  'tiệc trăng máu': { vi: 'Tiệc Trăng Máu', en: 'Blood Moon Party' },
  'tiec trang mau': { vi: 'Tiệc Trăng Máu', en: 'Blood Moon Party' },
  'chị chị em em': { vi: 'Chị Chị Em Em', en: 'Sister Sister' },
  'chi chi em em': { vi: 'Chị Chị Em Em', en: 'Sister Sister' },
  'cua lại vợ bầu': { vi: 'Cua Lại Vợ Bầu', en: 'Win My Baby Back' },
  'cua lai vo bau': { vi: 'Cua Lại Vợ Bầu', en: 'Win My Baby Back' },
  'tôi thấy hoa vàng trên cỏ xanh': { vi: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', en: 'Yellow Flowers on the Green Grass' },
  'toi thay hoa vang tren co xanh': { vi: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', en: 'Yellow Flowers on the Green Grass' },
  'ròm': { vi: 'Ròm', en: 'Rom' },
  'rom': { vi: 'Ròm', en: 'Rom' },
  'tro tàn rực rỡ': { vi: 'Tro Tàn Rực Rỡ', en: 'Glorious Ashes' },
  'tro tan ruc ro': { vi: 'Tro Tàn Rực Rỡ', en: 'Glorious Ashes' },
  'đêm tối rực rỡ!': { vi: 'Đêm Tối Rực Rỡ!', en: 'The Brilliant Darkness!' },
  'dem toi ruc ro!': { vi: 'Đêm Tối Rực Rỡ!', en: 'The Brilliant Darkness!' }
};

/**
 * Kiểm tra xem chuỗi có chứa ký tự phi Latin (Thái, Nhật, Hàn, Trung) hay không
 */
export function hasNonLatinScripts(str = '') {
  if (!str) return false;
  // Regex cho tiếng Thái, Hàn (Hangul), Nhật (Hiragana, Katakana, Kanji), Trung
  return /[\u0E00-\u0E7F\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FFF]/.test(str);
}

/**
 * Hàm giải quyết và chuẩn hóa tiêu đề phim
 * Đảm bảo:
 * - vietnameseTitle: Tên tiếng Việt chuẩn xác (luôn dùng cho tiêu đề chính to)
 * - englishTitle: Tên tiếng Anh / quốc tế chuẩn (dùng cho hàng chữ nhỏ bên dưới)
 */
export function resolveMovieTitles(movie = {}) {
  const origTitle = (movie.originalTitle || movie.original_title || movie.title || '').trim();
  const rawTitle = (movie.title || '').trim();
  const viTitle = (movie.vietnameseTitle || '').trim();
  const enTitle = (movie.englishTitle || '').trim();

  // 1. Kiểm tra trong từ điển chuẩn hóa trước
  const checkKeys = [
    origTitle.toLowerCase(),
    rawTitle.toLowerCase(),
    viTitle.toLowerCase(),
    enTitle.toLowerCase()
  ].filter(Boolean);

  for (const key of checkKeys) {
    if (MOVIE_TITLE_DATABASE[key]) {
      const match = MOVIE_TITLE_DATABASE[key];
      return {
        vietnameseTitle: match.vi,
        englishTitle: match.en
      };
    }
  }

  // 2. Xử lý trường hợp có ký tự phi Latin (Thái, Hàn, Nhật, Trung...)
  const isOrigNonLatin = hasNonLatinScripts(origTitle);
  const isRawNonLatin = hasNonLatinScripts(rawTitle);
  const isViNonLatin = hasNonLatinScripts(viTitle);

  let finalVi = viTitle || rawTitle || origTitle;
  let finalEn = enTitle || origTitle || rawTitle;

  // Nếu vietnameseTitle bị dính chữ Thái/Nhật/Hàn/Trung:
  if (isViNonLatin || hasNonLatinScripts(finalVi)) {
    if (!isRawNonLatin && rawTitle) {
      finalVi = rawTitle;
      finalEn = rawTitle;
    } else if (!hasNonLatinScripts(enTitle) && enTitle) {
      finalVi = enTitle;
      finalEn = enTitle;
    }
  }

  // Nếu englishTitle bị dính chữ Thái/Nhật/Hàn/Trung:
  if (hasNonLatinScripts(finalEn)) {
    if (!hasNonLatinScripts(finalVi) && finalVi) {
      finalEn = finalVi;
    }
  }

  // 3. Trường hợp phim đã có tiếng Việt chuẩn và tiếng Anh chuẩn
  if (!finalVi) finalVi = finalEn;
  if (!finalEn) finalEn = finalVi;

  return {
    vietnameseTitle: finalVi,
    englishTitle: finalEn
  };
}

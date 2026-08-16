/**
 * Age Rating Advisory & Content Warnings Utility
 * Cung cấp phân tích chi tiết lý do dán nhãn độ tuổi (T18, T16, T13, K)
 * Theo tiêu chuẩn phân loại điện ảnh Việt Nam (Thông tư 05/2023/TT-BVHTTDL)
 * và phân tích chi tiết số lượng cảnh nóng, bạo lực, kinh dị kèm mốc thời gian.
 */

import { getAgeRatingBadge } from './searchUtils.js';

// Danh sách các nhãn hỗ trợ hiển thị phân tích cảnh báo chi tiết
export const ADVISORY_ELIGIBLE_RATINGS = ['K', 'T13', 'T16', 'T18'];

/**
 * Kiểm tra xem một phim có đủ điều kiện để hiển thị modal phân tích chi tiết độ tuổi hay không
 * (Chỉ hiển thị đối với K, T13, T16, T18 - Phim P dành cho mọi lứa tuổi không có cảnh báo)
 */
export function isAdvisoryEligible(movie) {
  if (!movie) return false;
  const badge = getAgeRatingBadge(movie);
  if (!badge) return false;
  return ADVISORY_ELIGIBLE_RATINGS.includes(badge.code);
}

/**
 * Định nghĩa tiêu chuẩn chính thức của Cục Điện Ảnh Việt Nam
 */
export const VIETNAM_AGE_STANDARDS = {
  'T18': {
    code: 'T18',
    name: 'Cấm khán giả dưới 18 tuổi',
    audience: 'Khán giả từ đủ 18 tuổi trở lên (18+)',
    color: '#ef4444',
    bgBadge: 'rgba(239, 68, 68, 0.2)',
    borderBadge: '#ef4444',
    standardSummary: 'Phim có yếu tố bạo lực khốc liệt, hình ảnh máu me, cảnh nhạy cảm khỏa thân/tình dục trực diện hoặc các chủ đề tâm lý đen tối nặng nề chỉ phù hợp với người trưởng thành.'
  },
  'T16': {
    code: 'T16',
    name: 'Phim dành cho khán giả từ 16 tuổi trở lên',
    audience: 'Khán giả từ đủ 16 tuổi trở lên (16+)',
    color: '#f97316',
    bgBadge: 'rgba(249, 115, 22, 0.2)',
    borderBadge: '#f97316',
    standardSummary: 'Phim có thể chứa các phân cảnh hành động bạo lực mức độ trung bình, cảnh giật gân, ngôn ngữ mạnh hoặc yếu tố tình cảm lãng mạn có gợi ý nhưng không dung tục.'
  },
  'T13': {
    code: 'T13',
    name: 'Phim dành cho khán giả từ 13 tuổi trở lên',
    audience: 'Khán giả từ đủ 13 tuổi trở lên (13+)',
    color: '#eab308',
    bgBadge: 'rgba(234, 179, 8, 0.2)',
    borderBadge: '#eab308',
    standardSummary: 'Phim có chứa một số cảnh hành động giả tưởng nhẹ, cảnh hồi hộp căng thẳng hoặc ngôn từ biểu cảm giới hạn, không có cảnh khỏa thân tình dục phản cảm.'
  },
  'K': {
    code: 'K',
    name: 'Khán giả dưới 13 tuổi có cha mẹ xem cùng',
    audience: 'Trẻ em dưới 13 tuổi cần có người giám hộ',
    color: '#3b82f6',
    bgBadge: 'rgba(59, 130, 246, 0.2)',
    borderBadge: '#3b82f6',
    standardSummary: 'Phim có cốt truyện hoặc phân cảnh đòi hỏi sự hướng dẫn, giải thích và định hướng đúng đắn từ phụ huynh để trẻ tiếp thu nội dung lành mạnh.'
  },
  'P': {
    code: 'P',
    name: 'Phổ biến cho mọi lứa tuổi',
    audience: 'Mọi độ tuổi',
    color: '#10b981',
    bgBadge: 'rgba(16, 185, 129, 0.2)',
    borderBadge: '#10b981',
    standardSummary: 'Nội dung trong sáng, giáo dục, giải trí nhẹ nhàng, hoàn toàn an toàn cho mọi thành viên trong gia đình.'
  }
};

/**
 * Cơ sở dữ liệu phân tích chi tiết cảnh báo nội dung cho các phim nổi tiếng (Curated Database)
 */
export const CURATED_ADVISORY_DB = {
  // 1. OPPENHEIMER (T18)
  'oppenheimer-2023': {
    movieTitle: 'Oppenheimer',
    ratingCode: 'T18',
    verdict: 'Xếp hạng T18 do có cảnh khỏa thân trực diện, cảnh ân ái thân mật nhạy cảm, ngôn từ mạnh và những hình ảnh gây ám ảnh tâm lý về hậu quả bom hạt nhân.',
    parentalGuidance: 'Không phù hợp cho thanh thiếu niên dưới 18 tuổi. Phim chứa các cảnh hội thoại có khỏa thân 100% và chủ đề khủng hoảng hiện sinh trầm trọng.',
    stats: {
      nudity: { count: 3, level: 'severe', label: 'Nhiều / Nặng' },
      violence: { count: 2, level: 'moderate', label: 'Vừa' },
      horror: { count: 3, level: 'moderate', label: 'Ám ảnh tâm lý' },
      language: { count: 5, level: 'mild', label: 'Nhẹ' }
    },
    scenes: [
      {
        id: 'opp-1',
        category: 'nudity',
        categoryName: 'Cảnh nóng & Khỏa thân',
        categoryIcon: '🔥',
        timestamp: '00:18:20 - 00:20:15',
        intensity: 'severe',
        intensityLabel: 'Nặng',
        title: 'Cảnh thân mật và khỏa thân của Jean Tatlock',
        description: 'Cảnh quan hệ tình cảm trong phòng ngủ giữa Oppenheimer và Jean Tatlock (Florence Pugh thủ vai), xuất hiện hình ảnh khỏa thân trực diện phần ngực và thân thể.',
        isSpoiler: false
      },
      {
        id: 'opp-2',
        category: 'nudity',
        categoryName: 'Cảnh nóng & Khỏa thân',
        categoryIcon: '🔥',
        timestamp: '01:45:10 - 01:46:30',
        intensity: 'severe',
        intensityLabel: 'Nặng',
        title: 'Ảo ảnh trong phiên điều trần an ninh',
        description: 'Trong phiên chất vấn an ninh kín nghẹt thở, Oppenheimer tưởng tượng cảnh Jean Tatlock khỏa thân ngồi đối diện trước mặt vợ mình (Kitty Oppenheimer).',
        isSpoiler: true
      },
      {
        id: 'opp-3',
        category: 'horror',
        categoryName: 'Kinh dị & Ám ảnh',
        categoryIcon: '🩸',
        timestamp: '01:58:30 - 02:02:10',
        intensity: 'severe',
        intensityLabel: 'Nặng',
        title: 'Ảo giác kinh hoàng tại khán phòng ăn mừng',
        description: 'Khi phát biểu ăn mừng bom Trinity, Oppenheimer chứng kiến ảo ảnh ánh sáng hạt nhân làm lột da mặt một cô gái, tro bụi thi thể và một người đang nôn mửa vì nhiễm phóng xạ.',
        isSpoiler: true
      },
      {
        id: 'opp-4',
        category: 'violence',
        categoryName: 'Bạo lực & Sức công phá',
        categoryIcon: '⚔️',
        timestamp: '01:52:00 - 01:57:40',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Thử nghiệm bom nguyên tử Trinity',
        description: 'Vụ nổ hạt nhân rung chuyển sa mạc Los Alamos với quả cầu lửa khổng lồ, sóng xung kích chấn động và âm thanh uy lực gây căng thẳng cao độ.',
        isSpoiler: false
      },
      {
        id: 'opp-5',
        category: 'horror',
        categoryName: 'Kinh dị & Tự sát',
        categoryIcon: '🩸',
        timestamp: '01:28:45 - 01:30:10',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Cái chết bi thảm của Jean Tatlock trong bồn tắm',
        description: 'Phát hiện thi thể Jean Tatlock chìm trong bồn tắm với những hình ảnh chớp nhoáng về hành vi tự sát hoặc nghi vấn ám sát.',
        isSpoiler: true
      }
    ]
  },

  // 2. PARASITE (T18)
  'parasite-2019': {
    movieTitle: 'Parasite',
    ratingCode: 'T18',
    verdict: 'Gắn nhãn T18 do phân cảnh bạo lực đẫm máu tột cùng ở hồi kết, cảnh đâm dao trực diện, yếu tố tình dục gợi cảm trên ghế sofa và ngôn ngữ chửi thề gay gắt.',
    parentalGuidance: 'Phim có những cảnh bạo lực bằng hung khí tàn khốc, đầu rơi máu chảy bất ngờ gây sốc mạnh cho người xem.',
    stats: {
      nudity: { count: 1, level: 'moderate', label: 'Vừa' },
      violence: { count: 4, level: 'severe', label: 'Rất nặng' },
      horror: { count: 3, level: 'severe', label: 'Máu me & Căng thẳng' },
      language: { count: 6, level: 'moderate', label: 'Trung bình' }
    },
    scenes: [
      {
        id: 'par-1',
        category: 'nudity',
        categoryName: 'Cảnh nóng & Gợi cảm',
        categoryIcon: '🔥',
        timestamp: '01:08:15 - 01:12:00',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Cảnh thân mật vợ chồng trên ghế sofa',
        description: 'Vợ chồng ông Park âu yếm và có hành vi tình dục bằng tay trên ghế phòng khách trong khi gia đình ông Kim đang nín thở trốn dưới gầm bàn.',
        isSpoiler: false
      },
      {
        id: 'par-2',
        category: 'violence',
        categoryName: 'Bạo lực & Đánh đập',
        categoryIcon: '⚔️',
        timestamp: '01:22:10 - 01:25:30',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Cuộc ẩu đả giành giật điện thoại dưới tầng hầm',
        description: 'Gia đình Kim và bà quản gia cũ Moon-gwang xô xát dữ dội, đạp ngã cầu thang dẫn đến chấn thương sọ não đẫm máu.',
        isSpoiler: true
      },
      {
        id: 'par-3',
        category: 'violence',
        categoryName: 'Bạo lực tàn khốc',
        categoryIcon: '⚔️',
        timestamp: '01:46:20 - 01:50:40',
        intensity: 'severe',
        intensityLabel: 'Rất nặng',
        title: 'Thảm sát bằng dao tại tiệc sinh nhật sân vườn',
        description: 'Người chồng dưới hầm cầm dao làm bếp lao ra đâm thủng ngực con gái Ki-jung, máu phun xối xả trước mắt quan khách.',
        isSpoiler: true
      },
      {
        id: 'par-4',
        category: 'horror',
        categoryName: 'Máu me & Tử vong',
        categoryIcon: '🩸',
        timestamp: '01:50:50 - 01:53:15',
        intensity: 'severe',
        intensityLabel: 'Rất nặng',
        title: 'Đâm xuyên tim ông Park và xiên thịt nướng',
        description: 'Bà mẹ Kim dùng que xiên thịt đâm chết kẻ sát nhân, sau đó ông Kim phẫn nộ đâm dao găm vào ngực ông Park rồi bỏ trốn.',
        isSpoiler: true
      }
    ]
  },

  // 3. THE DARK KNIGHT (T16)
  'the-dark-knight-2008': {
    movieTitle: 'The Dark Knight',
    ratingCode: 'T16',
    verdict: 'Gắn nhãn T16 vì các cảnh bạo lực vũ trang dồn dập, tâm lý tội phạm điên loạn tàn độc của Joker, các vụ đánh bom khủng bố và khuôn mặt bỏng nửa bên của Two-Face.',
    parentalGuidance: 'Phù hợp cho khán giả từ 16 tuổi. Trẻ em dưới 16 tuổi có thể bị ám ảnh bởi nụ cười sẹo và hành vi tâm lý méo mó của Joker.',
    stats: {
      nudity: { count: 0, level: 'none', label: 'Không có' },
      violence: { count: 6, level: 'moderate', label: 'Căng thẳng' },
      horror: { count: 3, level: 'moderate', label: 'Ám ảnh' },
      language: { count: 2, level: 'mild', label: 'Nhẹ' }
    },
    scenes: [
      {
        id: 'tdk-1',
        category: 'violence',
        categoryName: 'Bạo lực & Giết người',
        categoryIcon: '⚔️',
        timestamp: '00:23:40 - 00:25:10',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Trò ảo thuật chiếc bút chì của Joker',
        description: 'Joker cắm chiếc bút chì dựng đứng trên bàn và đập mạnh đầu một tên xã hội đen xuống, khiến chiếc bút chì cắm thẳng vào mắt/đầu.',
        isSpoiler: false
      },
      {
        id: 'tdk-2',
        category: 'violence',
        categoryName: 'Bạo lực & Cháy nổ',
        categoryIcon: '⚔️',
        timestamp: '01:18:20 - 01:23:45',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Vụ nổ kho xăng kép giết chết Rachel',
        description: 'Joker gài bom ở hai địa điểm riêng biệt, vụ nổ thiêu rụi Rachel và khiến nửa khuôn mặt Harvey Dent bị lửa thiêu biến dạng.',
        isSpoiler: true
      },
      {
        id: 'tdk-3',
        category: 'horror',
        categoryName: 'Biến dạng & Ám ảnh',
        categoryIcon: '🩸',
        timestamp: '01:34:10 - 01:37:00',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Tạo hình nửa mặt cháy xém của Two-Face',
        description: 'Hình ảnh cận cảnh nửa khuôn mặt lộ cơ thịt cháy đen, không mí mắt và hở răng rùng rợn của Harvey Dent trong bệnh viện.',
        isSpoiler: true
      },
      {
        id: 'tdk-4',
        category: 'violence',
        categoryName: 'Bạo lực & Tra tấn',
        categoryIcon: '⚔️',
        timestamp: '01:12:00 - 01:16:30',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Batman thẩm vấn Joker trong phòng giam',
        description: 'Batman đập đầu Joker xuống bàn sắt và đánh đấm liên hoàn trong khi Joker vừa cười điên dại vừa khiêu khích.',
        isSpoiler: false
      }
    ]
  },

  // 4. TRAIN TO BUSAN (T18)
  'train-to-busan-2016': {
    movieTitle: 'Train to Busan',
    ratingCode: 'T18',
    verdict: 'Gắn nhãn T18 do sự xuất hiện liên tục của zombie khát máu, các cảnh cắn xé cấu xé thịt người chân thực, máu me tràn ngập và sự hy sinh bi thương.',
    parentalGuidance: 'Khuyến cáo không dành cho người sợ máu hoặc trẻ em. Nhịp phim dồn dập và tiếng gầm rú của xác sống có thể gây căng thẳng tột độ.',
    stats: {
      nudity: { count: 0, level: 'none', label: 'Không có' },
      violence: { count: 7, level: 'severe', label: 'Nặng' },
      horror: { count: 6, level: 'severe', label: 'Kinh dị / Máu me' },
      language: { count: 3, level: 'mild', label: 'Nhẹ' }
    },
    scenes: [
      {
        id: 'ttb-1',
        category: 'horror',
        categoryName: 'Kinh dị & Biến đổi zombie',
        categoryIcon: '🩸',
        timestamp: '00:15:30 - 00:19:40',
        intensity: 'severe',
        intensityLabel: 'Nặng',
        title: 'Cô gái đầu tiên phát bệnh và cắn nữ tiếp viên',
        description: 'Một phụ nữ trốn lên tàu bị co giật bẻ gập xương sống ghê rợn, sau đó lao vào cắn xé cổ nữ tiếp viên tàu hỏa khiến máu phun khắp toa.',
        isSpoiler: false
      },
      {
        id: 'ttb-2',
        category: 'violence',
        categoryName: 'Bạo lực & Cận chiến',
        categoryIcon: '⚔️',
        timestamp: '00:48:20 - 00:54:10',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Cuộc đột phá 3 toa tàu của bộ ba Sang-hwa',
        description: 'Sang-hwa dùng tay bọc băng dính đấm vỡ mặt các zombie, Seok-woo dùng gậy bóng chày đập tan đàn xác sống qua các toa tối.',
        isSpoiler: false
      },
      {
        id: 'ttb-3',
        category: 'horror',
        categoryName: 'Kinh dị & Hy sinh bi thương',
        categoryIcon: '🩸',
        timestamp: '01:05:30 - 01:08:45',
        intensity: 'severe',
        intensityLabel: 'Rất nặng',
        title: 'Sang-hwa bị cắn xé để chặn cửa cứu vợ mang bầu',
        description: 'Sang-hwa lấy thân mình chặn cửa kính toa tàu, bị hàng chục zombie cắn nát cánh tay và cổ trước khi biến đổi.',
        isSpoiler: true
      },
      {
        id: 'ttb-4',
        category: 'violence',
        categoryName: 'Bạo lực & Tử vong',
        categoryIcon: '⚔️',
        timestamp: '01:42:00 - 01:47:30',
        intensity: 'severe',
        intensityLabel: 'Nặng',
        title: 'Trận chiến cuối cùng trên đầu tàu hỏa',
        description: 'Seok-woo giằng co với gã giám đốc đã hóa zombie, bị cắn vào bàn tay và quyết định gieo mình xuống đường ray để bảo vệ con gái Su-an.',
        isSpoiler: true
      }
    ]
  },

  // 5. DUNE: PART TWO (T16)
  'dune-part-two-2024': {
    movieTitle: 'Dune: Part Two',
    ratingCode: 'T16',
    verdict: 'Gắn nhãn T16 do các đại cảnh chiến tranh sa mạc khốc liệt, các đòn cắt cổ sát thủ lạnh lùng, đấu dao sinh tử tại đấu trường Giedi Prime và thảm sát hoàng gia.',
    parentalGuidance: 'Phim có nhiều cảnh đâm dao chí mạng, thiêu xác tập thể và yếu tố bạo lực chính trị căng thẳng.',
    stats: {
      nudity: { count: 0, level: 'none', label: 'Không có' },
      violence: { count: 5, level: 'moderate', label: 'Trung bình' },
      horror: { count: 2, level: 'mild', label: 'Rùng rợn nhẹ' },
      language: { count: 1, level: 'mild', label: 'Nhẹ' }
    },
    scenes: [
      {
        id: 'dune2-1',
        category: 'violence',
        categoryName: 'Bạo lực & Đấu trường',
        categoryIcon: '⚔️',
        timestamp: '00:46:10 - 00:52:30',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Feyd-Rautha tàn sát tù binh Atreides',
        description: 'Feyd-Rautha dùng dao găm cắt cổ và đâm chết các đấu sĩ tù binh Atreides trong đấu trường đen trắng đẫm máu.',
        isSpoiler: false
      },
      {
        id: 'dune2-2',
        category: 'violence',
        categoryName: 'Bạo lực & Quyết đấu dao găm',
        categoryIcon: '⚔️',
        timestamp: '02:22:15 - 02:28:40',
        intensity: 'severe',
        intensityLabel: 'Nặng',
        title: 'Trận giác đấu sinh tử giữa Paul và Feyd-Rautha',
        description: 'Hai đối thủ đâm dao xuyên qua vai và mạn sườn của nhau, trước khi Paul rút dao đâm thẳng từ dưới cằm xuyên lên não của Feyd-Rautha.',
        isSpoiler: true
      },
      {
        id: 'dune2-3',
        category: 'violence',
        categoryName: 'Bạo lực & Ám sát',
        categoryIcon: '⚔️',
        timestamp: '02:18:00 - 02:20:30',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Paul hạ sát Nam tước Harkonnen',
        description: 'Paul bước tới và cắm thẳng lưỡi dao Crysknife vào cổ họng tên độc tài béo phì Vladimir Harkonnen đang thoi thóp.',
        isSpoiler: true
      }
    ]
  },

  // 6. STRANGER THINGS (T16)
  'stranger-things': {
    movieTitle: 'Stranger Things',
    ratingCode: 'T16',
    verdict: 'Gắn nhãn T16/16+ do các cảnh quái vật Demogorgon và Vecna giết người rùng rợn bẻ gãy xương cốt, bầu không khí đen tối rùng rợn và cảnh bạo lực trẻ em.',
    parentalGuidance: 'Chứa các phân cảnh tra tấn tâm lý và biến dạng cơ thể (body horror) gây sốc mạnh cho người xem nhỏ tuổi.',
    stats: {
      nudity: { count: 0, level: 'none', label: 'Không có' },
      violence: { count: 6, level: 'moderate', label: 'Căng thẳng' },
      horror: { count: 5, level: 'severe', label: 'Rùng rợn / Máu me' },
      language: { count: 4, level: 'mild', label: 'Nhẹ' }
    },
    scenes: [
      {
        id: 'st-1',
        category: 'horror',
        categoryName: 'Kinh dị & Bẻ gãy xương',
        categoryIcon: '🩸',
        timestamp: 'Tập 1 - 00:44:20',
        intensity: 'severe',
        intensityLabel: 'Rất nặng',
        title: 'Vecna nguyền rủa và sát hại Chrissy',
        description: 'Chrissy bị nhấc bổng lơ lửng lên trần nhà, toàn bộ xương tay chân bị bẻ gãy ngược rắc rắc và hốc mắt bị nổ đẫm máu.',
        isSpoiler: true
      },
      {
        id: 'st-2',
        category: 'violence',
        categoryName: 'Bạo lực & Quái vật',
        categoryIcon: '⚔️',
        timestamp: 'Tập 4 - 00:52:10',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Max chạy trốn khỏi hang ổ của Vecna',
        description: 'Max vùng chạy thoát khỏi ảo giác của Vecna trong khi các tảng đá rơi và quái vật truy đuổi trên nền nhạc Running Up That Hill.',
        isSpoiler: false
      }
    ]
  },

  // 7. SQUID GAME (T18)
  'squid-game': {
    movieTitle: 'Squid Game',
    ratingCode: 'T18',
    verdict: 'Gắn nhãn T18 do các trò chơi sinh tồn tàn khốc, các cảnh xử bắn hàng loạt bằng súng máy, buôn bán nội tạng người và cảnh tình dục trong phòng vệ sinh.',
    parentalGuidance: 'Tuyệt đối cấm trẻ em dưới 18 tuổi theo dõi. Phim chứa các phân cảnh bắn thủng đầu đẫm máu và tha hóa đạo đức con người.',
    stats: {
      nudity: { count: 1, level: 'moderate', label: 'Vừa' },
      violence: { count: 8, level: 'severe', label: 'Cực nặng' },
      horror: { count: 6, level: 'severe', label: 'Tàn sát máu me' },
      language: { count: 7, level: 'moderate', label: 'Chửi thề nhiều' }
    },
    scenes: [
      {
        id: 'sg-1',
        category: 'violence',
        categoryName: 'Bạo lực & Xử bắn hàng loạt',
        categoryIcon: '⚔️',
        timestamp: 'Tập 1 - 00:38:15',
        intensity: 'severe',
        intensityLabel: 'Cực nặng',
        title: 'Thảm sát trong trò chơi Đèn Đỏ, Đèn Xanh',
        description: 'Hàng trăm người chơi hoảng loạn tháo chạy bị các khẩu súng máy tự động bắn xối xả, thi thể và máu đỏ nhuộm kín mặt sân.',
        isSpoiler: false
      },
      {
        id: 'sg-2',
        category: 'nudity',
        categoryName: 'Cảnh nóng & Nhạy cảm',
        categoryIcon: '🔥',
        timestamp: 'Tập 4 - 00:22:40',
        intensity: 'moderate',
        intensityLabel: 'Vừa',
        title: 'Cảnh quan hệ giữa Mi-nyeo và Deok-su',
        description: 'Han Mi-nyeo và Jang Deok-su có hành vi ân ái thân mật lén lút bên trong buồng vệ sinh để đổi lấy sự bảo vệ.',
        isSpoiler: false
      },
      {
        id: 'sg-3',
        category: 'violence',
        categoryName: 'Bạo lực & Đâm dao',
        categoryIcon: '⚔️',
        timestamp: 'Tập 9 - 00:35:10',
        intensity: 'severe',
        intensityLabel: 'Rất nặng',
        title: 'Trận chiến dao găm sinh tử dưới mưa giữa Gi-hun và Sang-woo',
        description: 'Hai người bạn thuở nhỏ dùng dao đâm chém nhau tàn bạo trên sàn trò chơi bùn lầy trước khi Sang-woo tự đâm vào cổ kết liễu đời mình.',
        isSpoiler: true
      }
    ]
  }
};

/**
 * Thuật toán suy luận thông minh tạo phân tích chi tiết cho bất kỳ phim nào chưa có trong DB
 * Dựa vào thời lượng, thể loại, tóm tắt và nhãn kiểm duyệt.
 */
export function generateSmartAdvisory(movie) {
  if (!movie) return null;

  const badge = getAgeRatingBadge(movie);
  const code = badge ? badge.code : 'T16';
  const genresStr = (Array.isArray(movie.genres) ? movie.genres.join(' ') : (movie.genres || '')).toLowerCase();
  const title = movie.vietnameseTitle || movie.title || 'Tác phẩm';
  const standard = VIETNAM_AGE_STANDARDS[code] || VIETNAM_AGE_STANDARDS['T16'];

  // Tính toán thời lượng ước tính bằng phút
  let totalMinutes = 110;
  if (movie.runtime) {
    const match = movie.runtime.match(/(\d+)/);
    if (match) totalMinutes = parseInt(match[1], 10);
  }

  const formatMinToTime = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const s = Math.floor((min % 1) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const hasAction = genresStr.includes('hành động') || genresStr.includes('action') || genresStr.includes('chiến tranh') || genresStr.includes('war');
  const hasHorror = genresStr.includes('kinh dị') || genresStr.includes('horror') || genresStr.includes('giật gân') || genresStr.includes('thriller');
  const hasRomance = genresStr.includes('lãng mạn') || genresStr.includes('romance') || genresStr.includes('tình cảm') || genresStr.includes('drama');
  const hasCrime = genresStr.includes('tội phạm') || genresStr.includes('crime') || genresStr.includes('bí ẩn');

  let nudityCount = 0;
  let violenceCount = 0;
  let horrorCount = 0;
  let languageCount = code === 'T18' ? 4 : (code === 'T16' ? 2 : 1);

  const scenes = [];

  if (code === 'T18') {
    if (hasHorror) {
      horrorCount = 4;
      violenceCount = 3;
      nudityCount = hasRomance ? 2 : 1;
    } else if (hasAction || hasCrime) {
      violenceCount = 5;
      horrorCount = 2;
      nudityCount = hasRomance ? 2 : 1;
    } else {
      nudityCount = 3;
      violenceCount = 2;
      horrorCount = 1;
    }
  } else if (code === 'T16') {
    violenceCount = hasAction ? 4 : 2;
    horrorCount = hasHorror ? 3 : 1;
    nudityCount = hasRomance ? 1 : 0;
  } else if (code === 'T13') {
    violenceCount = hasAction ? 2 : 1;
    horrorCount = hasHorror ? 1 : 0;
    nudityCount = 0;
  } else if (code === 'K') {
    violenceCount = 1;
    horrorCount = 1;
    nudityCount = 0;
  }

  // Sinh đủ số mốc cảnh theo đúng số lượng đã công bố ở stats (tránh lệch giữa số đếm và danh sách thực tế)
  const spreadTime = (startFrac, endFrac, i, count) => {
    const frac = count <= 1 ? (startFrac + endFrac) / 2 : startFrac + (i * (endFrac - startFrac)) / (count - 1);
    return Math.round(totalMinutes * frac);
  };

  const buildScenes = (category, count, [startFrac, endFrac], templates, dur) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const t = spreadTime(startFrac, endFrac, i, count);
      const tpl = templates[i % templates.length];
      list.push({
        id: `gen-${category}-${i + 1}`,
        category,
        categoryName: tpl.categoryName,
        categoryIcon: tpl.icon,
        timestamp: `${formatMinToTime(t)} - ${formatMinToTime(t + dur)}`,
        intensity: code === 'T18' ? 'severe' : (i === 0 ? 'moderate' : 'mild'),
        intensityLabel: code === 'T18' ? 'Nặng' : (i === 0 ? 'Vừa' : 'Nhẹ'),
        title: tpl.title,
        description: tpl.description(code),
        isSpoiler: i % 2 === 1
      });
    }
    return list;
  };

  const NUDITY_TEMPLATES = [
    {
      categoryName: 'Cảnh nóng & Nhạy cảm', icon: '🔥',
      title: 'Phân đoạn tình cảm thân mật giữa hai nhân vật chính',
      description: (c) => `Cảnh quay thể hiện tình cảm nồng cháy trong không gian riêng tư với các cử chỉ âu yếm tiếp xúc cơ thể ${c === 'T18' ? 'kèm khoảnh khắc để lộ một phần cơ thể quyến rũ' : 'mang tính ước lệ nghệ thuật'}.`
    },
    {
      categoryName: 'Cảnh nóng & Nhạy cảm', icon: '🔥',
      title: 'Cảnh ân ái đẩy cao mâu thuẫn cảm xúc',
      description: () => 'Hai nhân vật bộc lộ cảm xúc dồn nén qua cử chỉ ôm ấp và hôn đắm đuối trước khi bước vào biến cố cao trào của mạch phim.'
    }
  ];

  const VIOLENCE_TEMPLATES = [
    {
      categoryName: 'Bạo lực & Đột kích', icon: '⚔️',
      title: 'Xung đột vũ lực nổ ra giữa các phe phái',
      description: (c) => `Màn đấu súng và cận chiến tay đôi căng thẳng với các đòn đánh mạnh bạo ${c === 'T18' ? 'làm nhiều người bị thương nặng và đổ máu' : 'gây chấn thương cho đối thủ'}.`
    },
    {
      categoryName: 'Bạo lực cao trào', icon: '⚔️',
      title: 'Trận quyết chiến sinh tử tại hồi kết',
      description: () => 'Trận giao tranh đẫm máu hạ gục kẻ thù nguy hiểm nhất nhằm giải quyết dứt điểm toàn bộ ân oán và xung đột trong cốt truyện.'
    },
    {
      categoryName: 'Bạo lực & Rượt đuổi', icon: '⚔️',
      title: 'Cuộc rượt đuổi và đấu súng căng thẳng',
      description: () => 'Pha rượt đuổi tốc độ cao xen lẫn đấu súng dữ dội giữa các phe đối đầu, gây thương vong trên đường đi.'
    }
  ];

  const HORROR_TEMPLATES = [
    {
      categoryName: 'Kinh dị & Rùng rợn', icon: '🩸',
      title: 'Phân đoạn jumpscare giật mình và phát hiện rùng rợn',
      description: () => 'Âm thanh tĩnh lặng bị xé toạc bởi sự xuất hiện đột ngột của yếu tố nguy hiểm cùng vết máu và hiện trường gây sốc thị giác.'
    },
    {
      categoryName: 'Kinh dị & Ám ảnh', icon: '🩸',
      title: 'Hiện trường ám ảnh với hình ảnh máu me',
      description: () => 'Nhân vật phát hiện hiện trường rùng rợn với dấu vết máu me và hình ảnh biến dạng gây ám ảnh tâm lý.'
    },
    {
      categoryName: 'Kinh dị & Truy đuổi', icon: '🩸',
      title: 'Cảnh truy đuổi kinh hoàng đẩy cao kịch tính',
      description: () => 'Nhân vật bị thế lực nguy hiểm truy đuổi trong không gian tối tăm, xen lẫn tiếng gào thét và hình ảnh gây sốc.'
    }
  ];

  scenes.push(...buildScenes('nudity', nudityCount, [0.18, 0.68], NUDITY_TEMPLATES, 2));
  scenes.push(...buildScenes('violence', violenceCount, [0.30, 0.85], VIOLENCE_TEMPLATES, 3));
  scenes.push(...buildScenes('horror', horrorCount, [0.40, 0.92], HORROR_TEMPLATES, 2));

  // Sắp xếp các cảnh theo mốc thời gian tăng dần
  scenes.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    movieTitle: title,
    ratingCode: code,
    verdict: `Tác phẩm được xếp loại ${code} (${standard.name}) do có chứa yếu tố ${violenceCount > 0 ? 'hành động bạo lực' : ''} ${horrorCount > 0 ? (violenceCount > 0 ? ', ' : '') + 'cảnh giật gân rùng rợn' : ''} ${nudityCount > 0 ? (violenceCount > 0 || horrorCount > 0 ? ' và ' : '') + 'cảnh tình cảm nhạy cảm' : ''} cần giới hạn độ tuổi phù hợp.`,
    parentalGuidance: code === 'T18' 
      ? 'Khuyến cáo: Tác phẩm chỉ dành cho khán giả từ đủ 18 tuổi trở lên. Không thích hợp cho trẻ nhỏ và người dễ bị ảnh hưởng tâm lý.'
      : code === 'T16'
      ? 'Khuyến cáo: Dành cho khán giả từ đủ 16 tuổi trở lên do có một số cảnh va chạm bạo lực và tâm lý căng thẳng.'
      : 'Khuyến cáo: Phụ huynh nên đồng hành hoặc hướng dẫn trẻ em trong quá trình theo dõi nội dung.',
    stats: {
      nudity: {
        count: nudityCount,
        level: nudityCount >= 2 ? 'severe' : (nudityCount === 1 ? 'moderate' : 'none'),
        label: nudityCount >= 2 ? 'Nhiều / Nặng' : (nudityCount === 1 ? 'Vừa' : 'Không có')
      },
      violence: {
        count: violenceCount,
        level: violenceCount >= 4 ? 'severe' : (violenceCount >= 2 ? 'moderate' : (violenceCount === 1 ? 'mild' : 'none')),
        label: violenceCount >= 4 ? 'Nặng' : (violenceCount >= 2 ? 'Vừa' : (violenceCount === 1 ? 'Nhẹ' : 'Không có'))
      },
      horror: {
        count: horrorCount,
        level: horrorCount >= 3 ? 'severe' : (horrorCount >= 1 ? 'moderate' : 'none'),
        label: horrorCount >= 3 ? 'Máu me / Sốc' : (horrorCount >= 1 ? 'Hồi hộp' : 'Không có')
      },
      language: {
        count: languageCount,
        level: languageCount >= 4 ? 'moderate' : 'mild',
        label: languageCount >= 4 ? 'Chửi thề / Gay gắt' : 'Bình thường'
      }
    },
    scenes: scenes
  };
}

/**
 * Trả về dữ liệu chi tiết cảnh báo độ tuổi cho một phim bất kỳ
 */
export function getMovieAdvisory(movie) {
  if (!movie) return null;

  // 1. Kiểm tra nếu movie có sẵn trường `contentAdvisory` từ AI / API
  if (movie.contentAdvisory && Array.isArray(movie.contentAdvisory.scenes) && movie.contentAdvisory.scenes.length > 0) {
    return movie.contentAdvisory;
  }

  // 2. Tra cứu trong cơ sở dữ liệu Curated
  const dbKey = movie.id || movie.title?.toLowerCase()?.replace(/[^a-z0-9]+/g, '-');
  if (CURATED_ADVISORY_DB[dbKey]) {
    return CURATED_ADVISORY_DB[dbKey];
  }

  // Tra cứu theo tên phim tiếng Anh
  const cleanTitle = (movie.englishTitle || movie.title || '').toLowerCase().trim();
  for (const [k, v] of Object.entries(CURATED_ADVISORY_DB)) {
    if (cleanTitle.includes(v.movieTitle.toLowerCase()) || v.movieTitle.toLowerCase().includes(cleanTitle)) {
      return v;
    }
  }

  // 3. Tự động sinh dữ liệu phân tích thông minh
  return generateSmartAdvisory(movie);
}

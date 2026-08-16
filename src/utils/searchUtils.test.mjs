/**
 * Kiểm tra thứ tự sắp xếp ứng viên tra cứu AI:
 * 1. Bậc khớp tên  2. Năm sản xuất mới nhất  3. Điểm IMDb cao nhất
 *
 * Chạy: node src/utils/searchUtils.test.mjs
 */
import assert from 'node:assert/strict';
import { compareCandidates, calculateRelevance } from './searchUtils.js';

const sortTitles = list => [...list].sort(compareCandidates).map(c => c.title);

// 1. Bậc khớp tên thắng năm và điểm IMDb
assert.deepEqual(
  sortTitles([
    { title: 'khớp kém, mới, điểm cao', relevanceScore: 60000, year: 2026, imdbRating: '9.0' },
    { title: 'khớp chính xác, cũ, điểm thấp', relevanceScore: 100000, year: 1972, imdbRating: '1.0' }
  ]),
  ['khớp chính xác, cũ, điểm thấp', 'khớp kém, mới, điểm cao']
);

// 2. Cùng bậc khớp tên -> năm mới nhất lên trước, kể cả khi điểm IMDb thấp hơn
assert.deepEqual(
  sortTitles([
    { title: 'cũ, điểm cao', relevanceScore: 100000, year: 1972, imdbRating: '9.2' },
    { title: 'mới, điểm thấp', relevanceScore: 100000, year: 2026, imdbRating: '2.6' }
  ]),
  ['mới, điểm thấp', 'cũ, điểm cao']
);

// 3. Điểm thưởng phụ (vote/imdb/poster, tối đa ~6200) KHÔNG được đẩy ứng viên vượt bậc
//    -> vẫn cùng bậc 100000 nên năm sản xuất mới là tiêu chí quyết định
assert.deepEqual(
  sortTitles([
    { title: 'cũ nhưng nhiều thưởng', relevanceScore: 100000 + 6200, year: 1972, imdbRating: '9.2' },
    { title: 'mới không thưởng', relevanceScore: 100000, year: 2026, imdbRating: '2.6' }
  ]),
  ['mới không thưởng', 'cũ nhưng nhiều thưởng']
);

// 4. Cùng bậc, cùng năm -> điểm IMDb cao lên trước
assert.deepEqual(
  sortTitles([
    { title: 'điểm thấp', relevanceScore: 80000, year: 2026, imdbRating: '5.1' },
    { title: 'điểm cao', relevanceScore: 80000, year: 2026, imdbRating: '8.4' }
  ]),
  ['điểm cao', 'điểm thấp']
);

// 5. Thiếu năm / thiếu điểm không làm vỡ thứ tự
assert.deepEqual(
  sortTitles([
    { title: 'không năm không điểm', relevanceScore: 80000 },
    { title: 'có năm', relevanceScore: 80000, year: 2020, imdbRating: null }
  ]),
  ['có năm', 'không năm không điểm']
);

// 6. Tích hợp: relevanceScore thật từ calculateRelevance vẫn giữ đúng bậc khớp tên
const exact = { title: 'The Last House', vietnameseTitle: 'The Last House', year: 2026, imdbRating: '2.6' };
const partial = { title: 'The Last House on the Left', vietnameseTitle: 'The Last House on the Left', year: 2009, imdbRating: '6.5' };
exact.relevanceScore = calculateRelevance(exact, 'The Last House');
partial.relevanceScore = calculateRelevance(partial, 'The Last House');
assert.ok(
  Math.floor(exact.relevanceScore / 10000) > Math.floor(partial.relevanceScore / 10000),
  'trùng tên chính xác phải ở bậc cao hơn khớp một phần'
);
assert.deepEqual(sortTitles([partial, exact]), ['The Last House', 'The Last House on the Left']);

console.log('OK - compareCandidates: khớp tên -> năm sản xuất -> điểm IMDb');

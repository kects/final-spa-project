<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMovieStore } from '../stores/movieStore';

const store = useMovieStore();
const router = useRouter();

const sortOption = ref('popular');
const searchKeyword = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(() => {
  if (store.movies.length === 0) {
    store.fetchMovies();
  }

  document.title = '🍿 국내 극장 화제작';
});

const sortedMovies = computed(() => {
  const copiedMovies = [...store.movies];

  if (sortOption.value === 'title') {
    return copiedMovies.sort((a, b) => {
      return (a.title || '').localeCompare(b.title || '', 'ko-KR');
    });
  }

  if (sortOption.value === 'releaseDate') {
    return copiedMovies.sort((a, b) => {
      return new Date(b.release_date || '1900-01-01') - new Date(a.release_date || '1900-01-01');
    });
  }

  if (sortOption.value === 'rating') {
    return copiedMovies.sort((a, b) => {
      return Number(b.vote_average || 0) - Number(a.vote_average || 0);
    });
  }

  return copiedMovies;
});

const totalPages = computed(() => {
  return Math.ceil(sortedMovies.value.length / itemsPerPage) || 1;
});

const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, index) => index + 1);
});

const paginatedMovies = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return sortedMovies.value.slice(startIndex, endIndex);
});

watch(sortOption, () => {
  currentPage.value = 1;
});

watch(totalPages, (newTotalPages) => {
  if (currentPage.value > newTotalPages) {
    currentPage.value = newTotalPages;
  }
});

const changeSort = (option) => {
  sortOption.value = option;
};

const movePage = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const searchMovies = () => {
  const keyword = searchKeyword.value.trim();

  if (!keyword) return;

  router.push({
    name: 'search-results',
    query: { q: keyword },
  });
};

const formatRating = (movie) => {
  return Number(movie.vote_average || 0).toFixed(1);
};
</script>

<template>
  <main class="page">
    <div class="header-section">
      <h1>🍿 국내 극장 화제작</h1>
      <p class="sub-title">2025년 이후 국내 정식 개봉한 실시간 인기 상영작</p>
    </div>

    <section class="control-panel">
      <form class="search-box" @submit.prevent="searchMovies">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="영화 제목이나 줄거리로 검색하세요"
          class="search-input"
        >
        <button type="submit" class="search-btn">검색</button>
      </form>

      <div class="sort-box">
        <span class="sort-label">정렬</span>
        <button
          type="button"
          class="sort-btn"
          :class="{ active: sortOption === 'popular' }"
          @click="changeSort('popular')"
        >
          인기순
        </button>
        <button
          type="button"
          class="sort-btn"
          :class="{ active: sortOption === 'title' }"
          @click="changeSort('title')"
        >
          제목 순
        </button>
        <button
          type="button"
          class="sort-btn"
          :class="{ active: sortOption === 'releaseDate' }"
          @click="changeSort('releaseDate')"
        >
          개봉일 순
        </button>
        <button
          type="button"
          class="sort-btn"
          :class="{ active: sortOption === 'rating' }"
          @click="changeSort('rating')"
        >
          평점 순
        </button>
      </div>
    </section>

    <div v-if="store.isLoading" class="status-message loading">
      ⏳ 실시간 국내 개봉작 데이터를 싣고 오는 중입니다...
    </div>

    <div v-else-if="store.errorMessage" class="status-message error">
      🚨 {{ store.errorMessage }}
    </div>

    <template v-else>
      <div class="movie-list">
        <div v-for="movie in paginatedMovies" :key="movie.id" class="movie-card">
          <img
            v-if="movie.poster_path"
            :src="`https://image.tmdb.org/t/p/w500${movie.poster_path}`"
            :alt="movie.title"
            class="poster"
          >

          <div v-else class="poster-placeholder">이미지 준비 중</div>

          <div class="card-content">
            <h3 class="title">{{ movie.title }}</h3>

            <p class="release-date" v-if="movie.release_date">
              🗓️ 개봉일: {{ movie.release_date }}
            </p>

            <p class="rating">⭐ {{ formatRating(movie) }} / 10</p>

            <p class="overview">
              {{
                movie.overview
                  ? movie.overview.substring(0, 60) + '...'
                  : '국내에 등록된 줄거리 요약 정보가 없습니다.'
              }}
            </p>

            <button
              @click.stop.prevent="store.toggleFavorite(movie)"
              :class="{ active: movie.isFavorite }"
              class="fav-btn"
            >
              {{ movie.isFavorite ? '❤️ 찜 해제' : '🤍 찜하기' }}
            </button>
          </div>

          <RouterLink
            :to="`/movies/${movie.id}`"
            class="stretched-link"
            :aria-label="`${movie.title} 상세 정보 보기`"
          ></RouterLink>
        </div>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button
          type="button"
          class="page-btn"
          :disabled="currentPage === 1"
          @click="movePage(currentPage - 1)"
        >
          이전
        </button>

        <button
          v-for="page in pageNumbers"
          :key="page"
          type="button"
          class="page-number"
          :class="{ active: currentPage === page }"
          @click="movePage(page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="movePage(currentPage + 1)"
        >
          다음
        </button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.page {
  padding: 40px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header-section {
  margin-bottom: 30px;
  text-align: center;
  color: #2c3e50;
}

.sub-title {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 5px;
}

.control-panel {
  max-width: 1100px;
  margin: 0 auto 30px auto;
  padding: 22px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.search-input {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid #dfe4ea;
  border-radius: 10px;
  font-size: 15px;
}

.search-btn,
.sort-btn,
.page-btn,
.page-number {
  border: none;
  cursor: pointer;
  font-weight: 700;
}

.search-btn {
  padding: 0 24px;
  border-radius: 10px;
  background: #ff4757;
  color: #ffffff;
}

.sort-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.sort-label {
  font-weight: 800;
  color: #2f3542;
  margin-right: 4px;
}

.sort-btn {
  padding: 10px 16px;
  border-radius: 999px;
  background: #ecf0f1;
  color: #2f3542;
}

.sort-btn.active {
  background: #1e272e;
  color: #ffffff;
}

.status-message {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  padding: 50px;
  border-radius: 12px;
}

.loading {
  color: #3498db;
  background-color: #e3f2fd;
}

.error {
  color: #e74c3c;
  background-color: #fdeaea;
}

.movie-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
}

.movie-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  text-align: left;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
}

.movie-card:hover {
  transform: translateY(-5px);
}

.poster {
  width: 100%;
  height: 380px;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 380px;
  background-color: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
  font-weight: bold;
}

.card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.title {
  font-size: 18px;
  color: #333;
  margin: 0 0 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
}

.release-date {
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 10px;
  font-weight: 500;
}

.rating {
  font-weight: bold;
  color: #f39c12;
  margin-bottom: 10px;
  font-size: 16px;
}

.overview {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
  margin-bottom: 20px;
  flex-grow: 1;
}

.fav-btn {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 12px;
  cursor: pointer;
  border: none;
  background: #ecf0f1;
  color: #333;
  border-radius: 8px;
  font-weight: bold;
  font-size: 14px;
  transition: 0.3s;
  margin-top: auto;
}

.fav-btn.active {
  background: #ff4757;
  color: white;
}

.stretched-link {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 40px 0 10px 0;
}

.page-btn,
.page-number {
  padding: 10px 14px;
  border-radius: 8px;
  background: #ffffff;
  color: #2f3542;
  border: 1px solid #dfe4ea;
}

.page-number.active {
  background: #ff4757;
  color: #ffffff;
  border-color: #ff4757;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

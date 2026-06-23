<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMovieStore } from '../stores/movieStore';

const route = useRoute();
const router = useRouter();
const store = useMovieStore();

const searchText = ref(route.query.q ? String(route.query.q) : '');

onMounted(() => {
  if (store.movies.length === 0) {
    store.fetchMovies();
  }
});

watch(
  () => route.query.q,
  (newKeyword) => {
    searchText.value = newKeyword ? String(newKeyword) : '';
    document.title = searchText.value ? `🔎 ${searchText.value} 검색 결과` : '검색 결과';
  },
  { immediate: true }
);

const searchKeyword = computed(() => {
  return route.query.q ? String(route.query.q).trim().toLowerCase() : '';
});

const searchResults = computed(() => {
  if (!searchKeyword.value) return [];

  return store.movies.filter((movie) => {
    const title = (movie.title || '').toLowerCase();
    const overview = (movie.overview || '').toLowerCase();
    const releaseDate = (movie.release_date || '').toLowerCase();

    return (
      title.includes(searchKeyword.value) ||
      overview.includes(searchKeyword.value) ||
      releaseDate.includes(searchKeyword.value)
    );
  });
});

const submitSearch = () => {
  const keyword = searchText.value.trim();

  if (!keyword) {
    router.push('/movies');
    return;
  }

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
    <section class="search-header">
      <h1>🔎 영화 검색 결과</h1>
      <p v-if="searchKeyword" class="result-count">
        “{{ route.query.q }}” 검색 결과 {{ searchResults.length }}개
      </p>
      <p v-else class="result-count">검색어를 입력해 주세요.</p>

      <form class="search-box" @submit.prevent="submitSearch">
        <input
          v-model="searchText"
          type="text"
          class="search-input"
          placeholder="다른 영화 검색하기"
        >
        <button type="submit" class="search-btn">다시 검색</button>
      </form>
    </section>

    <div v-if="store.isLoading" class="status-message loading">
      ⏳ 검색할 영화 데이터를 불러오는 중입니다...
    </div>

    <div v-else-if="store.errorMessage" class="status-message error">
      🚨 {{ store.errorMessage }}
    </div>

    <div v-else-if="searchResults.length === 0" class="empty-box">
      <h2>검색 결과가 없습니다.</h2>
      <p>제목, 줄거리, 개봉일에 포함된 단어로 다시 검색해 보세요.</p>
      <button @click="router.push('/movies')" class="go-movies-btn">영화 목록으로 이동</button>
    </div>

    <div v-else class="movie-list">
      <div v-for="movie in searchResults" :key="movie.id" class="movie-card">
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
                ? movie.overview.substring(0, 70) + '...'
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
  </main>
</template>

<style scoped>
.page {
  padding: 40px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.search-header {
  max-width: 900px;
  margin: 0 auto 30px auto;
  padding: 26px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
}

.result-count {
  color: #57606f;
  font-weight: 700;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.search-input {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid #dfe4ea;
  border-radius: 10px;
  font-size: 15px;
}

.search-btn,
.go-movies-btn {
  border: none;
  cursor: pointer;
  font-weight: 700;
  border-radius: 10px;
  background: #ff4757;
  color: #ffffff;
}

.search-btn {
  padding: 0 24px;
}

.go-movies-btn {
  padding: 14px 24px;
  margin-top: 14px;
}

.status-message,
.empty-box {
  text-align: center;
  font-size: 18px;
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

.empty-box {
  background: #ffffff;
  color: #2f3542;
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
</style>

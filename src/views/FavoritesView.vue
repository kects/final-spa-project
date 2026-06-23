<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMovieStore } from '../stores/movieStore';

const router = useRouter();
const store = useMovieStore();

onMounted(() => {
  document.title = '❤️ 찜 목록 | NETVUE';
});

const favoriteCount = computed(() => {
  return store.favorites.length;
});

const averageRating = computed(() => {
  if (store.favorites.length === 0) return '0.0';

  const total = store.favorites.reduce((sum, movie) => {
    return sum + Number(movie.vote_average || 0);
  }, 0);

  return (total / store.favorites.length).toFixed(1);
});

const formatRating = (movie) => {
  return Number(movie.vote_average || 0).toFixed(1);
};
</script>

<template>
  <main class="page">
    <section class="favorite-header">
      <h1>❤️ 나의 찜 목록</h1>
      <p>내가 선택한 영화만 따로 모아보는 독립 페이지입니다.</p>

      <div class="summary-box">
        <div class="summary-card">
          <span class="summary-label">찜한 작품</span>
          <strong>{{ favoriteCount }}개</strong>
        </div>
        <div class="summary-card">
          <span class="summary-label">평균 평점</span>
          <strong>{{ averageRating }} / 10</strong>
        </div>
      </div>
    </section>

    <div v-if="store.favorites.length === 0" class="empty-box">
      <h2>아직 찜한 영화가 없습니다.</h2>
      <p>영화 목록에서 마음에 드는 작품을 찜해보세요.</p>
      <button @click="router.push('/movies')" class="go-movies-btn">영화 목록 보러가기</button>
    </div>

    <template v-else>
      <div class="favorite-action-box">
        <button type="button" class="clear-btn" @click="store.clearFavorites">
          전체 찜 목록 비우기
        </button>
      </div>

      <div class="movie-list">
        <div v-for="movie in store.favorites" :key="movie.id" class="movie-card">
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
              class="remove-btn"
            >
              ❤️ 찜 목록에서 제거
            </button>
          </div>

          <RouterLink
            :to="`/movies/${movie.id}`"
            class="stretched-link"
            :aria-label="`${movie.title} 상세 정보 보기`"
          ></RouterLink>
        </div>
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

.favorite-header {
  max-width: 900px;
  margin: 0 auto 30px auto;
  padding: 28px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
}

.favorite-header p {
  color: #57606f;
  font-weight: 700;
}

.summary-box {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.summary-card {
  min-width: 150px;
  padding: 16px 20px;
  background: #1e272e;
  color: #ffffff;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  font-size: 13px;
  color: #a4b0be;
}

.empty-box {
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 16px;
  color: #2f3542;
}

.go-movies-btn,
.clear-btn,
.remove-btn {
  border: none;
  cursor: pointer;
  font-weight: 700;
  border-radius: 10px;
}

.go-movies-btn {
  padding: 14px 24px;
  margin-top: 14px;
  background: #ff4757;
  color: #ffffff;
}

.favorite-action-box {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.clear-btn {
  padding: 12px 18px;
  background: #2f3542;
  color: #ffffff;
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

.remove-btn {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 12px;
  background: #ff4757;
  color: white;
  font-size: 14px;
  transition: 0.3s;
  margin-top: auto;
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

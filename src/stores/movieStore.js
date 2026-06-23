import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const useMovieStore = defineStore('movie', () => {
  const movies = ref([]);
  const favorites = ref(JSON.parse(sessionStorage.getItem('favorites')) || []);
  const isLoading = ref(false);
  const errorMessage = ref('');
  const selectedMovie = ref(null);

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  const saveFavorites = () => {
    sessionStorage.setItem('favorites', JSON.stringify(favorites.value));
  };

  const isFavorite = (movieId) => {
    return favorites.value.some((movie) => movie.id === Number(movieId));
  };

  const updateFavoriteState = (movieId, favoriteState) => {
    const targetMovie = movies.value.find((movie) => movie.id === Number(movieId));

    if (targetMovie) {
      targetMovie.isFavorite = favoriteState;
    }

    if (selectedMovie.value && selectedMovie.value.id === Number(movieId)) {
      selectedMovie.value.isFavorite = favoriteState;
    }
  };

  const fetchMovies = async () => {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      const movieParams = {
        api_key: API_KEY,
        language: 'ko-KR',
        region: 'KR',
        sort_by: 'popularity.desc',
        include_adult: false,
        'release_date.gte': '2025-01-01',
        with_release_type: '2|3',
        page: 1,
      };

      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        params: movieParams,
      });

      const fetchedMovies = response.data.results.map((movie) => {
        return {
          ...movie,
          isFavorite: isFavorite(movie.id),
        };
      });

      movies.value = fetchedMovies;
    } catch (error) {
      console.error('API 통신 에러 상세 내역:', error);
      errorMessage.value = '영화 데이터를 불러오는 데 실패했습니다. 통신 상태나 API Key를 확인해 주세요.';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchMovieDetail = async (movieId) => {
    isLoading.value = true;
    errorMessage.value = '';
    selectedMovie.value = null;

    try {
      const url = `https://api.themoviedb.org/3/movie/${movieId}`;

      const response = await axios.get(url, {
        params: {
          api_key: API_KEY,
          language: 'ko-KR',
        },
      });

      selectedMovie.value = {
        ...response.data,
        isFavorite: isFavorite(response.data.id),
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        errorMessage.value = '존재하지 않거나 삭제된 영화 정보입니다.';
      } else {
        errorMessage.value = '서버 통신 중 에러가 발생했습니다.';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const toggleFavorite = (movieOrId) => {
    const movieId = typeof movieOrId === 'object' ? movieOrId.id : Number(movieOrId);
    const targetMovie =
      typeof movieOrId === 'object'
        ? movieOrId
        : movies.value.find((movie) => movie.id === movieId) || selectedMovie.value;

    if (!movieId || !targetMovie) return;

    const favoriteIndex = favorites.value.findIndex((movie) => movie.id === movieId);

    if (favoriteIndex === -1) {
      favorites.value.push({
        ...targetMovie,
        isFavorite: true,
      });
      updateFavoriteState(movieId, true);
    } else {
      favorites.value.splice(favoriteIndex, 1);
      updateFavoriteState(movieId, false);
    }

    saveFavorites();
  };

  const clearFavorites = () => {
    favorites.value = [];
    movies.value.forEach((movie) => {
      movie.isFavorite = false;
    });

    if (selectedMovie.value) {
      selectedMovie.value.isFavorite = false;
    }

    saveFavorites();
  };

  return {
    movies,
    favorites,
    isLoading,
    errorMessage,
    selectedMovie,
    fetchMovies,
    fetchMovieDetail,
    toggleFavorite,
    clearFavorites,
    isFavorite,
  };
});

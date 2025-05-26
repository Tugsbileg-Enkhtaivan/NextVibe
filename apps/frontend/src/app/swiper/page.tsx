import MovieCarousel from '../components/MovieCarousel';
import MySwiper from '../components/MySwiper';
import CoverflowSwiper from '../components/Swiper';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-600 to-pink-500 p-10">
      {/* <MySwiper /> */}
      {/* <MovieCarousel /> */}
      <CoverflowSwiper />
    </main>
  );
}

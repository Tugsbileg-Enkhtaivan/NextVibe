import MovieCarousel from "../components/MovieCarousel";
import CoverflowSwiper from "../components/Swiper";


export default function Home() {
  return (
    <main className="min-h-100 flex items-center justify-center bg-gradient-to-tr from-purple-600 to-pink-500 p-10">
      {/* <CoverflowSwiper /> */}
      <MovieCarousel />
    </main>
  );
}

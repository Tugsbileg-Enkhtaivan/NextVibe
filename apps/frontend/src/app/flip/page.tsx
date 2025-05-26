import FlipSwiper from "../components/FlipSwiper";

export default function Home() {
    
    return (
        <main className="min-h-screen bg-black text-white p-8">
            <h1 className="text-4xl mb-6 font-bold">Mood Flip Carousel</h1>
            <FlipSwiper />
        </main>
    );
}
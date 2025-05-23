import JackpotPage from "../components/SlotPage";


export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🎰 Slot Machine Game</h1>
                <JackpotPage />
            </div>
        </div>
    );
}
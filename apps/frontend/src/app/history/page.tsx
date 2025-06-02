export default function HistoryPage() {
    return (
        <section className="w-full max-w-[430px] min-w-[375px] min-h-screen h-full bg-[#FAFAFA] p-4 pt-15 mx-auto" style={{
            background: 'linear-gradient(135deg, #FF69B4 0%, #E91E63 30%, #880E4F 45%, #A24F59 50%, #8BC34A 55%, #689F38 70%, #33691E 100%)',
        }}>
            <div className="w-[90%] h-fit rounded-xl shadow-md shadow-emerald-500 mx-auto flex flex-col gap-6 items-center p-4 bg-rtransparent">
                <div className="w-[80%] h-[140px] border-b"></div>
                <div className="w-[80%] h-[140px] border-b"></div>
                <div className="w-[80%] h-[140px] border-b"></div>
                <div className="w-[80%] h-[140px] border-b"></div>
                <div className="w-[80%] h-[140px] border-b"></div>
            </div>
        </section>
    )
};
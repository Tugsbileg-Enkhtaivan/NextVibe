type Props = {
    options: string[];
    selected: string | null;
    onSelect: (value: string) => void;
  };
  
  export default function SelectableGroup({ options, selected, onSelect }: Props) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-4 py-2 rounded-full border transition ${
              selected === opt ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }
  
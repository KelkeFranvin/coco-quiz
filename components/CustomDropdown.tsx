import React, { useState } from 'react';

interface CustomDropdownProps {
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
  label: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, selectedOption, onSelect, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (option: string) => {
    onSelect(option);
    setIsOpen(false); // Close dropdown after selection
  };

  return (
    <div className="relative mb-6">
      <label className="block text-sm font-medium text-white/80 mb-2">{label}</label>
      <button
        className="w-full bg-black/50 border border-purple-500/30 text-white rounded-lg p-3 
                 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
                 transition-all duration-200 hover:bg-black/60"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption || "Wähle eine Frage"}
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full bg-black/90 rounded-lg shadow-lg mt-1 transition-all duration-200 ease-in-out">
          <ul className="max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <li className="text-white p-2">Keine Optionen verfügbar</li>
            ) : (
              options.map((option, index) => (
                <li
                  key={index}
                  className="text-white p-2 hover:bg-purple-500 cursor-pointer transition-colors duration-200"
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;

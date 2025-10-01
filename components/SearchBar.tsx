import React from 'react';
import { SearchIcon } from './icons/SearchIcon';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, onQueryChange }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
        <SearchIcon className="h-5 w-5 text-text-secondary" />
      </div>
      <input
        type="search"
        id="surah-search"
        placeholder="ابحث عن سورة بالاسم أو الرقم..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="block w-full bg-card border border-border-color rounded-md py-2 pl-10 pr-3 text-sm placeholder-text-secondary focus:outline-none focus:text-text-primary focus:ring-1 focus:ring-primary focus:border-primary"
      />
    </div>
  );
};

export default SearchBar;
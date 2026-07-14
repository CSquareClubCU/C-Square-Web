import { useState, useRef, RefObject } from 'react';

export function useCategoryFilter<T extends string>(initialCategory: T = 'All' as T) {
  const [activeCategory, setActiveCategory] = useState<T>(initialCategory);
  const filterBarRef = useRef<HTMLDivElement>(null);

  const handleFilterClick = (category: T) => {
    setActiveCategory(category);
    setTimeout(() => {
      filterBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return { activeCategory, setActiveCategory, filterBarRef, handleFilterClick };
}


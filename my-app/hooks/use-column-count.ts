import { useEffect, useState, useRef } from 'react';

const useDynamicColumns = (minWidth = 200) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const calculateColumns = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        console.log('Container width:', containerWidth); // Debug log
        const calculatedColumns = Math.max(
          1,
          Math.floor(containerWidth / minWidth)
        );
        console.log('Calculated columns:', calculatedColumns); // Debug log
        setColumns(calculatedColumns);
      }
    };

    calculateColumns();
    const resizeObserver = new ResizeObserver(calculateColumns);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [minWidth]);

  return { containerRef, columns };
};
export default useDynamicColumns;
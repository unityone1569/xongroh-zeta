import { useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/assets/icons/loader.svg' 
}: LazyImageProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex-center">
          <img
            src={placeholder}
            alt="loading"
            className="w-6 h-6 animate-spin"
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default LazyImage;
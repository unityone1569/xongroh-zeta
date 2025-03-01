type LoaderProps = {
  size?: 'sm' | 'md' | 'lg';
};

const Loader = ({ size = 'md' }: LoaderProps) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <div className="flex-center w-full">
      <img
        src="/assets/icons/loader.svg"
        alt="loader"
        width={sizeMap[size]}
        height={sizeMap[size]}
        className="animate-spin"
      />
    </div>
  );
};

export default Loader;

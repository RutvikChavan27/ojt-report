type LogoProps = {
  className?: string;
  onClick?: () => void;
};

function Logo({ className = "", onClick }: LogoProps) {
  return (
    <a href="#home" onClick={onClick} className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-black text-white">
        T
      </span>
      <span className="text-lg font-black tracking-tight text-gray-900">
        THREAD
      </span>
    </a>
  );
}

export default Logo;

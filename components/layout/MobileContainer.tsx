interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileContainer({
  children,
  className = "",
}: MobileContainerProps) {
  return (
    <div className={`mobile-container ${className}`}>
      {children}
    </div>
  );
}

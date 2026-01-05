interface ProgressBarProps {
  progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <div className="px-8">
      <div className="h-0.5 bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-neutral-900 rounded-full"
          style={{ 
            width: `${progress}%`,
            transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </div>
    </div>
  );
};


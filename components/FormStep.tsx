interface Props {
  step: number;
  currentStep: number;
  title: string;
  children: React.ReactNode;
}

export default function FormStep({ step, currentStep, title, children }: Props) {
  if (step !== currentStep) return null;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-7 h-7 rounded-full bg-[#7BAF7A] text-white text-xs font-bold flex items-center justify-center">
            {step}
          </span>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );
}

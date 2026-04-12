export default function InvalidAuthPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="border-2 border-[var(--color-border-light)] p-8 sm:p-12 max-w-lg w-full text-center">
        <div className="border-b-2 border-terracotta pb-4 mb-6">
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-terracotta">
            Invalid Code
          </h1>
        </div>

        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
          This QR code is no longer valid. It may have been rotated by your
          tenant manager.
        </p>

        <p className="text-sm text-offwhite font-medium uppercase tracking-wide">
          Please scan the new QR code on your door.
        </p>
      </div>
    </div>
  );
}

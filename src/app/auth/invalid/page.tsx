export default function InvalidAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h1>
        <p className="text-gray-600">
          This QR code is no longer valid. It may have been rotated by your building admin.
          Please scan the new QR code on your door.
        </p>
      </div>
    </div>
  );
}

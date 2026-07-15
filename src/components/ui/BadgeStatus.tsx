// src/components/ui/BadgeStatus.tsx
export default function BadgeStatus({ status, isBorrowed }: { status: string; isBorrowed: boolean }) {
  if (status === "PENDING") {
    return (
      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
        Menunggu
      </span>
    );
  }
  if (status === "APPROVED") {
    return (
      <div className="flex flex-wrap gap-1 items-center">
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
          Disetujui
        </span>
        {isBorrowed && (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            Pinjam Cuti
          </span>
        )}
      </div>
    );
  }
  return (
    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-rose-100 text-rose-800">
      Ditolak
    </span>
  );
}

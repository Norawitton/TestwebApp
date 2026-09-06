import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center gap-4 bg-ag-offwhite px-8 text-center">
      <Mascot pose="worried" size={100} />
      <h1 className="text-xl font-bold text-ag-navy">ไม่พบหน้านี้</h1>
      <p className="text-sm text-ag-text-secondary">
        หน้าที่คุณกำลังหาอาจถูกย้ายหรือไม่มีอยู่จริง
      </p>
      <Link
        href="/home"
        className="mt-2 rounded-2xl bg-ag-blue px-6 py-3 text-sm font-bold text-white active:opacity-80"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  );
}

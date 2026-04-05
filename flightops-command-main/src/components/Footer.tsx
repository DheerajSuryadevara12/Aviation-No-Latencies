export function Footer() {
  return (
    <footer
      className="relative bg-[#0b0b0d] border-t-[1.5px] border-[#e01818] mt-[48px]"
      style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.18)' }}
    >
      {/* Red shimmer line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #e01818, #ff5555, #e01818, transparent)' }}
      />

      {/* Inner bar */}
      <div className="max-w-[1400px] mx-auto px-[30px] py-[14px] flex items-center justify-center">
        <p className="font-['DM_Sans'] text-[12px] text-white tracking-[0.3px]">
          &copy; 2026 <span className="text-[#e01818] font-[600]">NforceOne</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

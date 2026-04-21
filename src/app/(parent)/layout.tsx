export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 md:bg-gradient-to-br md:from-gray-100 md:via-gray-50 md:to-gray-100 md:flex md:items-start md:justify-center md:py-8 md:px-4">
      <div className="w-full md:max-w-[430px] md:min-h-[calc(100vh-4rem)] md:rounded-[2.5rem] md:shadow-2xl md:shadow-black/10 md:border md:border-gray-200/60 md:overflow-hidden md:bg-white md:relative">
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-2xl z-30" />
        {children}
      </div>
    </div>
  );
}

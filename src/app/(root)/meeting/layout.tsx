function MeetingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 h-[calc(100vh-4rem)] overflow-hidden sm:-mx-6 lg:-mx-8">
      {children}
    </div>
  );
}

export default MeetingLayout;

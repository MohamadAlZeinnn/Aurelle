export function DraftNotice({
  children = "This page is a draft template. Items in [brackets] must be completed and the text reviewed before launch.",
}: {
  children?: React.ReactNode;
}) {
  return (
    <p className="mb-10 border border-dashed border-clay/50 bg-linen/60 px-5 py-4 text-sm text-clay">
      <span className="mr-2 font-medium tracking-[0.16em] uppercase">Draft</span>
      {children}
    </p>
  );
}

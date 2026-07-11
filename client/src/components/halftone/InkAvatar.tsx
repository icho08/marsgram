export function InkAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "size-8 text-[10px]",
    md: "size-10 text-xs",
    lg: "size-20 text-xl",
  };
  return (
    <div
      className={`${sizes[size]} grid shrink-0 place-items-center rounded-full bg-surface font-space font-bold uppercase text-ink-muted outline-1 -outline-offset-1 outline-ink/10`}
      aria-hidden="true"
    >
      {name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2)}
    </div>
  );
}

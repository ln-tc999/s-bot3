import Image from "next/image";

const IMAGE_QUALITY = 90;

export const SwapArtPanel = () => (
  <aside className="relative isolate hidden min-h-112 overflow-hidden rounded-2xl shadow-glass lg:block">
    <Image
      src="/assets/cat-ui-bg.jpg"
      alt=""
      fill
      quality={IMAGE_QUALITY}
      sizes="20rem"
      className="object-cover object-top"
    />
    <div
      aria-hidden
      className="absolute inset-0 bg-linear-to-t from-ink/85 via-ink/25 to-transparent"
    />

    <div className="relative flex h-full flex-col justify-end gap-2 p-6">
      <p className="text-xs font-medium tracking-wide text-ink-inverse/70 uppercase">
        One name, whole basket
      </p>
      <p className="text-lg font-semibold leading-snug text-ink-inverse">
        Deposit once and hold every constituent.
      </p>
      <p className="text-sm leading-relaxed text-ink-inverse/80">
        Each token in the index is published as its own subname, so anyone can
        read the full composition with a standard ENS library.
      </p>
    </div>
  </aside>
);

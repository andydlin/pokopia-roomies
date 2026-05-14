import { useState } from "react";

const STORAGE_KEY = "pokopia.intro-seen";

function hasSeenIntro(): boolean {
  try {
    return !!window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

function markIntroSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export const IntroModal = () => {
  const [visible, setVisible] = useState(() => !hasSeenIntro());

  if (!visible) return null;

  const dismiss = () => {
    markIntroSeen();
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 md:items-center">
      <section className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--pk-brand)]">Welcome</p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--pk-text-primary)]">
          Plan the perfect Pokémon home
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--pk-text-desc)]">
          <li className="flex gap-2">
            <span className="mt-0.5 text-[var(--pk-brand)]">✓</span>
            Pick your Pokémon and get comfort item suggestions ranked by how well they fit your group
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-[var(--pk-brand)]">✓</span>
            Track every material you need to craft your full build
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-[var(--pk-brand)]">✓</span>
            Save multiple homes and share them with friends
          </li>
        </ul>
        <div className="mt-6">
          <button
            type="button"
            onClick={dismiss}
            className="pk-btn pk-btn-primary pk-btn-md w-full"
          >
            Start building
          </button>
        </div>
      </section>
    </div>
  );
};

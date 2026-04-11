const typeLabel = (typeId: string) =>
  typeId
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const typeThemeById: Record<string, { cardClass: string; badgeClass: string; surfaceColor: string; haloColor: string }> = {
  normal: {
    cardClass: "border-stone-400/30 bg-[linear-gradient(165deg,rgba(206,194,173,0.28),rgba(255,251,244,0.92))]",
    badgeClass: "border-stone-500/30 bg-stone-100/90 text-stone-800",
    surfaceColor: "#b5a58f",
    haloColor: "rgba(236,229,220,0.45)",
  },
  fire: {
    cardClass: "border-orange-500/30 bg-[linear-gradient(165deg,rgba(251,146,60,0.28),rgba(255,251,244,0.92))]",
    badgeClass: "border-orange-500/30 bg-orange-100/90 text-orange-900",
    surfaceColor: "#f18c57",
    haloColor: "rgba(255,216,186,0.38)",
  },
  water: {
    cardClass: "border-sky-500/30 bg-[linear-gradient(165deg,rgba(56,189,248,0.26),rgba(255,251,244,0.92))]",
    badgeClass: "border-sky-500/30 bg-sky-100/90 text-sky-900",
    surfaceColor: "#4db7d3",
    haloColor: "rgba(166,224,236,0.42)",
  },
  electric: {
    cardClass: "border-amber-400/35 bg-[linear-gradient(165deg,rgba(250,204,21,0.30),rgba(255,251,244,0.92))]",
    badgeClass: "border-amber-500/30 bg-amber-100/90 text-amber-900",
    surfaceColor: "#f2c94c",
    haloColor: "rgba(255,240,184,0.42)",
  },
  grass: {
    cardClass: "border-emerald-500/30 bg-[linear-gradient(165deg,rgba(74,222,128,0.26),rgba(255,251,244,0.92))]",
    badgeClass: "border-emerald-500/30 bg-emerald-100/90 text-emerald-900",
    surfaceColor: "#6ac28a",
    haloColor: "rgba(197,237,207,0.38)",
  },
  ice: {
    cardClass: "border-cyan-400/30 bg-[linear-gradient(165deg,rgba(103,232,249,0.28),rgba(255,251,244,0.92))]",
    badgeClass: "border-cyan-500/30 bg-cyan-100/90 text-cyan-900",
    surfaceColor: "#7fcfe0",
    haloColor: "rgba(210,245,251,0.42)",
  },
  fighting: {
    cardClass: "border-red-600/30 bg-[linear-gradient(165deg,rgba(248,113,113,0.24),rgba(255,251,244,0.92))]",
    badgeClass: "border-red-600/30 bg-red-100/90 text-red-900",
    surfaceColor: "#d06f6f",
    haloColor: "rgba(242,195,195,0.38)",
  },
  poison: {
    cardClass: "border-fuchsia-500/30 bg-[linear-gradient(165deg,rgba(217,70,239,0.22),rgba(255,251,244,0.92))]",
    badgeClass: "border-fuchsia-500/30 bg-fuchsia-100/90 text-fuchsia-900",
    surfaceColor: "#ba79cf",
    haloColor: "rgba(226,196,236,0.38)",
  },
  ground: {
    cardClass: "border-amber-700/25 bg-[linear-gradient(165deg,rgba(217,119,6,0.22),rgba(255,251,244,0.92))]",
    badgeClass: "border-amber-700/30 bg-amber-100/90 text-amber-900",
    surfaceColor: "#c89d6d",
    haloColor: "rgba(234,215,191,0.38)",
  },
  flying: {
    cardClass: "border-indigo-400/30 bg-[linear-gradient(165deg,rgba(129,140,248,0.24),rgba(255,251,244,0.92))]",
    badgeClass: "border-indigo-500/30 bg-indigo-100/90 text-indigo-900",
    surfaceColor: "#8aa4e7",
    haloColor: "rgba(210,220,248,0.38)",
  },
  psychic: {
    cardClass: "border-pink-500/30 bg-[linear-gradient(165deg,rgba(244,114,182,0.24),rgba(255,251,244,0.92))]",
    badgeClass: "border-pink-500/30 bg-pink-100/90 text-pink-900",
    surfaceColor: "#d685af",
    haloColor: "rgba(241,212,226,0.38)",
  },
  bug: {
    cardClass: "border-lime-500/30 bg-[linear-gradient(165deg,rgba(132,204,22,0.24),rgba(255,251,244,0.92))]",
    badgeClass: "border-lime-500/30 bg-lime-100/90 text-lime-900",
    surfaceColor: "#8fbe62",
    haloColor: "rgba(219,236,201,0.38)",
  },
  rock: {
    cardClass: "border-yellow-700/25 bg-[linear-gradient(165deg,rgba(202,138,4,0.22),rgba(255,251,244,0.92))]",
    badgeClass: "border-yellow-700/30 bg-yellow-100/90 text-yellow-900",
    surfaceColor: "#b59662",
    haloColor: "rgba(225,214,194,0.38)",
  },
  ghost: {
    cardClass: "border-violet-500/30 bg-[linear-gradient(165deg,rgba(167,139,250,0.26),rgba(255,251,244,0.92))]",
    badgeClass: "border-violet-500/30 bg-violet-100/90 text-violet-900",
    surfaceColor: "#9072c6",
    haloColor: "rgba(210,196,237,0.4)",
  },
  dragon: {
    cardClass: "border-purple-600/30 bg-[linear-gradient(165deg,rgba(147,51,234,0.20),rgba(255,251,244,0.92))]",
    badgeClass: "border-purple-600/30 bg-purple-100/90 text-purple-900",
    surfaceColor: "#8b67cf",
    haloColor: "rgba(211,196,238,0.4)",
  },
  dark: {
    cardClass: "border-slate-700/30 bg-[linear-gradient(165deg,rgba(71,85,105,0.28),rgba(255,251,244,0.92))]",
    badgeClass: "border-slate-700/30 bg-slate-100/90 text-slate-900",
    surfaceColor: "#6f8197",
    haloColor: "rgba(199,210,222,0.36)",
  },
  steel: {
    cardClass: "border-zinc-500/30 bg-[linear-gradient(165deg,rgba(113,113,122,0.24),rgba(255,251,244,0.92))]",
    badgeClass: "border-zinc-500/30 bg-zinc-100/90 text-zinc-900",
    surfaceColor: "#909ba8",
    haloColor: "rgba(218,222,228,0.38)",
  },
  fairy: {
    cardClass: "border-rose-400/30 bg-[linear-gradient(165deg,rgba(251,113,133,0.22),rgba(255,251,244,0.92))]",
    badgeClass: "border-rose-400/30 bg-rose-100/90 text-rose-900",
    surfaceColor: "#d99db1",
    haloColor: "rgba(243,219,227,0.4)",
  },
};

const defaultTheme = {
  cardClass: "border-ink/10 bg-white/75",
  badgeClass: "border-ink/20 bg-white/80 text-ink/80",
  surfaceColor: "#68b8cd",
  haloColor: "rgba(177,227,237,0.42)",
};

export const getPokemonTypeTheme = (typeId?: string | null) => {
  if (!typeId) {
    return {
      typeLabel: "Unknown",
      ...defaultTheme,
    };
  }

  return {
    typeLabel: typeLabel(typeId),
    ...(typeThemeById[typeId] ?? defaultTheme),
  };
};

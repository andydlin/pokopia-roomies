const TRAIT_RULES: Array<{ id: string; patterns: RegExp[] }> = [
  {
    id: "bright",
    patterns: [
      /\bbright\b/i,
      /\blight\b/i,
      /\billuminat/i,
      /\bsun(ny)?\b/i,
      /\bsparkl/i,
      /\bflower/i,
      /\bgarden/i,
      /\bcolorful/i,
      /\byellow\b/i,
    ],
  },
  {
    id: "dark",
    patterns: [/\bdark\b/i, /\bgrave\b/i, /\bshadow/i, /\bspooky\b/i, /\bnight\b/i, /\bshade\b/i],
  },
  {
    id: "humid",
    patterns: [
      /\bwater/i,
      /\bwaterfall/i,
      /\bhydrat/i,
      /\bwet\b/i,
      /\bdamp\b/i,
      /\bsea(side)?\b/i,
      /\bbeach\b/i,
      /\bocean\b/i,
      /\brain\b/i,
      /\bbath/i,
      /\bshower\b/i,
      /\bsink\b/i,
      /\bbasin\b/i,
      /\baquarium\b/i,
    ],
  },
  {
    id: "dry",
    patterns: [/\bdry\b/i, /\bdesert\b/i, /\barid\b/i, /\bdust/i, /\bsand/i, /\bwasteland/i],
  },
  {
    id: "warm",
    patterns: [
      /\bwarm\b/i,
      /\bfire\b/i,
      /\bcampfire\b/i,
      /\bbonfire\b/i,
      /\bspicy\b/i,
      /\bheated\b/i,
      /\btropical/i,
      /\bstove\b/i,
      /\bbarbecue\b/i,
    ],
  },
  {
    id: "cool",
    patterns: [
      /\bcool\b/i,
      /\bbreeze/i,
      /\belevat/i,
      /\bice\b/i,
      /\bsnow/i,
      /\bshade/i,
      /\bair conditioner\b/i,
      /\bwind/i,
    ],
  },
  {
    id: "lively",
    patterns: [
      /\blively\b/i,
      /\bparty\b/i,
      /\bpicnic\b/i,
      /\bcamp(site)?\b/i,
      /\bdining\b/i,
      /\bgather/i,
      /\btraining\b/i,
      /\bexercise\b/i,
      /\bgame\b/i,
      /\bplay\b/i,
      /\bfield-trip\b/i,
      /\bgroup\b/i,
      /\bride(s)?\b/i,
    ],
  },
  {
    id: "quiet",
    patterns: [/\bquiet\b/i, /\brest\b/i, /\bpeace/i, /\bcalm\b/i, /\bnap\b/i, /\brelax/i, /\bgrave\b/i],
  },
];

export const inferHabitatTraitIds = (...fragments: Array<string | null | undefined>) => {
  const searchableText = fragments.filter(Boolean).join(" ").toLowerCase();
  const matchedTraitIds = TRAIT_RULES.filter((rule) =>
    rule.patterns.some((pattern) => pattern.test(searchableText)),
  ).map((rule) => rule.id);

  return [...new Set(matchedTraitIds)].sort((left, right) => left.localeCompare(right));
};

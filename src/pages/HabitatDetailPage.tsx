import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SectionCard } from "../components/common/SectionCard";
import { HabitatDetailContent } from "../components/habitats/HabitatDetailContent";
import { habitatById } from "../data/habitats";

interface HabitatDetailPageProps {
  asModal?: boolean;
}

const decodeFromParam = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch {
    return fallback;
  }
};

export const HabitatDetailPage = ({ asModal = false }: HabitatDetailPageProps) => {
  const { habitatId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const habitat = habitatId ? habitatById.get(habitatId) ?? null : null;
  const fromPath = decodeFromParam(searchParams.get("from"), "/habitats");

  const detailBody = habitat ? (
    <HabitatDetailContent habitat={habitat} />
  ) : (
    <p className="type-body mt-3 text-ink/70">Habitat not found.</p>
  );

  if (asModal) {
    return (
      <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-3 md:items-center" onClick={() => navigate(-1)}>
        <section
          className="max-h-[88vh] w-full max-w-[760px] overflow-auto rounded-[1.8rem] border border-white/70 bg-paper p-5 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="type-overline text-moss/60">Habitat Details</p>
              <h3 className="type-h2 mt-1 text-ink">{habitat?.name ?? "Unknown habitat"}</h3>
              <p className="type-caption mt-1 text-ink/65">{habitat ? `#${habitat.number}` : "Unknown"}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="type-ui rounded-full border border-ink/10 bg-white/90 px-3 py-1 text-ink/80"
            >
              Close
            </button>
          </div>
          {detailBody}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        to={fromPath}
        className="type-ui inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/85 px-4 py-2 text-ink/80 transition hover:border-moss/35"
      >
        Back to habitats
      </Link>
      <SectionCard eyebrow="Habitat Details" title={habitat?.name ?? "Unknown habitat"} description={habitat ? `#${habitat.number}` : "Unknown habitat"}>
        {detailBody}
      </SectionCard>
    </div>
  );
};

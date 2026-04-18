import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, beforeEach } from "vitest";
import { App } from "../app/App";
import { BuildersPage } from "../pages/BuildersPage";
import { HabitatDetailPage } from "../pages/HabitatDetailPage";
import { HabitatsPage } from "../pages/HabitatsPage";
import { ItemDetailPage } from "../pages/ItemDetailPage";
import { ItemsPage } from "../pages/ItemsPage";
import { LookupPage } from "../pages/LookupPage";
import { PokemonDetailPage } from "../pages/PokemonDetailPage";
import { ComparePage } from "../pages/ComparePage";
import { persistSavedTeams } from "../lib/storage";
import { habitats } from "../data/habitats";
import { items } from "../data/items";

const LocationDisplay = () => {
  const location = useLocation();
  return <p data-testid="location-display">{`${location.pathname}${location.search}`}</p>;
};

describe("feature pages", () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("shows live Roomies results after selecting Pokemon", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/builder"]}>
        <BuildersPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Pikachu/i }));
    await user.click(screen.getByRole("button", { name: /Meowth/i }));

    expect(screen.getByText(/Build your group/i)).toBeInTheDocument();
    expect(screen.getByText(/^Your Group$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ideal habitat:/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Leaning toward/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Shared by everyone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Try these favorites and items/i)).not.toBeInTheDocument();
  });

  it("renders combined reverse lookup results", () => {
    render(
      <MemoryRouter initialEntries={["/lookup"]}>
        <LookupPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Reverse Lookup/i)).toBeInTheDocument();
    expect(screen.getByText(/Start from a constraint/i)).toBeInTheDocument();
  });

  it("shows ranked teammate suggestions on a pokemon detail page", () => {
    render(
      <MemoryRouter initialEntries={["/pokemon/pikachu"]}>
        <Routes>
          <Route path="/pokemon/:slug" element={<PokemonDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Best teammate candidates for Pikachu/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Pair score/i).length).toBeGreaterThan(0);
  });

  it("renders compare view when two teams are saved", () => {
    persistSavedTeams([
      {
        id: "team-1",
        name: "Sunny squad",
        pokemonIds: ["pikachu", "meowth"],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "team-2",
        name: "Cozy growers",
        pokemonIds: ["bulbasaur", "snorlax"],
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/compare?left=team-1&right=team-2"]}>
        <ComparePage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Sunny squad").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cozy growers").length).toBeGreaterThan(0);
  });

  it("initializes /items filters from URL params", () => {
    render(
      <MemoryRouter initialEntries={["/items?q=ore&generalCategory=materials&comfortCategory=all"]}>
        <ItemsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/^All items \(/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search items/i)).toHaveValue("ore");
    expect(screen.getByDisplayValue(/materials/i)).toBeInTheDocument();
    expect(screen.getAllByDisplayValue(/all comfort tags/i).length).toBeGreaterThan(0);
  });

  it("initializes /habitats search from URL params", () => {
    render(
      <MemoryRouter initialEntries={["/habitats?q=tree"]}>
        <HabitatsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/^All habitats \(/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search habitats/i)).toHaveValue("tree");
  });

  it("renders item detail standalone on direct route visit", () => {
    const itemId = items[0]?.id;
    expect(itemId).toBeDefined();

    render(
      <MemoryRouter initialEntries={[`/items/${itemId}`]}>
        <Routes>
          <Route path="/items/:itemId" element={<ItemDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Back to items/i)).toBeInTheDocument();
    expect(screen.getByText(/Item Details/i)).toBeInTheDocument();
  });

  it("renders habitat detail standalone on direct route visit", () => {
    const habitatId = habitats[0]?.id;
    expect(habitatId).toBeDefined();

    render(
      <MemoryRouter initialEntries={[`/habitats/${habitatId}`]}>
        <Routes>
          <Route path="/habitats/:habitatId" element={<HabitatDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Back to habitats/i)).toBeInTheDocument();
    expect(screen.getByText(/Habitat Details/i)).toBeInTheDocument();
  });

  it("preserves exact list URL state when opening and closing item modal from /items", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/items?q=ore&generalCategory=materials&comfortCategory=all"]}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );

    const oreLink = screen.getByRole("link", { name: /copper ore/i });
    await user.click(oreLink);

    expect(screen.getByText(/Item Details/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.getByTestId("location-display")).toHaveTextContent(
      "/items?q=ore&generalCategory=materials&comfortCategory=all",
    );
    expect(screen.getByPlaceholderText(/Search items/i)).toHaveValue("ore");
  });

  it("item detail links used-in-habitats to canonical habitat detail routes", () => {
    const itemUsedInHabitat = items.find((item) =>
      habitats.some((habitat) => (habitat.requiredItems ?? []).some((requirement) => requirement.itemId === item.id)),
    );
    expect(itemUsedInHabitat).toBeDefined();

    render(
      <MemoryRouter initialEntries={[`/items/${itemUsedInHabitat!.id}`]}>
        <Routes>
          <Route path="/items/:itemId" element={<ItemDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const habitatLinks = screen
      .getAllByRole("link")
      .filter((link) => (link.getAttribute("href") ?? "").includes("/habitats/"));
    expect(habitatLinks.length).toBeGreaterThan(0);
  });

  it("habitat detail links required items to canonical item detail routes", () => {
    const habitatWithItem = habitats.find((habitat) => (habitat.requiredItems ?? []).length > 0);
    expect(habitatWithItem).toBeDefined();

    render(
      <MemoryRouter initialEntries={[`/habitats/${habitatWithItem!.id}`]}>
        <Routes>
          <Route path="/habitats/:habitatId" element={<HabitatDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const itemLinks = screen
      .getAllByRole("link")
      .filter((link) => (link.getAttribute("href") ?? "").includes("/items/"));
    expect(itemLinks.length).toBeGreaterThan(0);
  });
});

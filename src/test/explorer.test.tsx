import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { pokemonExplorerEntries } from "../data/pokemonExplorer";
import {
  filterExplorerEntries,
  getCompatibilityPotential,
  getRelatedPokemon,
  matchesExplorerSearch,
  sortExplorerEntries,
} from "../lib/pokemonExplorer";
import { DexPage } from "../pages/DexPage";
import { PokemonDetailPage } from "../pages/PokemonDetailPage";

describe("explorer utilities", () => {
  it("searches across name and metadata fields", () => {
    expect(matchesExplorerSearch(pokemonExplorerEntries[0], pokemonExplorerEntries[0].name)).toBe(true);
    expect(matchesExplorerSearch(pokemonExplorerEntries[0], pokemonExplorerEntries[0].idealHabitat)).toBe(true);
  });

  it("supports combined filtering", () => {
    const results = filterExplorerEntries(pokemonExplorerEntries, {
      query: "",
      favorites: ["Luxury"],
      idealHabitats: [],
      specialties: ["Trade"],
    });
    expect(results.map((entry) => entry.slug)).toEqual(expect.arrayContaining(["meowth", "persian"]));
  });

  it("sorts by compatibility potential descending", () => {
    const results = sortExplorerEntries(pokemonExplorerEntries, "compatibility-potential-desc");
    expect(results[0].compatibilityPotential).toBeGreaterThanOrEqual(results[1].compatibilityPotential);
  });

  it("builds related pokemon from shared favorites and habitat", () => {
    const pikachu = pokemonExplorerEntries.find((entry) => entry.slug === "pikachu")!;
    const related = getRelatedPokemon(pikachu);
    expect(related.length).toBeGreaterThan(0);
    expect(getCompatibilityPotential(pikachu)).toBeGreaterThan(0);
  });
});

describe("advanced explorer UI", () => {
  it("renders the explorer page with filters and results", () => {
    render(
      <MemoryRouter initialEntries={["/dex"]}>
        <DexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Advanced Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/Pokemon matched/i)).toBeInTheDocument();
  });

  it("shows an empty state when filters remove all results", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/dex"]}>
        <DexPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getAllByPlaceholderText(/Search name, number, habitat, specialty, favorites, tags/i)[0],
      "zzzz-no-match",
    );

    expect(screen.getByText(/No Pokemon matched/i)).toBeInTheDocument();
  });

  it("renders explorer-rich pokemon detail content", () => {
    render(
      <MemoryRouter initialEntries={["/pokemon/pikachu"]}>
        <Routes>
          <Route path="/pokemon/:slug" element={<PokemonDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Favorite item categories/i)).toBeInTheDocument();
    expect(screen.getByText(/Other useful planning matches for Pikachu/i)).toBeInTheDocument();
  });
});

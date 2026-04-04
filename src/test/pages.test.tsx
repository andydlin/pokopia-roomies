import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, beforeEach } from "vitest";
import { ItemsPage } from "../pages/ItemsPage";
import { LookupPage } from "../pages/LookupPage";
import { PokemonDetailPage } from "../pages/PokemonDetailPage";
import { ComparePage } from "../pages/ComparePage";
import { persistSavedTeams } from "../lib/storage";

describe("feature pages", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows live optimizer results after selecting Pokemon", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/items"]}>
        <ItemsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Pikachu/i }));
    await user.click(screen.getByRole("button", { name: /Meowth/i }));

    expect(screen.getByText(/Compatibility snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Best favorite categories for this draft/i)).toBeInTheDocument();
    expect(screen.getByText(/Concrete items with the best coverage/i)).toBeInTheDocument();
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
});

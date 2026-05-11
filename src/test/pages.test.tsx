import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../app/App";

const LocationDisplay = () => {
  const location = useLocation();
  return <p data-testid="location-display">{`${location.pathname}${location.search}`}</p>;
};

describe("home builder routing and navigation", () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("redirects root to /builder and keeps builder always accessible", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("location-display")[0]).toHaveTextContent("/builder/pokemon");
    });

    expect(screen.getAllByText(/home builder/i).length).toBeGreaterThan(0);
  });

  it("preserves URL-backed search state for item browsing", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/items?q=ore&mode=all"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search items/i)).toHaveValue("ore");
    });
  });

  it("keeps tab selection from the current builder route", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/items"]}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("location-display")[0]).toHaveTextContent("/builder/items");
    });
    expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
  });

  it("switches browse tabs without bouncing back to another tab", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/pokemon"]}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search pokemon/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Items" }));

    await waitFor(() => {
      expect(screen.getAllByTestId("location-display")[0]).toHaveTextContent("/builder/items");
    });
    expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
  });

  it("shows transition skeleton on tab switch and resolves to the final rapid-clicked tab", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/pokemon"]}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search pokemon/i)).toBeInTheDocument();
    });

    const pane = screen.getByTestId("builder-results-pane");
    expect(pane).toHaveAttribute("aria-busy", "false");

    fireEvent.click(screen.getByRole("button", { name: "Items" }));
    fireEvent.click(screen.getByRole("button", { name: /Review Materials/i }));

    expect(screen.getByTestId("builder-results-skeleton")).toBeInTheDocument();
    expect(pane).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByTestId("location-display")[0]).toHaveTextContent("/builder/pokemon");

    await waitFor(() => {
      expect(screen.getAllByTestId("location-display")[0]).toHaveTextContent("/builder/favorites");
    });
    expect(screen.queryByTestId("builder-results-skeleton")).not.toBeInTheDocument();
    expect(pane).toHaveAttribute("aria-busy", "false");
    expect(screen.getByPlaceholderText(/search favorites items/i)).toBeInTheDocument();
  });

  it("opens item details overlay from item card click and syncs URL detail param", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/items"]}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
    });

    const firstCard = document.querySelector("article[role='button']");
    expect(firstCard).toBeTruthy();
    fireEvent.click(firstCard as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText(/item details/i)).toBeInTheDocument();
    });
    expect(screen.getAllByTestId("location-display")[0].textContent).toMatch(/\/builder\/items\?.*detail=/);
  }, 10000);

  it("keeps Add independent from details on item cards", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/items"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
    });

    const firstCard = document.querySelector("article[role='button']");
    expect(firstCard).toBeTruthy();

    const addButton = within(firstCard as HTMLElement).getByRole("button", { name: "Add" });
    fireEvent.click(addButton);

    expect(screen.queryByText(/item details/i)).not.toBeInTheDocument();
  });

  it("adds pokemon from pokemon card click", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/pokemon"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search pokemon/i)).toBeInTheDocument();
    });

    const firstCard = document.querySelector("article[role='button']");
    expect(firstCard).toBeTruthy();
    expect(screen.getByText(/pokemon\s*\(0\)/i)).toBeInTheDocument();
    fireEvent.click(firstCard as HTMLElement);
    await waitFor(() => {
      expect(screen.getByText(/pokemon\s*\(1\)/i)).toBeInTheDocument();
    });
  });

  it("adds pokemon immediately when tapping a pokemon card", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/pokemon"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search pokemon/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/pokemon\s*\(0\)/i)).toBeInTheDocument();

    const firstCard = document.querySelector("article[role='button']");
    expect(firstCard).toBeTruthy();
    fireEvent.click(firstCard as HTMLElement);
    await waitFor(() => {
      expect(screen.getByText(/pokemon\s*\(1\)/i)).toBeInTheDocument();
    });
  });

  it("shows preferred habitat on pokemon cards and selected pokemon entries", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/pokemon"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search pokemon/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/bright/i).length).toBeGreaterThan(0);

    const firstCard = document.querySelector("article[role='button']");
    expect(firstCard).toBeTruthy();
    fireEvent.click(firstCard as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText(/pokemon\s*\(1\)/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/preferred habitat:/i).length).toBeGreaterThan(0);
  });

  it("opens item details overlay from favorites tab card click", async () => {
    render(
      <MemoryRouter initialEntries={["/builder/favorites"]}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search favorites items/i)).toBeInTheDocument();
    });

    const firstCard = document.querySelector("article[role='button']");
    expect(firstCard).toBeTruthy();
    fireEvent.click(firstCard as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText(/item details/i)).toBeInTheDocument();
    });

    expect(screen.getAllByTestId("location-display")[0].textContent).toMatch(/\/builder\/favorites\?.*detail=/);
  });

  it("opens pokedex pokemon details from card click without inline add button", async () => {
    render(
      <MemoryRouter initialEntries={["/pokedex/pokemon"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search pokemon/i)).toBeInTheDocument();
    });

    const firstCard = document.querySelector("article[role='button']");
    expect(firstCard).toBeTruthy();
    expect(within(firstCard as HTMLElement).queryByRole("button", { name: /add to home/i })).not.toBeInTheDocument();

    fireEvent.click(firstCard as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText(/pokemon details/i)).toBeInTheDocument();
    });
  });

});

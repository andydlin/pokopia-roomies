import { beforeEach, describe, expect, it } from "vitest";
import { makeEmptyCurrentHome } from "../domain/home-builder/logic";
import { localSessionAdapter } from "../lib/storage/localSessionAdapter";
import { createInitialHomeBuilderState, homeBuilderReducer } from "../features/home-builder/state/homeBuilderReducer";

describe("local session persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads versioned session payloads", () => {
    localSessionAdapter.save({
      version: 1,
      currentHome: {
        ...makeEmptyCurrentHome(),
        pokemonIds: ["pikachu"],
      },
      savedHomes: [],
      exportedAt: 123,
    });

    const loaded = localSessionAdapter.load();
    expect(loaded?.version).toBe(1);
    expect(loaded?.currentHome?.pokemonIds).toEqual(["pikachu"]);
  });
});

describe("saved home reducer actions", () => {
  it("supports save, duplicate, rename, and delete", () => {
    let state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
        name: "Starter Home",
        pokemonIds: ["pikachu"],
      },
    });

    state = homeBuilderReducer(state, { type: "saved/save-current" });
    const savedId = state.currentHome.id;
    expect(savedId).toBeTruthy();

    state = homeBuilderReducer(state, { type: "saved/duplicate", homeId: savedId! });
    expect(state.savedHomes.allIds.length).toBe(2);

    state = homeBuilderReducer(state, { type: "saved/rename", homeId: savedId!, name: "Renamed Home" });
    expect(state.savedHomes.byId[savedId!].name).toBe("Renamed Home");

    state = homeBuilderReducer(state, { type: "saved/delete", homeId: savedId! });
    expect(state.savedHomes.byId[savedId!]).toBeUndefined();
  });
});

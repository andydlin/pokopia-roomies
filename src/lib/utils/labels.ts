import { favoriteCategoryById } from "../../data/favoriteCategories";
import { habitatTraitById } from "../../data/habitatTraits";
import { itemById } from "../../data/items";
import { locationById } from "../../data/locations";
import { specialtyById } from "../../data/specialties";

export const getFavoriteCategoryName = (categoryId: string) =>
  favoriteCategoryById.get(categoryId)?.name ?? categoryId;

export const getHabitatTraitLabel = (traitId: string) =>
  habitatTraitById.get(traitId)?.label ?? traitId;

export const getItemName = (itemId: string) => itemById.get(itemId)?.name ?? itemId;

export const getSpecialtyName = (specialtyId: string) =>
  specialtyById.get(specialtyId)?.name ?? specialtyId;

export const getLocationName = (locationId: string) => locationById.get(locationId)?.name ?? locationId;

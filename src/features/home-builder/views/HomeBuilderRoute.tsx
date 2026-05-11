import { HomeBuilderProvider } from "../state/HomeBuilderContext";
import { HomeBuilderPage } from "./HomeBuilderPage";

export const HomeBuilderRoute = () => (
  <HomeBuilderProvider>
    <HomeBuilderPage />
  </HomeBuilderProvider>
);

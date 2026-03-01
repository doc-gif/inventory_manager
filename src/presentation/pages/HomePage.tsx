import { InventoryList } from "@/presentation/components/InventoryList";
import React from "react";
import {SeedDataBanner} from "@/presentation/pages/SeedData";

export function HomePage() {
  return (
      <>
        <SeedDataBanner />
        <InventoryList />
      </>
  );
}

export {
  createRepresentativeProjectFixture,
  REPRESENTATIVE_FIXTURE_ID,
  REPRESENTATIVE_FIXTURE_VERSION,
  REPRESENTATIVE_PLANNER_SCALE_PX_PER_MM,
  representativeProjectFixture,
  validateRepresentativeProjectFixture,
  type FixturePointMm,
  type RepresentativeFabricObject,
  type RepresentativeFurnitureDimensions,
  type RepresentativeFurnitureObject,
  type RepresentativePersistedProject,
  type RepresentativeProjectFixture,
  type RepresentativeProjectMetadata,
  type RepresentativeRoomBoundary,
} from "../../../plans/audit/28-canvas-features-logic/representativeProjectFixture";

import {
  createRepresentativeProjectFixture,
  representativeProjectFixture,
  validateRepresentativeProjectFixture,
} from "../../../plans/audit/28-canvas-features-logic/representativeProjectFixture";

const fixtureIssues = validateRepresentativeProjectFixture(
  representativeProjectFixture,
);
if (fixtureIssues.length > 0) {
  throw new Error(
    `Invalid Planner performance test fixture:\n${fixtureIssues.join("\n")}`,
  );
}

/** Returns a deterministic deep clone so one measurement cannot mutate another. */
export function createRepresentativeProjectTestFixture() {
  return createRepresentativeProjectFixture();
}

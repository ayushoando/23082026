export const REPRESENTATIVE_FIXTURE_ID =
  "planner-representative-project-v1" as const;
export const REPRESENTATIVE_FIXTURE_VERSION = 1 as const;
export const REPRESENTATIVE_PLANNER_SCALE_PX_PER_MM = 0.05 as const;

export interface FixturePointMm {
  x: number;
  y: number;
}

export interface RepresentativeRoomBoundary {
  id: string;
  kind: "room-boundary";
  label: string;
  widthMm: number;
  depthMm: number;
  wallThicknessMm: number;
  pointsMm: readonly FixturePointMm[];
  metadata: Readonly<Record<string, string | number | boolean>>;
}

export interface RepresentativeFurnitureDimensions {
  widthMm: number;
  depthMm: number;
  heightMm: number;
}

export interface RepresentativeFurnitureObject {
  id: string;
  catalogId: string;
  kind: "furniture";
  label: string;
  positionMm: FixturePointMm;
  rotationDeg: number;
  dimensions: RepresentativeFurnitureDimensions;
  metadata: Readonly<Record<string, string | number | boolean>>;
}

export interface RepresentativeProjectMetadata {
  fixtureVersion: typeof REPRESENTATIVE_FIXTURE_VERSION;
  schemaVersion: 1;
  revision: number;
  status: "active";
  projectCode: string;
  unitSystem: "mm";
  seatTarget: number;
  createdAt: string;
  updatedAt: string;
  tags: readonly string[];
}

export interface RepresentativeFabricObject {
  type: "Polygon" | "Rect";
  version: "7.4.0";
  originX: "left";
  originY: "top";
  left: number;
  top: number;
  width?: number;
  height?: number;
  angle: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeUniform: true;
  points?: readonly FixturePointMm[];
  data: Readonly<Record<string, unknown>>;
}

export interface RepresentativePersistedProject {
  id: string;
  name: string;
  objects_count: number;
  created_at: string;
  updated_at: string;
  canvas_json: {
    version: "7.4.0";
    background: "#FFFFFF";
    objects: readonly RepresentativeFabricObject[];
  };
  sheet: {
    width_mm: number;
    height_mm: number;
    unit: "mm";
    scale_px_per_mm: typeof REPRESENTATIVE_PLANNER_SCALE_PX_PER_MM;
  };
  layers: readonly {
    id: string;
    label: string;
    visible: boolean;
    locked: boolean;
  }[];
  metadata: RepresentativeProjectMetadata;
}

export interface RepresentativeProjectFixture {
  fixtureId: typeof REPRESENTATIVE_FIXTURE_ID;
  fixtureVersion: typeof REPRESENTATIVE_FIXTURE_VERSION;
  name: string;
  plannerScalePxPerMm: typeof REPRESENTATIVE_PLANNER_SCALE_PX_PER_MM;
  roomBoundary: RepresentativeRoomBoundary;
  furniture: readonly RepresentativeFurnitureObject[];
  metadata: RepresentativeProjectMetadata;
  persistedProject: RepresentativePersistedProject;
}

const ROOM_BOUNDARY: RepresentativeRoomBoundary = {
  id: "room-main",
  kind: "room-boundary",
  label: "Representative open office",
  widthMm: 12_000,
  depthMm: 8_000,
  wallThicknessMm: 150,
  pointsMm: [
    { x: 0, y: 0 },
    { x: 12_000, y: 0 },
    { x: 12_000, y: 8_000 },
    { x: 0, y: 8_000 },
  ],
  metadata: {
    boundaryType: "enclosed-room",
    usableAreaSquareMetres: 96,
    externalWall: false,
  },
};

const FURNITURE: readonly RepresentativeFurnitureObject[] = [
  {
    id: "fixture-workstation-01",
    catalogId: "fixture-catalog-workstation-1600",
    kind: "furniture",
    label: "Workstation A",
    positionMm: { x: 800, y: 900 },
    rotationDeg: 0,
    dimensions: { widthMm: 1_600, depthMm: 800, heightMm: 750 },
    metadata: {
      category: "workstation",
      collection: "Axis",
      finish: "oak-white",
      seats: 1,
    },
  },
  {
    id: "fixture-workstation-02",
    catalogId: "fixture-catalog-workstation-1600",
    kind: "furniture",
    label: "Workstation B",
    positionMm: { x: 3_000, y: 900 },
    rotationDeg: 180,
    dimensions: { widthMm: 1_600, depthMm: 800, heightMm: 750 },
    metadata: {
      category: "workstation",
      collection: "Axis",
      finish: "oak-white",
      seats: 1,
    },
  },
  {
    id: "fixture-task-chair-01",
    catalogId: "fixture-catalog-task-chair",
    kind: "furniture",
    label: "Task chair A",
    positionMm: { x: 1_250, y: 2_050 },
    rotationDeg: 15,
    dimensions: { widthMm: 620, depthMm: 620, heightMm: 1_050 },
    metadata: {
      category: "seating",
      collection: "Ergo",
      finish: "graphite",
      adjustable: true,
    },
  },
  {
    id: "fixture-task-chair-02",
    catalogId: "fixture-catalog-task-chair",
    kind: "furniture",
    label: "Task chair B",
    positionMm: { x: 3_450, y: 2_050 },
    rotationDeg: 345,
    dimensions: { widthMm: 620, depthMm: 620, heightMm: 1_050 },
    metadata: {
      category: "seating",
      collection: "Ergo",
      finish: "graphite",
      adjustable: true,
    },
  },
  {
    id: "fixture-meeting-table-01",
    catalogId: "fixture-catalog-meeting-table-2800",
    kind: "furniture",
    label: "Eight-person meeting table",
    positionMm: { x: 6_100, y: 1_450 },
    rotationDeg: 90,
    dimensions: { widthMm: 2_800, depthMm: 1_200, heightMm: 750 },
    metadata: {
      category: "table",
      collection: "Forum",
      finish: "walnut-black",
      seats: 8,
    },
  },
  {
    id: "fixture-meeting-chair-01",
    catalogId: "fixture-catalog-meeting-chair",
    kind: "furniture",
    label: "Meeting chair North",
    positionMm: { x: 6_300, y: 900 },
    rotationDeg: 90,
    dimensions: { widthMm: 560, depthMm: 580, heightMm: 900 },
    metadata: {
      category: "seating",
      collection: "Forum",
      finish: "navy",
      stackable: true,
    },
  },
  {
    id: "fixture-meeting-chair-02",
    catalogId: "fixture-catalog-meeting-chair",
    kind: "furniture",
    label: "Meeting chair South",
    positionMm: { x: 8_500, y: 3_050 },
    rotationDeg: 270,
    dimensions: { widthMm: 560, depthMm: 580, heightMm: 900 },
    metadata: {
      category: "seating",
      collection: "Forum",
      finish: "navy",
      stackable: true,
    },
  },
  {
    id: "fixture-storage-01",
    catalogId: "fixture-catalog-storage-1200",
    kind: "furniture",
    label: "Low storage credenza",
    positionMm: { x: 10_200, y: 650 },
    rotationDeg: 90,
    dimensions: { widthMm: 1_200, depthMm: 450, heightMm: 720 },
    metadata: {
      category: "storage",
      collection: "Archive",
      finish: "white",
      lockable: true,
    },
  },
  {
    id: "fixture-lounge-sofa-01",
    catalogId: "fixture-catalog-lounge-sofa",
    kind: "furniture",
    label: "Two-seat lounge sofa",
    positionMm: { x: 7_900, y: 5_200 },
    rotationDeg: 45,
    dimensions: { widthMm: 1_850, depthMm: 820, heightMm: 780 },
    metadata: {
      category: "lounge-seating",
      collection: "Haven",
      finish: "teal-fabric",
      seats: 2,
    },
  },
  {
    id: "fixture-coffee-table-01",
    catalogId: "fixture-catalog-coffee-table",
    kind: "furniture",
    label: "Lounge coffee table",
    positionMm: { x: 9_250, y: 6_450 },
    rotationDeg: 30,
    dimensions: { widthMm: 1_000, depthMm: 600, heightMm: 420 },
    metadata: {
      category: "table",
      collection: "Haven",
      finish: "oak-black",
      movable: true,
    },
  },
];

const PROJECT_METADATA: RepresentativeProjectMetadata = {
  fixtureVersion: REPRESENTATIVE_FIXTURE_VERSION,
  schemaVersion: 1,
  revision: 3,
  status: "active",
  projectCode: "PERF-REP-001",
  unitSystem: "mm",
  seatTarget: 12,
  createdAt: "2026-01-15T09:00:00.000Z",
  updatedAt: "2026-01-15T09:30:00.000Z",
  tags: ["deterministic", "performance", "representative-project"],
};

function mmToPx(valueMm: number): number {
  return valueMm * REPRESENTATIVE_PLANNER_SCALE_PX_PER_MM;
}

function roomBoundaryFabricObject(
  room: RepresentativeRoomBoundary,
): RepresentativeFabricObject {
  return {
    type: "Polygon",
    version: "7.4.0",
    originX: "left",
    originY: "top",
    left: 0,
    top: 0,
    angle: 0,
    fill: "#FFFFFF",
    stroke: "#1A1A1A",
    strokeWidth: 2,
    strokeUniform: true,
    points: room.pointsMm.map((point) => ({
      x: mmToPx(point.x),
      y: mmToPx(point.y),
    })),
    data: {
      id: room.id,
      kind: room.kind,
      label: room.label,
      dimensions: {
        width_mm: room.widthMm,
        depth_mm: room.depthMm,
        wall_thickness_mm: room.wallThicknessMm,
      },
      metadata: { ...room.metadata },
    },
  };
}

function furnitureFabricObject(
  item: RepresentativeFurnitureObject,
): RepresentativeFabricObject {
  return {
    type: "Rect",
    version: "7.4.0",
    originX: "left",
    originY: "top",
    left: mmToPx(item.positionMm.x),
    top: mmToPx(item.positionMm.y),
    width: mmToPx(item.dimensions.widthMm),
    height: mmToPx(item.dimensions.depthMm),
    angle: item.rotationDeg,
    fill: "#F4F0E8",
    stroke: "#1A1A1A",
    strokeWidth: 1.2,
    strokeUniform: true,
    data: {
      id: item.id,
      kind: item.kind,
      label: item.label,
      furniture_id: item.catalogId,
      dimensions: {
        width_mm: item.dimensions.widthMm,
        depth_mm: item.dimensions.depthMm,
        height_mm: item.dimensions.heightMm,
      },
      metadata: { ...item.metadata },
    },
  };
}

export function createRepresentativeProjectFixture(): RepresentativeProjectFixture {
  const roomBoundary = structuredClone(ROOM_BOUNDARY);
  const furniture = structuredClone(FURNITURE);
  const metadata = structuredClone(PROJECT_METADATA);
  const objects = [
    roomBoundaryFabricObject(roomBoundary),
    ...furniture.map(furnitureFabricObject),
  ];

  return {
    fixtureId: REPRESENTATIVE_FIXTURE_ID,
    fixtureVersion: REPRESENTATIVE_FIXTURE_VERSION,
    name: "Planner representative performance project",
    plannerScalePxPerMm: REPRESENTATIVE_PLANNER_SCALE_PX_PER_MM,
    roomBoundary,
    furniture,
    metadata,
    persistedProject: {
      id: "fixture-project-performance-001",
      name: "Planner representative performance project",
      objects_count: objects.length,
      created_at: metadata.createdAt,
      updated_at: metadata.updatedAt,
      canvas_json: {
        version: "7.4.0",
        background: "#FFFFFF",
        objects,
      },
      sheet: {
        width_mm: roomBoundary.widthMm,
        height_mm: roomBoundary.depthMm,
        unit: "mm",
        scale_px_per_mm: REPRESENTATIVE_PLANNER_SCALE_PX_PER_MM,
      },
      layers: [
        { id: "layer-room", label: "Room boundary", visible: true, locked: true },
        { id: "layer-furniture", label: "Furniture", visible: true, locked: false },
      ],
      metadata,
    },
  };
}

export function validateRepresentativeProjectFixture(
  fixture: RepresentativeProjectFixture,
): string[] {
  const issues: string[] = [];
  if (fixture.fixtureId !== REPRESENTATIVE_FIXTURE_ID) {
    issues.push("The representative fixture id is not stable.");
  }
  if (fixture.plannerScalePxPerMm !== REPRESENTATIVE_PLANNER_SCALE_PX_PER_MM) {
    issues.push("The representative fixture must use the Planner 0.05 px/mm scale.");
  }
  if (
    fixture.roomBoundary.pointsMm.length < 4 ||
    fixture.roomBoundary.widthMm <= 0 ||
    fixture.roomBoundary.depthMm <= 0 ||
    fixture.roomBoundary.label.trim().length === 0
  ) {
    issues.push("The representative fixture requires a labelled room boundary with positive dimensions.");
  }
  if (fixture.furniture.length < 10) {
    issues.push("The representative fixture requires at least ten furniture objects.");
  }
  if (!fixture.furniture.some((item) => item.rotationDeg !== 0)) {
    issues.push("The representative fixture requires rotated furniture.");
  }

  const ids = new Set<string>();
  for (const item of fixture.furniture) {
    if (ids.has(item.id)) {
      issues.push(`Duplicate representative furniture id: ${item.id}`);
    }
    ids.add(item.id);
    if (item.label.trim().length === 0) {
      issues.push(`Representative furniture ${item.id} requires a label.`);
    }
    if (
      item.dimensions.widthMm <= 0 ||
      item.dimensions.depthMm <= 0 ||
      item.dimensions.heightMm <= 0
    ) {
      issues.push(`Representative furniture ${item.id} requires positive dimensions.`);
    }
    if (Object.keys(item.metadata).length === 0) {
      issues.push(`Representative furniture ${item.id} requires metadata.`);
    }
  }

  const expectedObjectCount = fixture.furniture.length + 1;
  if (
    fixture.persistedProject.objects_count !== expectedObjectCount ||
    fixture.persistedProject.canvas_json.objects.length !== expectedObjectCount
  ) {
    issues.push("Persisted fixture objects must contain the room boundary and every furniture object.");
  }
  if (
    fixture.persistedProject.metadata.schemaVersion !== 1 ||
    fixture.persistedProject.metadata.revision <= 0 ||
    fixture.persistedProject.metadata.createdAt.length === 0 ||
    fixture.persistedProject.metadata.updatedAt.length === 0
  ) {
    issues.push("The representative fixture requires persisted schema, revision, and timestamp metadata.");
  }

  return issues.sort();
}

export const representativeProjectFixture = createRepresentativeProjectFixture();

const fixtureIssues = validateRepresentativeProjectFixture(
  representativeProjectFixture,
);
if (fixtureIssues.length > 0) {
  throw new Error(`Invalid representative project fixture:\n${fixtureIssues.join("\n")}`);
}

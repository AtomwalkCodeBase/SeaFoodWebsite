export const INIT_YIELD_STEPS = [
    { id: "y1", name: "Cleaning", sequence: 1, yield_pct: 0.92, loss: "Shells, heads, waste", parent: true, efficiency: 200 },
    { id: "y2", name: "Cooking", sequence: 2, yield_pct: 0.85, loss: "Moisture & protein loss", parent: false, efficiency: 150 },
    { id: "y3", name: "Glazing", sequence: 3, yield_pct: 1.03, loss: "Glaze adds weight", parent: false, efficiency: 180 },
    { id: "y4", name: "Packing", sequence: 4, yield_pct: 0.99, loss: "Minor spillage", parent: false, efficiency: 160 },
  ];
import { theme } from "./styles/Theme";

export const PO_STATUS = {
  "A": { label: "Approved", variant: "success" },
  "P": { label: "Pending", variant: "warning" },
  "R": { label: "Rejected", variant: "error" },
  "D": { label: "Draft", variant: "info" },
};

export const PO_TYPE = {
  P: { label: "Purchase Order", color: theme.primary, bg: theme.primaryLight },
  R: { label: "Purchase Order Request", color: theme.primary, bg: theme.primaryLight },
  S: { label: "Sales", color: theme.secondary, bg: theme.secondaryLight },
  T: { label: "Transfer", color: theme.accent, bg: theme.accentLight },
};

export const INVENTORY_TYPE = {
  F: { label: "Finished Goods", short: "FG" },
  R: { label: "Raw Material", short: "RM" },
  P: { label: "Packing/Consumable Materials", short: "PKG" },
  W: { label: "Work In Progress", short: "WIP" },
};

export const ORDERS_CUSTOMER_TIER = [
  { id: 1, value: "TIER_1", label: "TIER 1" },
  { id: 2, value: "TIER_2", label: "TIER 2" },
  { id: 3, value: "TIER_3", label: "TIER 3" },
];

export const ORDERS_PRIORITY_OPTIONS = [
  { id: 1, value: "critical", label: "CRITICAL" },
  { id: 2, value: "urgent", label: "URGENT" },
  { id: 3, value: "standard", label: "STANDARD" },
];

export const QUERY_KEYS = {
  CUSTOMER: 'customer',
  PRODUCTS: 'products',
  GRADES: 'grades',
  SPECIES: 'species',
  ORDERS: 'orders',
  INVENTORY_CATEGORY: 'inventoryCategory',
  ORDERS_BY_DESTINATION: 'ordersByDestination',
  ORDERS_BY_PRIORITY: 'ordersByPriority',
  PLANNING_CONFIG: 'planning-config',
  BATCHES: 'batches',
  PO_ITEM_LIST: 'po-item-list',
  GRN_LIST: 'grn-list',
  PROCUREMENT_PLAN: 'procurement-plan',
  PROCESS_ACTIVITY: 'process-activity',
  YIELD_BY_PRODUCT: 'yield-by-product',
  ALL_YIELD: 'all-yield',
  EMPLOYEE_LIST: 'employee-list',
  WORKFORCE_COVERAGE: 'workforce-coverage',
  WORKFORCE_AVAILABLE: 'workforce-available',

}


const qualityControlData = [
  // MANAGER VIEW DATA
  // {
  //   role: "manager",
  //   rawPrawnsName: "White Leg Shrimp",
  //   refNo: "REF-2024-001",
  //   batchNo: "BATCH-WL-001",
  //   supplierName: "Coastal Harvest Ltd",
  //   qty: 500,
  //   qcStatus: "In Progress",
  //   qcDone: 2,
  //   qcHappen: 5,
  //   samples: [
  //     {
  //       sampleId: "SMP-001",
  //       status: "completed",
  //       assignedTo: "QC001",
  //       qcTesterName: "John Smith",
  //       empId: "EMP001",
  //       totalSampleWeight: 2.5,
  //       totalNoOfPieces: 25,
  //       temp: "-18°C",
  //       smell: "Fresh",
  //       color: "Light Pink",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "White Leg Shrimp - Large",
  //           noOfPieces: 15,
  //           weight: 1.5,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "White Leg Shrimp - Medium",
  //           noOfPieces: 10,
  //           weight: 1.0,
  //           uom: "kg"
  //         }
  //       ]
  //     },
  //     {
  //       sampleId: "SMP-002",
  //       status: "completed",
  //       assignedTo: "QC002",
  //       qcTesterName: "Sarah Johnson",
  //       empId: "EMP002",
  //       totalSampleWeight: 2.8,
  //       totalNoOfPieces: 28,
  //       temp: "-17°C",
  //       smell: "Fresh",
  //       color: "Light Pink",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "White Leg Shrimp - Large",
  //           noOfPieces: 18,
  //           weight: 1.8,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "White Leg Shrimp - Medium",
  //           noOfPieces: 10,
  //           weight: 1.0,
  //           uom: "kg"
  //         }
  //       ]
  //     },
  //     {
  //       sampleId: "SMP-003",
  //       status: "pending",
  //       assignedTo: "QC003",
  //       qcTesterName: "Michael Chen",
  //       empId: "EMP003",
  //       totalSampleWeight: null,
  //       totalNoOfPieces: null,
  //       temp: null,
  //       smell: null,
  //       color: null,
  //       decision: null,
  //       testedItems: []
  //     },
  //     {
  //       sampleId: "SMP-004",
  //       status: "pending",
  //       assignedTo: "QC004",
  //       qcTesterName: "Emily Brown",
  //       empId: "EMP004",
  //       totalSampleWeight: null,
  //       totalNoOfPieces: null,
  //       temp: null,
  //       smell: null,
  //       color: null,
  //       decision: null,
  //       testedItems: []
  //     },
  //     {
  //       sampleId: "SMP-005",
  //       status: "pending",
  //       assignedTo: "QC005",
  //       qcTesterName: "David Wilson",
  //       empId: "EMP005",
  //       totalSampleWeight: null,
  //       totalNoOfPieces: null,
  //       temp: null,
  //       smell: null,
  //       color: null,
  //       decision: null,
  //       testedItems: []
  //     }
  //   ]
  // },
  // {
  //   role: "manager",
  //   rawPrawnsName: "Tiger Prawn",
  //   refNo: "REF-2024-002",
  //   batchNo: "BATCH-TP-002",
  //   supplierName: "Ocean Fresh Seafoods",
  //   qty: 750,
  //   qcStatus: "Completed",
  //   qcDone: 3,
  //   qcHappen: 3,
  //   samples: [
  //     {
  //       sampleId: "SMP-006",
  //       status: "completed",
  //       assignedTo: "QC001",
  //       qcTesterName: "John Smith",
  //       empId: "EMP001",
  //       totalSampleWeight: 3.2,
  //       totalNoOfPieces: 32,
  //       temp: "-19°C",
  //       smell: "Fresh",
  //       color: "Light Brown with Stripes",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "Tiger Prawn - Jumbo",
  //           noOfPieces: 20,
  //           weight: 2.0,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "Tiger Prawn - Large",
  //           noOfPieces: 12,
  //           weight: 1.2,
  //           uom: "kg"
  //         }
  //       ]
  //     },
  //     {
  //       sampleId: "SMP-007",
  //       status: "completed",
  //       assignedTo: "QC003",
  //       qcTesterName: "Michael Chen",
  //       empId: "EMP003",
  //       totalSampleWeight: 3.0,
  //       totalNoOfPieces: 30,
  //       temp: "-18°C",
  //       smell: "Fresh",
  //       color: "Light Brown with Stripes",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "Tiger Prawn - Jumbo",
  //           noOfPieces: 18,
  //           weight: 1.8,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "Tiger Prawn - Large",
  //           noOfPieces: 12,
  //           weight: 1.2,
  //           uom: "kg"
  //         }
  //       ]
  //     },
  //     {
  //       sampleId: "SMP-008",
  //       status: "completed",
  //       assignedTo: "QC002",
  //       qcTesterName: "Sarah Johnson",
  //       empId: "EMP002",
  //       totalSampleWeight: 3.5,
  //       totalNoOfPieces: 35,
  //       temp: "-18°C",
  //       smell: "Fresh",
  //       color: "Light Brown with Stripes",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "Tiger Prawn - Jumbo",
  //           noOfPieces: 22,
  //           weight: 2.2,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "Tiger Prawn - Large",
  //           noOfPieces: 13,
  //           weight: 1.3,
  //           uom: "kg"
  //         }
  //       ]
  //     }
  //   ]
  // },
  {
    role: "manager",
    rawPrawnsName: "Black Tiger Shrimp",
    refNo: "REF-2024-003",
    batchNo: "BATCH-BT-003",
    supplierName: "Deep Sea Fisheries",
    qty: 1000,
    qcStatus: "Pending",
    qcDone: 0,
    qcHappen: 4,
    samples: [
      {
        sampleId: "SMP-009",
        status: "pending",
        assignedTo: "QC001",
        qcTesterName: "John Smith",
        empId: "EMP001",
        totalSampleWeight: null,
        totalNoOfPieces: null,
        temp: null,
        smell: null,
        color: null,
        decision: null,
        testedItems: []
      },
      {
        sampleId: "SMP-010",
        status: "pending",
        assignedTo: "QC002",
        qcTesterName: "Sarah Johnson",
        empId: "EMP002",
        totalSampleWeight: null,
        totalNoOfPieces: null,
        temp: null,
        smell: null,
        color: null,
        decision: null,
        testedItems: []
      },
      {
        sampleId: "SMP-011",
        status: "pending",
        assignedTo: "QC004",
        qcTesterName: "Emily Brown",
        empId: "EMP004",
        totalSampleWeight: null,
        totalNoOfPieces: null,
        temp: null,
        smell: null,
        color: null,
        decision: null,
        testedItems: []
      },
      {
        sampleId: "SMP-012",
        status: "pending",
        assignedTo: "QC005",
        qcTesterName: "David Wilson",
        empId: "EMP005",
        totalSampleWeight: null,
        totalNoOfPieces: null,
        temp: null,
        smell: null,
        color: null,
        decision: null,
        testedItems: []
      }
    ]
  },
  {
    role: "manager",
    rawPrawnsName: "Pink Prawn",
    refNo: "REF-2024-004",
    batchNo: "BATCH-PP-004",
    supplierName: "Bay Area Seafood",
    qty: 600,
    qcStatus: "In Progress",
    qcDone: 1,
    qcHappen: 3,
    samples: [
      {
        sampleId: "SMP-013",
        status: "completed",
        assignedTo: "QC003",
        qcTesterName: "Michael Chen",
        empId: "EMP003",
        totalSampleWeight: 2.2,
        totalNoOfPieces: 22,
        temp: "-18°C",
        smell: "Fresh",
        color: "Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "Pink Prawn - Medium",
            noOfPieces: 22,
            weight: 2.2,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-014",
        status: "pending",
        assignedTo: "QC001",
        qcTesterName: "John Smith",
        empId: "EMP001",
        totalSampleWeight: null,
        totalNoOfPieces: null,
        temp: null,
        smell: null,
        color: null,
        decision: null,
        testedItems: []
      },
      {
        sampleId: "SMP-015",
        status: "pending",
        assignedTo: "QC002",
        qcTesterName: "Sarah Johnson",
        empId: "EMP002",
        totalSampleWeight: null,
        totalNoOfPieces: null,
        temp: null,
        smell: null,
        color: null,
        decision: null,
        testedItems: []
      }
    ]
  },
  {
    role: "manager",
    rawPrawnsName: "King Prawn",
    refNo: "REF-2024-005",
    batchNo: "BATCH-KP-005",
    supplierName: "Royal Seafood Exporters",
    qty: 850,
    qcStatus: "Completed",
    qcDone: 4,
    qcHappen: 4,
    samples: [
      {
        sampleId: "SMP-016",
        status: "completed",
        assignedTo: "QC001",
        qcTesterName: "John Smith",
        empId: "EMP001",
        totalSampleWeight: 4.0,
        totalNoOfPieces: 40,
        temp: "-19°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 25,
            weight: 2.5,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-017",
        status: "completed",
        assignedTo: "QC002",
        qcTesterName: "Sarah Johnson",
        empId: "EMP002",
        totalSampleWeight: 3.8,
        totalNoOfPieces: 38,
        temp: "-18°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 23,
            weight: 2.3,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-018",
        status: "completed",
        assignedTo: "QC003",
        qcTesterName: "Michael Chen",
        empId: "EMP003",
        totalSampleWeight: 4.2,
        totalNoOfPieces: 42,
        temp: "-19°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 27,
            weight: 2.7,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-019",
        status: "completed",
        assignedTo: "QC004",
        qcTesterName: "Emily Brown",
        empId: "EMP004",
        totalSampleWeight: 3.9,
        totalNoOfPieces: 39,
        temp: "-18°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 24,
            weight: 2.4,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      }
    ]
  },

  // EMPLOYEE VIEW DATA (unchanged)
  // {
  //   role: "employee",
  //   rawPrawnsName: "White Leg Shrimp",
  //   refNo: "REF-2024-001",
  //   batchNo: "BATCH-WL-001",
  //   assignedQC: "QC001 - John Smith",
  //   qcStatus: "In Progress",
  //   doneQc: 1,
  //   samples: [
  //     {
  //       sampleId: "SMP-001",
  //       totalSampleWeight: 2.5,
  //       totalNoOfPieces: 25,
  //       temp: "-18°C",
  //       smell: "Fresh",
  //       color: "Light Pink",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "White Leg Shrimp - Large",
  //           noOfPieces: 15,
  //           weight: 1.5,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "White Leg Shrimp - Medium",
  //           noOfPieces: 10,
  //           weight: 1.0,
  //           uom: "kg"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   role: "employee",
  //   rawPrawnsName: "White Leg Shrimp",
  //   refNo: "REF-2024-001",
  //   batchNo: "BATCH-WL-001",
  //   assignedQC: "QC002 - Sarah Johnson",
  //   qcStatus: "Completed",
  //   doneQc: 2,
  //   samples: [
  //     {
  //       sampleId: "SMP-002",
  //       totalSampleWeight: 2.8,
  //       totalNoOfPieces: 28,
  //       temp: "-17°C",
  //       smell: "Fresh",
  //       color: "Light Pink",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "White Leg Shrimp - Large",
  //           noOfPieces: 18,
  //           weight: 1.8,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "White Leg Shrimp - Medium",
  //           noOfPieces: 10,
  //           weight: 1.0,
  //           uom: "kg"
  //         }
  //       ]
  //     },
  //     {
  //       sampleId: "SMP-003",
  //       totalSampleWeight: 2.6,
  //       totalNoOfPieces: 26,
  //       temp: "-18°C",
  //       smell: "Fresh",
  //       color: "Light Pink",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "White Leg Shrimp - Large",
  //           noOfPieces: 16,
  //           weight: 1.6,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "White Leg Shrimp - Medium",
  //           noOfPieces: 10,
  //           weight: 1.0,
  //           uom: "kg"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   role: "employee",
  //   rawPrawnsName: "Tiger Prawn",
  //   refNo: "REF-2024-002",
  //   batchNo: "BATCH-TP-002",
  //   assignedQC: "QC001 - John Smith",
  //   qcStatus: "Completed",
  //   doneQc: 2,
  //   samples: [
  //     {
  //       sampleId: "SMP-006",
  //       totalSampleWeight: 3.2,
  //       totalNoOfPieces: 32,
  //       temp: "-19°C",
  //       smell: "Fresh",
  //       color: "Light Brown with Stripes",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "Tiger Prawn - Jumbo",
  //           noOfPieces: 20,
  //           weight: 2.0,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "Tiger Prawn - Large",
  //           noOfPieces: 12,
  //           weight: 1.2,
  //           uom: "kg"
  //         }
  //       ]
  //     },
  //     {
  //       sampleId: "SMP-007",
  //       totalSampleWeight: 3.0,
  //       totalNoOfPieces: 30,
  //       temp: "-18°C",
  //       smell: "Fresh",
  //       color: "Light Brown with Stripes",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "Tiger Prawn - Jumbo",
  //           noOfPieces: 18,
  //           weight: 1.8,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "Tiger Prawn - Large",
  //           noOfPieces: 12,
  //           weight: 1.2,
  //           uom: "kg"
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   role: "employee",
  //   rawPrawnsName: "Tiger Prawn",
  //   refNo: "REF-2024-002",
  //   batchNo: "BATCH-TP-002",
  //   assignedQC: "QC003 - Michael Chen",
  //   qcStatus: "Completed",
  //   doneQc: 1,
  //   samples: [
  //     {
  //       sampleId: "SMP-008",
  //       totalSampleWeight: 3.5,
  //       totalNoOfPieces: 35,
  //       temp: "-18°C",
  //       smell: "Fresh",
  //       color: "Light Brown with Stripes",
  //       decision: "Pass",
  //       testedItems: [
  //         {
  //           itemName: "Tiger Prawn - Jumbo",
  //           noOfPieces: 22,
  //           weight: 2.2,
  //           uom: "kg"
  //         },
  //         {
  //           itemName: "Tiger Prawn - Large",
  //           noOfPieces: 13,
  //           weight: 1.3,
  //           uom: "kg"
  //         }
  //       ]
  //     }
  //   ]
  // },
  {
    role: "employee",
    rawPrawnsName: "Black Tiger Shrimp",
    refNo: "REF-2024-003",
    batchNo: "BATCH-BT-003",
    assignedQC: "QC001 - John Smith",
    qcStatus: "Pending",
    doneQc: 0,
    samples: []
  },
  {
    role: "employee",
    rawPrawnsName: "Black Tiger Shrimp",
    refNo: "REF-2024-003",
    batchNo: "BATCH-BT-003",
    assignedQC: "QC004 - Emily Brown",
    qcStatus: "Pending",
    doneQc: 0,
    samples: []
  },
  {
    role: "employee",
    rawPrawnsName: "Pink Prawn",
    refNo: "REF-2024-004",
    batchNo: "BATCH-PP-004",
    assignedQC: "QC003 - Michael Chen",
    qcStatus: "Completed",
    doneQc: 1,
    samples: [
      {
        sampleId: "SMP-013",
        totalSampleWeight: 2.2,
        totalNoOfPieces: 22,
        temp: "-18°C",
        smell: "Fresh",
        color: "Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "Pink Prawn - Medium",
            noOfPieces: 22,
            weight: 2.2,
            uom: "kg"
          }
        ]
      }
    ]
  },
  {
    role: "employee",
    rawPrawnsName: "Pink Prawn",
    refNo: "REF-2024-004",
    batchNo: "BATCH-PP-004",
    assignedQC: "QC001 - John Smith",
    qcStatus: "Pending",
    doneQc: 0,
    samples: []
  },
  {
    role: "employee",
    rawPrawnsName: "King Prawn",
    refNo: "REF-2024-005",
    batchNo: "BATCH-KP-005",
    assignedQC: "QC001 - John Smith",
    qcStatus: "Completed",
    doneQc: 2,
    samples: [
      {
        sampleId: "SMP-016",
        totalSampleWeight: 4.0,
        totalNoOfPieces: 40,
        temp: "-19°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 25,
            weight: 2.5,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-017",
        totalSampleWeight: 3.8,
        totalNoOfPieces: 38,
        temp: "-18°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 23,
            weight: 2.3,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      }
    ]
  },
  {
    role: "employee",
    rawPrawnsName: "King Prawn",
    refNo: "REF-2024-005",
    batchNo: "BATCH-KP-005",
    assignedQC: "QC002 - Sarah Johnson",
    qcStatus: "Completed",
    doneQc: 4,
    samples: [
      {
        sampleId: "SMP-018",
        totalSampleWeight: 4.2,
        totalNoOfPieces: 42,
        temp: "-19°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 27,
            weight: 2.7,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-019",
        totalSampleWeight: 3.9,
        totalNoOfPieces: 39,
        temp: "-18°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 24,
            weight: 2.4,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-020",
        totalSampleWeight: 4.1,
        totalNoOfPieces: 41,
        temp: "-19°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 26,
            weight: 2.6,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-021",
        totalSampleWeight: 4.0,
        totalNoOfPieces: 40,
        temp: "-18°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 25,
            weight: 2.5,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      }
    ]
  },
  {
    role: "employee",
    rawPrawnsName: "King Prawn",
    refNo: "REF-2024-005",
    batchNo: "BATCH-KP-005",
    assignedQC: "QC003 - Michael Chen",
    qcStatus: "Completed",
    doneQc: 4,
    samples: [
      {
        sampleId: "SMP-022",
        totalSampleWeight: 4.3,
        totalNoOfPieces: 43,
        temp: "-19°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 28,
            weight: 2.8,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-023",
        totalSampleWeight: 3.8,
        totalNoOfPieces: 38,
        temp: "-18°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 23,
            weight: 2.3,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-024",
        totalSampleWeight: 4.1,
        totalNoOfPieces: 41,
        temp: "-19°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 26,
            weight: 2.6,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-025",
        totalSampleWeight: 3.9,
        totalNoOfPieces: 39,
        temp: "-18°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 24,
            weight: 2.4,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      }
    ]
  },
  {
    role: "employee",
    rawPrawnsName: "King Prawn",
    refNo: "REF-2024-005",
    batchNo: "BATCH-KP-005",
    assignedQC: "QC004 - Emily Brown",
    qcStatus: "Completed",
    doneQc: 4,
    samples: [
      {
        sampleId: "SMP-026",
        totalSampleWeight: 4.0,
        totalNoOfPieces: 40,
        temp: "-19°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 25,
            weight: 2.5,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-027",
        totalSampleWeight: 4.2,
        totalNoOfPieces: 42,
        temp: "-18°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 27,
            weight: 2.7,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-028",
        totalSampleWeight: 3.8,
        totalNoOfPieces: 38,
        temp: "-19°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 23,
            weight: 2.3,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      },
      {
        sampleId: "SMP-029",
        totalSampleWeight: 4.1,
        totalNoOfPieces: 41,
        temp: "-18°C",
        smell: "Fresh",
        color: "Dark Pink",
        decision: "Pass",
        testedItems: [
          {
            itemName: "King Prawn - Jumbo",
            noOfPieces: 26,
            weight: 2.6,
            uom: "kg"
          },
          {
            itemName: "King Prawn - Large",
            noOfPieces: 15,
            weight: 1.5,
            uom: "kg"
          }
        ]
      }
    ]
  }
];

export function getEmployeeView() {
  return qualityControlData.filter(item => item.role === "employee");
}
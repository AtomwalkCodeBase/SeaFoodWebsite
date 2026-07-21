import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AddNewOrder, AssignWorkForce, createGradingSession, createGRN, GenerateBatchPlan, getAllYieldConfig, GetBaseUnitList, getCustomerListView, getemployeeList, getGrades, getGradingSessionsList, getInventoryStatus, GetItemCategory, GetOrdersByDestinationList, GetOrdersFulfillList, GetOrdersList, GetOrdersPriorityQueueList, GetPlanningReport, getPoItem, getProcessActivityList, getProcurementPlan, getProductList, getSpecies, getWorkForceAvailable, getWorkForceCoverage, getYieldConfig, RecordGrades, ReleaseWorkForce, UpdateOrder, getDashboardSummary, getActiveAlerts, getSupplierprofile, getEquipmentList, getPeelingCenters, AddPeelingCenter, getProcessPilling, AddProcessPilling } from "../services/productServices";
import { toast } from "react-toastify";
import { QUERY_KEYS } from "../constants";
import { handleApiError } from "../utils";
import { useEffect } from "react";

const ErrorText = "Failed to load"

export const useApiQuery = ({ queryKey, queryFn, select, enabled = true, errorMessage, }) => {
  const query = useQuery({ queryKey, queryFn, select, enabled, });
  useEffect(() => {
    if (query.error) {
      handleApiError(query.error, errorMessage);
    }
  }, [query.error]);
  return query;
};

//GET API
export const useCustomers = (params, enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.CUSTOMER, params],
    queryFn: () => getCustomerListView(params),
    select: (res) => res.data,
    enabled,
    errorMessage: `${ErrorText} customer list`,
  });
};
export const useDashboardSummary = (enabled = true) => {
  return useApiQuery({
    queryKey: ["DASHBOARD_SUMMARY"],
    queryFn: () => getDashboardSummary(),
    select: (res) => res.data,
    enabled,
    errorMessage: `${ErrorText} dashboard summary`,
  });
};
export const usePeelingCenters = (enabled = true) => {
  return useApiQuery({
    queryKey: ["PEELING_CENTERS"],
    queryFn: () => getPeelingCenters(),
    select: (res) => res.data,
    enabled,
    errorMessage: `${ErrorText} peeling centers`,
  });
};
export const useActiveAlerts = (enabled = true) => {
  return useApiQuery({
    queryKey: ["ACTIVE_ALERTS"],
    queryFn: () => getActiveAlerts(),
    select: (res) => res.data,
    enabled,
    errorMessage: `${ErrorText} active alerts`,
  });
};
export const useSupplierProfile = (enabled = true, id = null) => {
  return useApiQuery({
    queryKey: ["SUPPLIER_PROFILE", id],
    queryFn: () => getSupplierprofile(id),
    select: (res) => res.data,
    enabled,
    errorMessage: `${ErrorText} supplier profile`,
  });
};
export const useProduct = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.PRODUCTS],
    queryFn: () => getProductList(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} product list`,
  });
};
// export const useProcessPillingList = (enabled = true) => {
//   return useApiQuery({
//     queryKey: ["PROCESS_PILLING"],
//     queryFn: () => getProcessPilling(),
//     select: (res) => res.data,
//     enabled,
//     errorMessage: `${ErrorText} process pilling list`,
//   });
// };

export const useEquipmentList = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.EQUIPMENT_LIST],
    queryFn: () => getEquipmentList(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} product list`,
  });
};

export const useGrades = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.GRADES],
    queryFn: () => getGrades(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} grades`,
  });
};

export const useSpecies = (enabled = true, id = null) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.SPECIES, id],
    queryFn: () => getSpecies(null, id),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} species`,
  });
};

export const useOrders = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.ORDERS],
    queryFn: () => GetOrdersList(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} orders`,
  });
};

export const useOrdersByDestination = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.ORDERS_BY_DESTINATION],
    queryFn: () => GetOrdersByDestinationList(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} orders by destination`,
  });
};

export const useOrdersByPriority = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.ORDERS_BY_PRIORITY],
    queryFn: () => GetOrdersPriorityQueueList(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} orders by destination`,
  });
};

export const useInventoryCategory = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.INVENTORY_CATEGORY],
    queryFn: () => GetItemCategory(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} inventory category`,
  });
};

export const useInventoryStatus = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.INVENTORY_STATUS],
    queryFn: () => getInventoryStatus(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} inventory status`,
  });
};

export const usePOItemList = (params, enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.PO_ITEM_LIST, params],
    queryFn: () => getPoItem(params),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Purchase Request List`,
  });
};

export const useGRNList = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.GRN_LIST],
    queryFn: () => getGradingSessionsList(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} GRN List`,
  });
};

export const useProcurementPlan = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.PROCUREMENT_PLAN],
    queryFn: () => getProcurementPlan(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Procurement Plan`,
  });
};

export const useProcessActivityList = (enabled = true, id = null) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.PROCESS_ACTIVITY, id],
    queryFn: () => getProcessActivityList({ product_id: id }),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Activity List`,
  });
};

export const useYieldConfig = (enabled = true, id) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.YIELD_BY_PRODUCT, id],
    queryFn: () => getYieldConfig(null, id),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Yield List`,
  });
};

export const useAllYieldConfig = (enabled = true,) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.YIELD_CONFIG],
    queryFn: () => getYieldConfig(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Yield List`,
  });
};

export const useGetEmployeeList = (enabled = true,) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.EMPLOYEE_LIST],
    queryFn: () => getemployeeList(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Employee List`,
  });
};

export const useGetWorkCoverage = (enabled = true, params) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.WORKFORCE_COVERAGE, params],
    queryFn: () => getWorkForceCoverage(params),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Workforce coverage data `,
  });
};

export const useGetWorkAvailable = (enabled = true, params = {}) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.WORKFORCE_AVAILABLE, params],
    queryFn: () => getWorkForceAvailable(params),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Workforce coverage data `,
  });
};

export const useGetBaseUnitList = (enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.GET_BASE_UNIT],
    queryFn: () => GetBaseUnitList(),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Base unit `,
  });
};

export const useGetOrderFulfillment = (enabled = true, id) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.ORDER_FULFILLMENT, id],
    queryFn: () => GetOrdersFulfillList(id),
    select: (res) => res.data,
    enabled: Boolean(enabled) && Boolean(id),
    errorMessage: `${ErrorText} order fulfillment`,
  });
};

export const useGetRecommendedBatch = (enabled = true, params = {}) => {
  const normalizedParams = { ...params };
  const excludedOrdersRaw =
    normalizedParams.exclude ?? normalizedParams.exclude_orders;
  const excludedOrders = Array.isArray(excludedOrdersRaw)
    ? excludedOrdersRaw
    : typeof excludedOrdersRaw === "string"
      ? excludedOrdersRaw
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
      : [];

  // Avoid axios array query serialization (exclude[]=...).
  // Backend expects a plain query value key.
  if (excludedOrders.length > 0) {
    normalizedParams.exclude = excludedOrders.join(",");
  } else {
    delete normalizedParams.exclude;
  }
  delete normalizedParams.exclude_orders;

  return useApiQuery({
    queryKey: [QUERY_KEYS.GENERATE_BATCH, normalizedParams],
    queryFn: () => GetPlanningReport(normalizedParams),
    select: (res) => res.data,
    enabled,
    onError: `${ErrorText} Recommended batches `,
  });
};

//CURD API
export const useCreateOrder = (
  handleCloseModal,
  onOrderCreated
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AddNewOrder,

    onSuccess: async (_, variables) => {
      toast.success("Order added successfully!");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.ORDERS],
        }),
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.ORDERS_BY_DESTINATION],
        }),
      ]);

      onOrderCreated?.(variables);

      handleCloseModal?.();
    },

    onError: handleApiError,
  });
};

export const useUpdateOrder = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => UpdateOrder(data, id),

    onSuccess: async () => {
      toast.success("Order updated successfully!");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS], }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS_BY_DESTINATION], }),
      ]);

      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};

export const useAddMachine = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => UpdateOrder(data, id),

    onSuccess: async () => {
      toast.success("Machine data save successfully!");

      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ORDERS],
      });

      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};
export const useUpdateMachine = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => UpdateOrder(data, id),

    onSuccess: async () => {
      toast.success("Machine data updated successfully!");

      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ORDERS],
      });

      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};

export const useAddGRN = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGRN,

    onSuccess: async () => {
      toast.success("GRN add successfully!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PO_ITEM_LIST], }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GRN_LIST], }),
      ]);
      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};

export const useCreateGradingSession = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGradingSession,

    onSuccess: async () => {
      toast.success("Grading started successfully");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PO_ITEM_LIST], }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GRN_LIST], }),
      ]);

      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};

export const useGradeSegregation = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: RecordGrades,

    onSuccess: async () => {
      toast.success("Grade wise segregation successfully. Inventory is Updated.");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PO_ITEM_LIST], }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GRN_LIST], }),
      ]);

      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};

export const useGenerateBatchPlan = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: GenerateBatchPlan,

    onSuccess: async () => {
      toast.success("Plan generated . Go to the Batch Tabs");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVENTORY_STATUS], }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS_BY_PRIORITY], }),
      ]);

      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};

export const useAssignWorker = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AssignWorkForce,

    onSuccess: async () => {
      toast.success("Employee assign to the Batch activity");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKFORCE_COVERAGE], }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKFORCE_AVAILABLE], }),
      ]);

      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};

export const useReleaseWorker = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ReleaseWorkForce,

    onSuccess: async () => {
      toast.success("Employee release from the Batch activity");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKFORCE_COVERAGE], }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WORKFORCE_AVAILABLE], }),
      ]);

      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};
export const useAddProcessPilling = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AddProcessPilling,

    onSuccess: async () => {
      toast.success("Peeling center added successfully!");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["PROCESS_PILLING"],
        }),
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.PO_ITEM_LIST],
        }),
      ]);

      // handleCloseModal?.();
    },

    onError: handleApiError,
  });
};

export const useAddPeelingCenter = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AddPeelingCenter,

    onSuccess: async () => {
      toast.success("Peeling center added successfully!");

      await queryClient.invalidateQueries({
        queryKey: ["PEELING_CENTER"],
      });

      handleCloseModal?.();
    },

    onError: handleApiError,
  });
};
export const useProcessPillingList = (poRequestId) => {
  return useApiQuery({
    queryKey: ["PROCESS_PILLING", poRequestId],
    enabled: !!poRequestId,
    queryFn: () => getProcessPilling(),
    select: (res) => {
      console.log("API Response:", res);
      console.log("API Data:", res.data);

      const list = Array.isArray(res.data) ? res.data : [];

      return list.filter(item => item.po_request === poRequestId);
    },
    errorMessage: `${ErrorText} process pilling list`,
  });
};
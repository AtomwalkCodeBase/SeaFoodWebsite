import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AddNewOrder, createGRN, getAllYieldConfig, getCustomerListView, getGrades, getGradingSessionsList, GetItemCategory, GetOrdersByDestinationList, GetOrdersList, GetOrdersPriorityQueueList, getPoItem, getProcessActivityList, getProcurementPlan, getProductList, getSpecies, getYieldConfig, UpdateOrder } from "../services/productServices";
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
export const useCustomers = (params,enabled = true) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.CUSTOMER, params],
    queryFn: () => getCustomerListView(params),
    select: (res) => res.data,
    enabled,
	errorMessage: `${ErrorText} customer list`,
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
    queryKey: [QUERY_KEYS.SPECIES],
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
    queryFn: () => getProcessActivityList({product_id: id}),
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

export const useAllYieldConfig = (enabled = true, ) => {
  return useApiQuery({
    queryKey: [QUERY_KEYS.YIELD_CONFIG],
    queryFn: () => getYieldConfig(),
    select: (res) => res.data,
    enabled,
	onError: `${ErrorText} Yield List`,
  });
};

//CURD API
export const useCreateOrder = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AddNewOrder,

    onSuccess: async () => {
      toast.success("Order added successfully!");

      await queryClient.invalidateQueries({queryKey: [QUERY_KEYS.ORDERS, QUERY_KEYS.ORDERS_BY_DESTINATION]});
      // await queryClient.invalidateQueries({queryKey: QUERY_KEYS.ORDERS_BY_DESTINATION});

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

      await queryClient.invalidateQueries({queryKey: [QUERY_KEYS.ORDERS, QUERY_KEYS.ORDERS_BY_DESTINATION]});
      // await queryClient.invalidateQueries({queryKey: QUERY_KEYS.ORDERS_BY_DESTINATION});

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
      await queryClient.invalidateQueries({queryKey: [QUERY_KEYS.GRN_LIST]});
      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AddNewOrder, getCustomerListView, getGrades, GetOrdersByDestinationList, GetOrdersList, GetOrdersPriorityQueueList, getProductList, getSpecies, UpdateOrder } from "../services/productServices";
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
export const useCustomers = (enabled = true) => {
  return useApiQuery({
    queryKey: QUERY_KEYS.CUSTOMER,
    queryFn: () => getCustomerListView(),
    select: (res) => res.data,
    enabled,
	errorMessage: `${ErrorText} customer list`,
  });
};

export const useProduct = (enabled = true) => {
  return useApiQuery({
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: () => getProductList(),
    select: (res) => res.data,
    enabled,
	onError: `${ErrorText} product list`,
  });
};

export const useGrades = (enabled = true) => {
  return useApiQuery({
    queryKey: QUERY_KEYS.GRADES,
    queryFn: () => getGrades(),
    select: (res) => res.data,
    enabled,
	onError: `${ErrorText} grades`,
  });
};

export const useSpecies = (enabled = true, id = null) => {
  return useApiQuery({
    queryKey: QUERY_KEYS.SPECIES,
    queryFn: () => getSpecies(null, id),
    select: (res) => res.data,
    enabled,
	onError: `${ErrorText} species`,
  });
};

export const useOrders = (enabled = true) => {
  return useApiQuery({
    queryKey: QUERY_KEYS.ORDERS,
    queryFn: () => GetOrdersList(),
    select: (res) => res.data,
    enabled,
	onError: `${ErrorText} orders`,
  });
};

export const useOrdersByDestination = (enabled = true) => {
  return useApiQuery({
    queryKey: QUERY_KEYS.ORDERS_BY_DESTINATION,
    queryFn: () => GetOrdersByDestinationList(),
    select: (res) => res.data,
    enabled,
	onError: `${ErrorText} orders by destination`,
  });
};

export const useOrdersByPriority = (enabled = true) => {
  return useApiQuery({
    queryKey: QUERY_KEYS.ORDERS_BY_PRIORITY,
    queryFn: () => GetOrdersPriorityQueueList(),
    select: (res) => res.data,
    enabled,
	onError: `${ErrorText} orders by destination`,
  });
};

//CURD API
export const useCreateOrder = (handleCloseModal) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AddNewOrder,

    onSuccess: async () => {
      toast.success("Order added successfully!");

      await queryClient.invalidateQueries({
		queryKey: QUERY_KEYS.ORDERS,
      });

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

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS,
      });

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
        queryKey: QUERY_KEYS.ORDERS,
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
        queryKey: QUERY_KEYS.ORDERS,
      });

      handleCloseModal?.();
    },
    onError: handleApiError,
  });
};
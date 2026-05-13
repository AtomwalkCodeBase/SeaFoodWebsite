import {  setuserpin, getCompany, forgetPin, getCustomerDetailListURL, profileDtlURL, getPoItemList, getInventoryItemList, processPoRequest, getCustomerListURL, processQCallocation, getPOqcList, getProductListUrl, getProcessActivityListUrl, getYieldConfigUrl, getMachineCapacityUrl, PlanningConfigUrl, SpeciesUrl, GradesUrl, ItemCategoryListUrl, OrdersUrl, CapacityPlanningUrl, PlanningReportUrl, InventoryStatusUrl, InventoryProjectionUrl, BatchesUrl, GradingSessionsUrl } from "../services/ConstantServies";
import { authAxios, authAxiosFilePost, authAxiosget, authAxiosPatch, authAxiosPost, authAxiosPut } from "./HttpMethod";

export function getemployeeList() {
  return authAxios(profileDtlURL)
}

export function getCompanyName(isFms) {
  let data = {
    'mobile_app_type': isFms ? 'FMS_E' : 'HRM_E',
  };
  return authAxiosget(getCompany, data)
}

export function forgetUserPinView(data, dbName) {
  return authAxiosPost(`${forgetPin + dbName}/`, data);
}
export function getCustomerDetailList(customerId) {
  let data = {}
  if (customerId) {
    data['customer_id'] = customerId;
  }
  return authAxios(getCustomerDetailListURL, data);
}

export function getCustomerListView(params) {
  return authAxios(getCustomerListURL, params)
}

export async function setuserpinview(o_pin, n_pin) {
  try {
    const customerId = localStorage.getItem("empId");
    let data = {
      u_id: customerId,
      o_pin: o_pin,
      n_pin: n_pin,
      user_type: "EMP",
    };

    const response = await authAxiosPost(setuserpin, data);
    if (response.status === 200) {
      // console.log("Pin updated successfully")
    }
    return response;
  } catch (error) {
    return error;
  }
}
//seaFood Api
export function getPoItem() {
  return authAxios(getPoItemList);
}
export function getPoQC(data) {
  return authAxios(getPOqcList,data);
}
export function getInventoryItem(data) {
  return authAxios(getInventoryItemList, data);
}
export function postProcessPoRequest(res) {
  // console.log('Data to be sent:', res);
  return authAxiosPost(processPoRequest, res)
}
export function postProcessQCallocation(res) {
  // console.log('Data to be sent:', res);
  return authAxiosPost(processQCallocation, res)
}
export function getProductList(data) {
  return authAxios(getProductListUrl, data);
}
export function getProcessActivityList(data) {
  return authAxios(getProcessActivityListUrl, data);
}
export function getYieldConfig(data) {
  return authAxios(getYieldConfigUrl, data);
}
export function getMachineCapacity(data) {
  return authAxios(getMachineCapacityUrl, data);
}

export async function UpdateYieldConfig(data) {
  try {
    const { id, ...rest } = data;
    const response = await authAxiosPut(`${getYieldConfigUrl}/${id}/`, rest);
    // if (response.status === 200) {
    //   console.log("Pin updated successfully")
    // }
    return response;
  } catch (error) {
    return error;
  }
}

export async function AddYieldConfig(data) {
  try {
    const response = await authAxiosPost(getYieldConfigUrl, data);
    // if (response.status === 200) {
    //   console.log("Pin updated successfully")
    // }
    return response;
  } catch (error) {
    return error;
  }
}

export function getPlanningConfig(data) {
  return authAxios(PlanningConfigUrl, data);
}

export async function AddPlanningConfig(data) {
  try {
    const response = await authAxiosPost(PlanningConfigUrl, data);
    if (response.status === 200) {
      // console.log("Pin updated successfully")
    }
    return response;
  } catch (error) {
    return error;
  }
}

// export function getSpecies(data) {
//   return authAxios(SpeciesUrl, data);
// }

export function getSpecies(data, id) {
  const url = id ? `${SpeciesUrl}${id}/` : SpeciesUrl;
  return authAxios(url, data);
}

export async function AddSpecies(data) {
  try {
    const response = await authAxiosPost(SpeciesUrl, data);
    return response;
  } catch (error) {
    return error;
  }
}

export function getGrades(data) {
  return authAxios(GradesUrl, data);
}

export async function AddGrades(data) {
  try {
    const response = await authAxiosPost(GradesUrl, data);
    return response;
  } catch (error) {
    return error;
  }
}

export function GetItemCategory(data) {
  return authAxios(ItemCategoryListUrl, data);
}

export function GetOrdersList(data) {
  return authAxios(OrdersUrl, data);
}

export async function AddNewOrder(data) {
  try {
    const response = await authAxiosPost(OrdersUrl, data);
    return response;
  } catch (error) {
    return error;
  }
}

  export function GetCapacityPlanning(days) {
      let data = { "days": days};
    return authAxios(CapacityPlanningUrl, data);
  }

  export function GetPlanningReport(date) {
      let data = { "date": date};
    return authAxios(PlanningReportUrl, data);
  }

  export function getInventoryStatus(data) {
  return authAxios(InventoryStatusUrl, data);
}
export function getInventoryProjection(days) {
  let data = { "days": days };
  return authAxios(InventoryProjectionUrl, data);
}

export function getBatchList(data) {
  return authAxios(BatchesUrl, data);
}

export async function CreateParentBatch(data) {
  try {
    const response = await authAxiosPost(BatchesUrl, data);
    return response;
  } catch (error) {
    return error;
  }
}

export function getGradingSessionsList(data) {
  return authAxios(GradingSessionsUrl, data);
}

export async function createGRN(data) {
  try {
    const response = await authAxiosPost(GradingSessionsUrl, data);
    return response;
  } catch (error) {
    return error;
  }
}

export async function AdvanceBatchActivity(id, data = {}) {
    const response = await authAxiosPost(`${BatchesUrl}${id}/advance-activity/`, data);
    return response;
}

export async function RecordGrades(sessionId, data) {
  try {
    const response = await authAxiosPost(`${GradingSessionsUrl}${sessionId}/record-grades/`, data);
    return response;
  } catch (error) {
    return error;
  }
}

export async function CreateSubBatches(batchId, data) {
  try {
    const response = await authAxiosPost(`${BatchesUrl}${batchId}/create-sub-batches/`, data);
    return response;
  } catch (error) {
    return error;
  }
}

export async function GenerateBatchPlan(data) {
  try {
    const response = await authAxiosPost(EngineGenerateUrl, data);
    return response;
  } catch (error) {
    return error;
  }
}

export async function AutoAllocateBatch(batchId, data = {}) {
  try {
    const response = await authAxiosPost(`${BatchesUrl}${batchId}/auto-allocate/`, data);
    return response;
  } catch (error) {
    return error;
  }
}
export async function ManualAllocateBatch(batchId, data = {}) {
    const response = await authAxiosPost(`${BatchesUrl}${batchId}/allocate/`, data);
    return response;
}
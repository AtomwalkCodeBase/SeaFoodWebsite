import {  setuserpin, getCompany, forgetPin, getCustomerDetailListURL, profileDtlURL, getPoItemList, getInventoryItemList, processPoRequest, getCustomerListURL, processQCallocation, getPOqcList, getProductListUrl, getProcessActivityListUrl, getYieldConfigUrl, getMachineCapacityUrl, PlanningConfigUrl } from "../services/ConstantServies";
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
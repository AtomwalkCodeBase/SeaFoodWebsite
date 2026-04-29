const localhost = "https://www.atomwalk.com"
const newlocalhost = "https://crm.atomwalk.com"
const apiURL = "/api";
const db_name = localStorage.getItem("dbName");
export const endpoint = `${localhost}${apiURL}`;
export const hrendpoint = `${newlocalhost}/api`;
export const newhrendpoint = `${newlocalhost}/hr_api`;
export const newPPpont = `${localhost}/pp_api/config`;

export const userSignUpURL = `${endpoint}/customer_sign_up/${db_name}/`;
export const userLoginURL = `${endpoint}/customer_login/${db_name}/`;
export const loginURL = `${localhost}/rest-auth/login/`;
export const empLoginURL = `${newhrendpoint}/emp_user_login/`;
export const resetPasswordURL = `${endpoint}/reset_password/${db_name}/`;
export const resetPasswordConfirmURL = `${endpoint}/reset_password_confirm/`;
export const changePasswordURL = `${endpoint}/change_password/`;

export const getCustomerListURL = `${endpoint}/customer_list/${db_name}/`;
export const getCustomerDetailListURL = `${endpoint}/customer_detail_list/${db_name}/`;

export const profileInfoURL = `${endpoint}/profile_info/${db_name}/`;
export const profileDtlURL = `${newhrendpoint}/get_employee_list/${db_name}/`;
export const companyInfoURL = `${hrendpoint}/company_info/${db_name}/`;

export const setuserpin = `${endpoint}/set_user_pin/${db_name}/`;
export const getCompany = `${endpoint}/get_applicable_site/`;
export const forgetPin = `${newhrendpoint}/emp_forget_pin/`;
export const customerslogin = `${hrendpoint}/customer_user_login/`;
//seaFood api
export const getPoItemList = `${hrendpoint}/get_po_list/${db_name}/`;
export const getInventoryItemList = `${hrendpoint}/inventory_item_list/${db_name}/`;
export const processPoRequest = `${hrendpoint}/process_po_request/${db_name}/`;
export const processQCallocation = `${hrendpoint}/process_po_qc_data/${db_name}/`;
export const getPOqcList = `${hrendpoint}/get_po_qc_list/${db_name}/`;
export const getProductListUrl = `${hrendpoint}/products/${db_name}/`;
export const getProcessActivityListUrl = `${hrendpoint}/get_process_activity_list/${db_name}/`;
export const getYieldConfigUrl = `${newPPpont}/${db_name}/yield-configs/`;
export const getMachineCapacityUrl = `${newPPpont}/${db_name}/machines/`;
export const PlanningConfigUrl = `${newPPpont}/${db_name}/config/`;


// https://crm.atomwalk.com/api/get_process_activity_list/PMA_002/?product_id=1





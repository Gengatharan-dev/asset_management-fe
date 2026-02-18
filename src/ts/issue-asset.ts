import { fetchAPICall, openSuccessToast, SortDirection, type CommonAPIRes, type PaginationRes, } from "./common.js";
import { getEmployeeByIdAPI, SortColumnKey, type GetEmployeeDetail } from "./employee.js";
import { AssetSortColumnKey, AssetStatusNo, type GetAssetAPIRes } from "./asset.js";
import jQuery from "jquery";


declare var $: any;


// API Res: /api/employees`
export interface GetEmployeesReq {
    count: number | null,
    page: number;
    search: string | null;
    sortColumn: SortColumnKey;
    sortDirection: SortDirection;
    isActive: boolean | null;
}

export interface GetEmployeeAPIRes extends PaginationRes {
    employees: GetEmployeeDetail[];
}

export interface GetEmployeesRes extends CommonAPIRes<GetEmployeeAPIRes> { }

// Get Assets
export interface GetAssetsReq {
    count: number | null,
    page: number;
    search: string | null;
    sortColumn: AssetSortColumnKey;
    sortDirection: SortDirection;
    categoryId: number | null;
    status: AssetStatusNo | null;
    branchId: number | null;
}

export interface GetAssetsAPI extends PaginationRes {
    assets: GetAssetAPIRes[];
}

export interface GetAssetsRes extends CommonAPIRes<GetAssetsAPI> { }

// Issue Asset 
export interface IssueAssetReq {
    empId: string;
    assetId: string;
    issueDate: string;
    notes: string | null;
}




$(document).ready(async () => {
    const today = new Date().toISOString().split("T")[0] || "";

    $("#issueDate")
        .val(today)
        .attr("min", today);

    const employees = await getEmployeeAPI();
    appendEmployeeOptions(employees ?? []);
    const { totalCount } = await getAssetsAPI();
    $("#availableStock").text(totalCount || 0);
});

$("#issueForm").on("submit", async function (this: HTMLFormElement, event: JQuery.SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();

    const form = this;

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }
    const payload: IssueAssetReq = {
        empId: $("#employee").val() as string,
        assetId: $("#asset").val() as string,
        issueDate: $("#issueDate").val() as string,
        notes: $("#notes").val() as string,
    };
    await issueAssetAPI(payload);
    const { totalCount } = await getAssetsAPI();
    $("#availableStock").text(totalCount || 0);
    clearForm();
});

$("#employee").on("change", async () => {
    const text = $("#employee option:selected").text();
    $("#empId").val($("#employee").val());
    const branchId = $("#employee option:selected").data("branch-id")
    const { assets } = await getAssetsAPI(branchId);
    appendAssetOptions(assets ?? []);
    $("#summaryEmployee").text(text);
});

$("#asset").on("change", function () {
    const text = $("#asset option:selected").text();
    $("#summaryAsset").text(text);
});

const clearForm = () => {
    $("#employee").val("");
    $("#asset").val("");
    $("#notes").val("");
    $("#summaryEmployee").text("-");
    $("#summaryAsset").text("-");
}

// API Call
export const issueAssetAPI = async (payload: IssueAssetReq) => {
    await fetchAPICall('POST', '/api/asset/issue', 'save issue asset', payload);

    openSuccessToast("Successfully asset issued");
};

export const getEmployeeAPI = async () => {
    const params = `count=${null}&page=${1}&search=${null}&sortColumn=${SortColumnKey.Name}&sortDirection=${SortDirection.Asc}&isActive=${true}`;
    const data: GetEmployeeAPIRes = await fetchAPICall('GET', `/api/employees?${params}`, 'get employees');

    return data?.employees || [];
};

const appendEmployeeOptions = (employees: GetEmployeeDetail[]) => {
    const $employee = $("#employee");
    $employee.empty();
    $employee.append(`<option value="">Select employee</option>`);
    employees.forEach((employee: GetEmployeeDetail) => {
        const name = employee.lastName ? ` ${employee.firstName} ${employee.lastName}` : `${employee.firstName}`;
        const option = `<option value="${employee.id}"
                         data-branch-id="${employee.branch.id}">
                            ${name} (${employee.branch.name}) - ${employee.id}
                        </option>`;
        $employee.append(option);
    });

};


export const getAssetsAPI = async (branchId?: number) => {
    const params = `count=${null}&page=${1}&search=${null}&sortColumn=${AssetSortColumnKey.Name}&sortDirection=${SortDirection.Asc}&status=${AssetStatusNo.InStack}&branchId=${branchId ?? null}&categoryId=${null}`
    const data: GetAssetsAPI = await fetchAPICall('GET', `/api/assets?${params}`, 'get assets');

    return data;
};

const appendAssetOptions = (assets: GetAssetAPIRes[]) => {
    const $asset = $("#asset");
    $asset.empty();
    $asset.append(`<option value="">Select asset to stock</option>`);
    assets.forEach((asset: GetAssetAPIRes) => {
        const option = `<option value="${asset.id}">${asset.name} - ${asset.category.name}</option>`;
        $asset.append(option);
    });
};
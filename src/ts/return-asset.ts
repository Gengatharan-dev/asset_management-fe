import { fetchAPICall, openSuccessToast, SortDirection, type CommonAPIRes, type PaginationRes, } from "./common.js";
import { AssetSortColumnKey, AssetStatusNo, type GetAssetAPIRes } from "./asset.js";
import moment from 'moment';
import jQuery from "jquery";


declare var $: any;

export enum ReturnAssetStatus {
    Upgrade = "Upgrade",
    Repair = "Repair",
    Resignation = "Resignation",
    Transfer = "Transfer",
    EndOfProject = "End Of Project",
    Other = "Other",
}

export enum ReturnAssetStatusNo {
    Upgrade = 1,
    Repair = 2,
    Resignation = 3,
    Transfer = 4,
    EndOfProject = 5,
    Other = 6,
}

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

// Return Asset 
export interface ReturnAssetReq {
    assetId: string;
    reason: ReturnAssetStatusNo;
    returnDate: string;
    notes: string | null;
    empId: string;
}



$(document).ready(async () => {
    const today = new Date().toISOString().split("T")[0] || "";

    $("#returnDate")
        .val(today)
        .attr("min", today);

    const { assets, totalCount } = await getAssetsAPI();
    appendAssetOptions(assets ?? []);
    appendReturnStatus();

    $("#issuedCount").text(totalCount || 0);
});

$("#returnForm").on("submit", async function (this: HTMLFormElement, event: JQuery.SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();

    const form = this;

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }
    const payload: ReturnAssetReq = {
        assetId: $("#issuedAsset").val() as string,
        reason: Number($("#returnStatus").val()),
        returnDate: $("#returnDate").val() as string,
        notes: $("#notes").val() as string,
        empId: $("#empId").val() as string
    };
    await returnAssetAPI(payload);
    clearForm();
    const { assets, totalCount } = await getAssetsAPI();
    appendAssetOptions(assets ?? []);
    $("#issuedCount").text(totalCount || 0);
});


$("#issuedAsset").on("change", async () => {

    const selectedText = $("#issuedAsset option:selected").text();
    const selectedVal = $("#issuedAsset  option:selected").val();
    const { history } = await getAssetAPI(selectedVal);
    $("#empId").val(history?.employee?.id);

    $("#returnSummaryContent").html(`
        <div class="text-start w-100">
            <small class="text-muted">Asset</small>
            <p class="fw-semibold mb-2">${selectedText}</p>
            <hr>
            <small class="text-muted">Employee Detail</small>
            <p class="mb-1">${history?.employee?.lastName ? history?.employee?.firstName + history.employee.lastName : history?.employee?.firstName}</p>
            <small class="text-muted">${history?.employee?.id}</small>
            <hr>
            <small class="text-muted">Issued Details</small>
            <p class="mb-1">Issued on ${moment(history.date).format("YYYY-MM-DD")}</p>
            <small class="text-muted">Duration: ${dayDifferent(new Date(history.date), new Date())} days</small>
        </div>
        <hr>
    `);
});

const dayDifferent = (fromDate: Date, toDate: Date) => {
    return moment(toDate).diff(fromDate, "days");
}

const clearForm = () => {
    $("#issuedAsset").val("<option value=''>Select asset to return</option>");
    $("#returnStatus").append("<option value=''>Select return reason</option>");
    $("#notes").val("");
    $("#empId").val("");
    $("#returnSummaryContent").html(`
            <i class="bi bi-box-seam fs-1 d-block mb-2"></i>
            <span>No asset selected</span>
        `);
}

// API Call
export const returnAssetAPI = async (payload: ReturnAssetReq) => {
    await fetchAPICall('POST', '/api/asset/return', 'save return asset', payload);

    openSuccessToast("Successfully asset returned");
};

export const getAssetAPI = async (id: string) => {
    const data: GetAssetAPIRes = await fetchAPICall('GET', `/api/asset/get/${id}`, 'get asset');

    return data;
};


export const getAssetsAPI = async () => {
    const params = `count=${null}&page=${1}&search=${null}&sortColumn=${AssetSortColumnKey.Name}&sortDirection=${SortDirection.Asc}&status=${AssetStatusNo.Issued}&branchId=${null}&categoryId=${null}`
    const data: GetAssetsAPI = await fetchAPICall('GET', `/api/assets?${params}`, 'get assets');

    return data;
};

const appendAssetOptions = (assets: GetAssetAPIRes[]) => {
    const $issuedAsset = $("#issuedAsset");
    $issuedAsset.empty();
    $issuedAsset.append(`<option value="">Select asset to return</option>`);
    assets.forEach((asset: GetAssetAPIRes) => {
        const option = `<option value="${asset.id}">${asset.name} - ${asset.category.name}</option>`;
        $issuedAsset.append(option);
    });
};

const appendReturnStatus = () => {
    const $returnStatus = $("#returnStatus");
    $returnStatus.empty();
    $returnStatus.append(`<option value="">Select return reason</option>`);

    for (const [key, value] of Object.entries(ReturnAssetStatus)) {
        $returnStatus.append(`<option value="${ReturnAssetStatusNo[key]}">${value}</option>`);
    }
}
import { fetchAPICall, openSuccessToast, SortDirection, type CommonAPIRes, type PaginationRes, } from "./common.js";
import { AssetSortColumnKey, AssetStatusNo, type GetAssetAPIRes } from "./asset.js";
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
export interface ScrapAssetReq {
    assetId: string;
    empId: string;
    scrapDate: string;
    notes: string | null;
}



$(document).ready(async () => {
    const today = new Date().toISOString().split("T")[0] || "";

    $("#scrapDate")
        .val(today)
        .attr("min", today);

    const { assets, totalCount } = await getAssetsAPI();
    appendAssetOptions(assets ?? []);

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
    const payload: ScrapAssetReq = {
        assetId: $("#scrapedAsset").val() as string,
        notes: $("#notes").val() as string,
        empId: $("#empId").val() as string,
        scrapDate: $("#scrapDate").val() as string,
    };
    await ScrapAssetAPI(payload);
    clearForm();
    const { assets, totalCount } = await getAssetsAPI();
    appendAssetOptions(assets ?? []);
    $("#issuedCount").text(totalCount || 0);
});


$("#scrapedAsset").on("change", async () => {

    const selectedText = $("#scrapedAsset option:selected").text();
    const selectedVal = $("#scrapedAsset  option:selected").val();
    const { history, createdAt } = await getAssetAPI(selectedVal);
    $("#empId").val(history?.employee?.id);

    $("#scrapSummaryContent").html(`
        <div class="text-start w-100">
            <small class="text-muted">Asset</small>
            <p class="fw-semibold mb-2">${selectedText}</p>
            <p class="fw-semibold mb-2">${selectedVal}</p>
            <hr>
            <small class="text-muted">Current status</small>
            <p class="mb-1 text-danger">Repair</p>
            <hr>
            <small class="text-muted">Purchase information</small>
            <p class="mb-1">${createdAt.split(" ")[0]}</p>
            <hr>
        </div>
    `);
});

const clearForm = () => {
    $("#scrapedAsset").val("<option value=''>Select asset to scrap</option>");
    $("#notes").val("");
    $("#empId").val("");
    $("#scrapSummaryContent").html(`
            <i class="bi bi-box-seam fs-1 d-block mb-2"></i>
            <span>No asset selected</span>
        `);
}

// API Call
export const ScrapAssetAPI = async (payload: ScrapAssetReq) => {
    await fetchAPICall('POST', '/api/asset/scrap', 'save scrap asset', payload);

    openSuccessToast("Successfully asset scraped");
};

export const getAssetAPI = async (id: string) => {
    const data: GetAssetAPIRes = await fetchAPICall('GET', `/api/asset/get/${id}`, 'get asset');

    return data;
};


export const getAssetsAPI = async () => {
    const params = `count=${null}&page=${1}&search=${null}&sortColumn=${AssetSortColumnKey.Name}&sortDirection=${SortDirection.Asc}&status=${AssetStatusNo.Return}&branchId=${null}&categoryId=${null}&returnStatus=${ReturnAssetStatus.Repair}`
    const data: GetAssetsAPI = await fetchAPICall('GET', `/api/assets?${params}`, 'get assets');

    return data;
};

const appendAssetOptions = (assets: GetAssetAPIRes[]) => {
    const $scrapedAsset = $("#scrapedAsset");
    $scrapedAsset.empty();
    $scrapedAsset.append(`<option value="">Select asset to scrap</option>`);
    assets.forEach((asset: GetAssetAPIRes) => {
        const option = `<option value="${asset.id}">${asset.name} - ${asset.category.name}</option>`;
        $scrapedAsset.append(option);
    });
};
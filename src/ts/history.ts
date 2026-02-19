import moment from "moment";
import { AssetStatusNo, type AssetHistory } from "./asset.js";
import { type CategoryDetail, fetchAPICall } from "./common.js";
import jQuery from "jquery";

declare var $: any;

// Get All Asset for Filter
export interface GetAllAsset {
    id: string;
    name: string;
    category: CategoryDetail;
}

// Get Asset History
export interface GetAssetAPIRes {
    assets: GetAllAsset[];
}

export interface AssetHistoryRes {
    histories: AssetHistory[];
}

// Get Status Count
export interface GetStatusCountRes {
    issuedCount: number;
    returnCount: number;
    totalCount: number;
}

$(document).ready(async () => {

    const assets = await getAllAssetAPI();
    appendAssetOptions(assets);

    const assetId = $("#assetId").val();
    renderHis(assetId);
});

$("#historyAsset").on("change", async function () {

    const assetId = $(this).val() as string;

    if (!assetId) {
        $("#timelineContent").html("No Asset History");
        $("#totalIssued").text(0);
        $("#totalReturn").text(0);
        $("#totalEvents").text(0);
        return;
    }
    $("#assetId").val(assetId);

    renderHis(assetId);
});

const renderHis = async (assetId: string) => {
    const [histories, summary] = await Promise.all([
        getAssetHisByAssetIdAPI(assetId),
        getAssetCountAPI(assetId)
    ]);
    $("#totalIssued").text(summary.issuedCount);
    $("#totalReturn").text(summary.returnCount);
    $("#totalEvents").text(summary.totalCount);
    renderTimeline(histories);
}



const renderTimeline = (histories: AssetHistory[]) => {

    const container = $("#timelineContent");
    container.empty();

    histories.forEach(item => {

        const name = item.employee?.lastName ? `${item.employee.firstName} ${item.employee.lastName}` : item.employee?.firstName || '';

        const card = `
        <div class="timeline-item">

            <div class="timeline-icon bg-${getColor(item.status, item.reasonStatus)}-subtle text-${getColor(item.status, item.reasonStatus)}">
                <i class="bi ${getIcon(item.status, item.reasonStatus)}"></i>
            </div>

            <div class="timeline-content">
                <h6 class="mb-1">${getTitleName(item.status, item.reasonStatus)}</h6>
                <small class="text-muted">${moment(new Date(item.date)).format('MMM DD, YYYY HH:mm A')}</small>
                ${name ? `<p class="mb-0 mt-2">Employee: ${name}</p>` : ''}
            </div>

        </div>
        `;

        container.append(card);
    });
};

const getTitleName = (status: number, reasonStatus: number | null) => {
    switch (status) {
        case AssetStatusNo.InStack: return "Purchase";
        case AssetStatusNo.Issued: return "Issued";
        case AssetStatusNo.Return: return "Returned";
        case AssetStatusNo.Scrap: return "Scrapped";
        default: return "Repair";
    }
};


const getIcon = (status: number, reasonStatus: number | null) => {
    switch (status) {
        case AssetStatusNo.InStack: return "bi-cart";
        case AssetStatusNo.Issued: return "bi-arrow-up-right";
        case AssetStatusNo.Return: return "bi-arrow-down-left";
        case AssetStatusNo.Scrap: return "bi-trash";
        default: return "bi-clock";
    }
};

const getColor = (status: number, reasonStatus: number | null) => {
    switch (status) {
        case AssetStatusNo.InStack: return "primary";
        case AssetStatusNo.Issued: return "success";
        case AssetStatusNo.Return: return "warning";
        case AssetStatusNo.Scrap: return "danger";
        default: return "dark";
    }
};

const appendAssetOptions = (assets: GetAllAsset[]) => {

    const $asset = $("#historyAsset");
    $asset.empty();
    $asset.append(`<option value="">Select Asset</option>`);
    assets.forEach((asset, index) => {

        $asset.append(
            `<option value="${asset.id}">
                ${asset.name} - ${asset.category.name}
            </option>`
        );
        if (index === 0) {
            $("#assetId").val(asset.id);
            $asset.val(asset.id);
        }

    });
};




// API Calls

export const getAssetCountAPI = async (id: string): Promise<GetStatusCountRes> => {
    const count: GetStatusCountRes = await fetchAPICall('GET', `/api/asset/history/status/count/${id}`, 'get asset status count');
    return count;
}

export const getAssetHisByAssetIdAPI = async (assetId: string): Promise<AssetHistory[]> => {
    const { histories }: AssetHistoryRes = await fetchAPICall('GET', `/api/asset/history/${assetId}`, 'get asset history');
    return histories;
}

export const getAllAssetAPI = async (): Promise<GetAllAsset[]> => {
    const { assets }: GetAssetAPIRes = await fetchAPICall('GET', `/api/asset/get/all`, 'get all asset');
    return assets;
}
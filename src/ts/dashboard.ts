import moment from "moment";
import { AssetStatus, AssetStatusNo, type AssetHistory } from "./asset.js";
import { fetchAPICall } from "./common.js";
import jQuery from "jquery";


// Get asset and employee counts for dashboard summary
export interface GetAssetEmpCountsRes {
    totalEmp: number;
    totalAsset: number;
    issuedAsset: number;
    stockAsset: number;
}

export interface DashboardSummaryDetail {
    title: string;
    count: number;
    icon: string;
    bg: string;
    color: string;
}

// Get Recent Activity
export interface GetRecentActivityAPIRes {
    recentActivities: AssetHistory[];
}




$(document).ready(async () => {

    const [summary, activity] = await Promise.all([
        getDashboardSummaryAPI(),
        getRecentActivityAPI()
    ]);

    $("#totalEmployees").text(summary.totalEmp);
    $("#totalAssets").text(summary.totalAsset);
    $("#issuedAssets").text(summary.issuedAsset);
    $("#stockAssets").text(summary.stockAsset);

    renderActivityCards(activity);
});

const renderActivityCards = (activities: AssetHistory[]) => {

    const container = $("#activityContainer");
    container.empty();

    if (!activities.length) {
        container.append(`<p class="text-muted">No recent activity</p>`);
        return;
    }

    activities.forEach(activity => {

        const html = `
        <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
                <h6 class="fw-semibold mb-1">${getTitleName(activity.status)}</h6>
                <small class="text-muted" >
                    Asset: ${activity.asset.name}
                </small>
                <br>
                ${activity.employee?.firstName ? `
                    <small class="text-muted" >
                        Employee: ${activity.employee?.lastName ? `${activity.employee?.firstName} ${activity.employee?.lastName}` : activity.employee?.firstName}
                    </small>` : ""
            }
            </div>
            <small class= "text-muted" >
                ${moment(new Date(activity.date)).format('YYYY-MM-DD')}
            </small>
        </div>
        <hr>
        `;

        container.append(html);
    });
};

const getTitleName = (status: number) => {
    switch (status) {
        case AssetStatusNo.InStack: return `Asset ${AssetStatus.InStack}`;
        case AssetStatusNo.Issued: return `Asset ${AssetStatus.Issued}`;
        case AssetStatusNo.Return: return `Asset ${AssetStatus.Return}`;
        case AssetStatusNo.Scrap: return `Asset ${AssetStatus.Scrap}ed`;
    }
}



// APIs Call

export const getRecentActivityAPI = async () => {
    const { recentActivities }: GetRecentActivityAPIRes = await fetchAPICall('GET', '/api/asset/resent/activity', 'get recent activity');
    return recentActivities;
}

export const getDashboardSummaryAPI = async () => {
    const res: GetAssetEmpCountsRes = await fetchAPICall("GET", '/api/asset/employee/count', 'get employee count');
    return res;
};

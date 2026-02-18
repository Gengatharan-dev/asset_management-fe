import { getBranchAPI, appendBranchOptions, openErrorModel, SortDirection } from "./common.js";
import { AssetSortColumnKey, AssetStatusNo, type GetAssetDetail } from "./asset.js";
import jQuery from "jquery";

declare var $: any;


export enum StockSortColumnNo {
    Name = 1,
    Category = 2,
    Brand = 3,
    Branch = 4,
    CreatedAt = 5,
}

let table: any;

$(document).ready( async () => {

    table = $('#stockTable').DataTable({
        processing: true,
        serverSide: true,
        paging: true,
        pageLength: 10,
        lengthChange: true,
        pagingType: "simple_numbers",
        searching: false,
        orderable: true,
        info: true,
        ajax: {
            url: "http://localhost:8101/api/assets",
            type: "GET",

            data: function (data: any) {
                const index = data.order?.[0]?.column || -1
                const sortColumn = getSortColumnName(index + 1);
                const sortDirection = data.order?.[0]?.dir == 'asc' ? SortDirection.Asc : SortDirection.Desc;
                return {
                    count: data.length,
                    page: (data.start / data.length) + 1,
                    search: $('#customSearch').val() || null,
                    status: AssetStatusNo.InStack,
                    sortColumn,
                    sortDirection,
                    categoryId: null,
                    branchId: $('#stockBranch').val() || null,
                };
            },

            dataSrc: function (json: any) {
                if (!json || !json.isSuccess || !json.data) {
                    openErrorModel(json.error);
                    return;
                }

                json.recordsTotal = json.data.totalCount;
                json.recordsFiltered = json.data.totalCount;

                return json.data.assets;
            }
        },
        columns: [
            {
                data: null,
                orderable: true,
                render: function (asset: GetAssetDetail) {
                    return `
                    <strong>${asset.name} </strong><br>
                    <small class="text-secondary">${asset.id}</small>
                `;
                }
            },
            {
                data: "category.name",
                orderable: true,
                render: function (name: string) {
                    return `<small class="text-muted">${name}</small>`;
                }
            },
            {
                data: null,
                orderable: true,
                render: function (asset: GetAssetDetail) {
                    return `
                    <strong>${asset.brand.name} </strong><br>
                    <small class="text-secondary">${asset.model.name}</small>
                `;
                }
            },
            {
                data: "branch.name",
                orderable: true,
            },
            {
                data: "createdAt",
                orderable: true,
            },
        ]
    });
    const branches = await getBranchAPI();
    appendBranchOptions(true, "#stockBranch", branches ?? []);


    // Custom Search
    $('#customSearch').on('keyup', function () {
        table.ajax.reload();
    });

    // Asset Branch Filter
    $('#stockBranch').on('change', function () {
        table.ajax.reload();
    });

    $('#assetTable').on('error.dt', function (e: any, settings: any, techNote: any, message: any) {
        openErrorModel(message);
        return;
    });
});

const getSortColumnName = (index: number) => {
    switch (index) {
        case StockSortColumnNo.Name:
            return AssetSortColumnKey.Name;
        case StockSortColumnNo.Category:
            return AssetSortColumnKey.Category;
        case StockSortColumnNo.Brand:
            return AssetSortColumnKey.Brand;
        case StockSortColumnNo.Branch:
            return AssetSortColumnKey.Branch;
        default:
            return AssetSortColumnKey.CreatedAt;
    }
};
import { getBranchAPI, appendBranchOptions, getCategoriesAPI, appendCategoryOptions as appendCategoryOptions, openErrorModel, openSuccessToast, resetForm, SortDirection, type CategoryDetail, type CommonAPIRes, fetchAPICall } from "./common.js";
import type { DepartmentDetail } from "./employee.js";
import jQuery from "jquery";

declare var $: any;
let assetModal: any;
declare var bootstrap: any;


export enum AssetSortColumnKey {
    Name = "name",
    CreatedAt = "created_at",
    Category = "category",
    Brand = "brand",
    Branch = "branch",
    Status = "status",
}

export enum AssetStatusNo {
    InStack = 1,
    Issued = 2,
    Return = 3,
    Scrap = 4,
}

export enum AssetStatus {
    InStack = 'In Stack',
    Issued = 'Issued',
    Return = 'Return',
    Scrap = "Scrap",
}

export enum AssetSortColumnNo {
    Name = 1,
    Category = 2,
    Brand = 3,
    Branch = 4,
    Status = 5,
    CreatedAt = 6,
}

export interface BranchDetail {
    id: number;
    name: string;
}

export interface BrandDetail extends BranchDetail { }
export interface BrandModelDetail extends BranchDetail { }

export interface GetAssetDetail {
    id: string,
    name: string;
    status: number;
    category: CategoryDetail;
    brand: BrandDetail,
    model: BrandModelDetail,
    branch: BranchDetail;
    createdAt: string;
}

export interface BranchModelDetail {
    id: number;
    name: string
}

// Add Asset
export interface AddAssetReq {
    name: string;
    categoryId: number;
    brandId: number;
    modelId: number;
    branchId: number;
}

export interface AddAssetAPIRes {
    isAdded: boolean;
}

export interface AddAssetRes extends CommonAPIRes<AddAssetAPIRes> { }

// Update asset API
export interface UpdateAssetAPIRes {
    isUpdated: boolean;
}

export interface UpdateAssetRes extends CommonAPIRes<UpdateAssetAPIRes> { }

// Get Asset API(:id)
export interface EmployeeDetail {
    id: string,
    firstName: string;
    lastName: string | null;
    email: string;
    departmentId: number;
    branchId: number;
    createdAt: string;
    isActive: boolean;
    joiningAt: string;
    reLeavingAt: string | null;
}

export interface AssetDetail {
    id: string;
    name: string;
    categoryId: number;
    brandId: number;
    modelId: number;
    status: number;
    createdAt: string;
    category: CategoryDetail;
    brand: BrandDetail;
    model: BranchModelDetail;
    branch: BranchDetail;
}

export interface AssetHistory {
    id: string;
    assetId: string;
    empId: string;
    status: number;
    date: string;
    reasonStatus: number | null;
    createdAt: string;
    notes: string | null;
    asset: AssetDetail;
    employee: EmployeeDetail | null;
}

export interface GetAssetAPIRes {
    id: string;
    name: string;
    email: string;
    status: number;
    category: CategoryDetail;
    brand: BranchDetail;
    model: BranchModelDetail;
    branch: BranchDetail;
    createdAt: string;
    history: AssetHistory;
    department: DepartmentDetail;
}

export interface GetAssetRes extends CommonAPIRes<GetAssetAPIRes> { }

// Add Brand 
export interface AddBrandReq {
    name: string;
    isActive: boolean;
}
export interface AddBrandRes {
    isAdded: boolean;
}

// Get Brand 
export interface GetBrand {
    id: number,
    name: string,
    isActive: boolean,
    createdAt: string,
}

export interface GetBrandAPIRes {
    brands: GetBrand[]
}

export interface GetBrandRes extends CommonAPIRes<GetBrandAPIRes> { }

// Add Model
export interface AddModelReq {
    name: string;
    isActive: boolean;
    categoryId: number;
}

// Get Models
export interface GetModelDetail extends GetBrand {
    categoryId: number;
}
export interface GetModelAPIRes {
    models: GetModelDetail[]
}
export interface GetModelRes extends CommonAPIRes<GetModelAPIRes> { }

let table: any;

$(document).ready(async () => {

    table = $('#assetTable').DataTable({
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
                    status: $('#assetStatus').val() || null,
                    sortColumn,
                    sortDirection,
                    categoryId: $('#categoryFilter').val() || null,
                    branchId: $('#assetBranch').val() || null,
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
                data: "status",
                orderable: true,
                render: function (data: number) {
                    return getAssetStatus(data);
                }
            },
            {
                data: "createdAt",
                orderable: true,
            },
            {
                data: null,
                orderable: false,
                render: function (data: GetAssetDetail) {
                    return data.status === AssetStatusNo.Scrap ? "" : `<button class="btn btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-2 edit-btn"
                                data-id="${data.id}">
                                <i class="bi bi-pencil-square"></i>
                            </button>`;
                }
            }
        ]
    });
    getStatusOption();
    const [
        branches,
        categories
    ] = await Promise.all([
        getBranchAPI(),
        getCategoriesAPI(),
    ]);
    appendBranchOptions(true, "#assetBranch", branches ?? []);
    appendCategoryOptions("#categoryFilter", categories ?? []);


    // Custom Search
    $('#customSearch').on('keyup', function () {
        table.ajax.reload();
    });

    // Status Filter
    $('#assetStatus').on('change', function () {
        table.ajax.reload();
    });

    // Category Filter
    $('#categoryFilter').on('change', function () {
        table.ajax.reload();
    });

    // Asset Branch Filter
    $('#assetBranch').on('change', function () {
        table.ajax.reload();
    });

    $('#assetTable').on('error.dt', function (e: any, settings: any, techNote: any, message: any) {
        openErrorModel(message);
        return;
    });


    // Add/Edit Asset
    assetModal = new bootstrap.Modal(
        document.getElementById("assetModal")
    );

    // Open the Model
    $("#addAssetBtn").on("click", async () => {
        $("#assetModalTitle").text("Add New Asset");
        $("#assetId").val("");

        clearForm();

        assetModal.show();
        await getAddAndEditAssetFormDetail();
    });


    // Edit button click (from DataTable)
    $('#assetTable').on('click', '.edit-btn', async function (this: JQuery) {

        const rowData = table.row($(this).closest('tr')).data();
        const asset = await getAssetById(rowData.id);
        await getAddAndEditAssetFormDetail();
        console.log(asset?.model.id);
        if (asset) {
            $("#assetModalTitle").text("Edit Asset");
            $("#assetId").val(asset.id);
            $("#name").val(asset.name);
            $("#category").val(asset.category.id).trigger('change');

            const models = await getModelAPI(asset.category.id);
            appendModelOptions(models ?? []);

            $("#brand").val(asset.brand.id).trigger('change');
            $("#assetModelBranch").val(asset.branch.id).trigger("change");
            $("#model").val(asset.model.id).trigger("change");
        }

        assetModal.show();
    });
});


export const getAddAndEditAssetFormDetail = async () => {
    const [
        categories,
        branches,
        brands,
    ] = await Promise.all([
        getCategoriesAPI(),
        getBranchAPI(),
        getBrandAPI(),
    ]);
    appendCategoryOptions("#category", categories ?? []);
    appendBranchOptions(false, "#assetModelBranch", branches ?? []);
    appendBrandOption(brands ?? []);
    appendBranchOptions(false, "#assetBranch", branches ?? []);
}

export const getAssetStatus = (status: number) => {
    switch (status) {
        case AssetStatusNo.InStack:
            return `<span class="badge bg-success text-white" >
                        ${AssetStatus.InStack}
                    </span>`;
        case AssetStatusNo.Issued:
            return `<span class="badge bg-primary text-white" >
                        ${AssetStatus.Issued}
                    </span>`;
        case AssetStatusNo.Return:
            return `<span class="badge bg-warning text-white" >
                        ${AssetStatus.Return}
                    </span>`;

        default:
            return `<span class="badge bg-danger text-white" >
                        ${AssetStatus.Scrap}
                    </span>`;
    }
};

export const getStatusOption = () => {
    const $status = $("#assetStatus");
    $status.empty();
    $status.append(`<option value="">All Status</option>`);

    for (const [key, value] of Object.entries(AssetStatus)) {
        $status.append(`<option value="${AssetStatusNo[key]}">${value}</option>`);
    }
}

const getSortColumnName = (index: number) => {
    switch (index) {
        case AssetSortColumnNo.Name:
            return AssetSortColumnKey.Name;
        case AssetSortColumnNo.Category:
            return AssetSortColumnKey.Category;
        case AssetSortColumnNo.Brand:
            return AssetSortColumnKey.Brand;
        case AssetSortColumnNo.Branch:
            return AssetSortColumnKey.Branch;
        case AssetSortColumnNo.Status:
            return AssetSortColumnKey.Status;
        default:
            return AssetSortColumnKey.CreatedAt;
    }
}

function clearForm() {
    $("#name").val("");
    $("#category").val("");
    $("#brand").val('');
    $("#model").val('');
    $("#assetModelBranch").val('');
}

export const getAssetById = async (id: string): Promise<GetAssetAPIRes | undefined> => {

    const data: GetAssetAPIRes = await fetchAPICall('GET', `/api/asset/get/${id}`, 'get asset');

    return data;
}

// category
$('#category').on('change', async function () {
    ``
    const categoryId = Number($(this).val()) || undefined;
    if (!categoryId) {
        appendModelOptions([]);
        return;
    }
    const models = await getModelAPI(categoryId);
    appendModelOptions(models ?? []);

});

$("#assetModal").on("hidden.bs.modal", () => {
    resetForm("assetForm");
    resetBrandSection();
    resetModelSection();
});

// Save button (add / edit)
$("#assetForm").on("submit", async function (this: HTMLFormElement, event: JQuery.SubmitEvent) {
    const id = $("#assetId").val();
    assetFormValidation(this as HTMLFormElement, event);

    const payload: AddAssetReq = {
        name: $("#name").val() as string,
        categoryId: Number($("#category").val()),
        brandId: Number($("#brand").val()),
        modelId: Number($("#model").val()),
        branchId: Number($("#assetModelBranch").val()),
    };

    try {
        if (id) await updateAssetAPI(id, payload);
        else await addAssetAPI(payload);

        assetModal.hide();
        table.ajax.reload();

    } catch (error: any) {
        openErrorModel(error?.message || error.response?.data?.error || "Error saving asset");
        return;
    }

});

const updateAssetAPI = async (id: string, payload: AddAssetReq) => {
    await fetchAPICall('PUT', `/api/asset/update/${id}`, 'update asset', payload);

    openSuccessToast("Successfully updated asset detail");
}

const addAssetAPI = async (payload: AddAssetReq) => {
    await fetchAPICall('POST', `/api/asset/add`, 'add asset', payload);

    openSuccessToast("Successfully added asset detail");
}

const assetFormValidation = (form: HTMLFormElement, event: JQuery.SubmitEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }
};

$("#openBrandForm").on("click", function () {
    resetModelSection(true);
    $("#newBrandWrapper").removeClass("d-none");
});

$("#openModelForm").on("click", function () {
    resetBrandSection(true);
    $("#newModelWrapper").removeClass("d-none");
});



$("#saveBrandBtn").on("click", async () => {

    const name = $("#newBrandName");
    const status = $("#brandStatus");
    const isValid = customBrandAndModelFormValidation(name, status);
    if (!isValid) return;

    const params = {
        name: name.val() as string,
        isActive: status.val() === "true",
    }

    try {
        await addBrandAPI(params);
        const brands = await getBrandAPI();

        appendBrandOption(brands ?? []);

        openSuccessToast("Brand added successfully");
        resetBrandSection();

    } catch (error: any) {
        openErrorModel(error?.message || error.response?.data?.error);
        return;
    }

});

const customBrandAndModelFormValidation = (name: any, status: any) => {

    let isValid = true;

    if (!name.val() || name.val().length < 2) {
        name.addClass("is-invalid");
        isValid = false;
    } else {
        name.removeClass("is-invalid");
    }

    // Status validation
    if (!status.val()) {
        status.addClass("is-invalid");
        isValid = false;
    } else {
        status.removeClass("is-invalid");
    }

    return isValid;
};

const appendBrandOption = (brands: GetBrand[]) => {
    const brand = $("#brand");
    brand.empty();
    brand.append(`<option value="">Select Brand</option>`);
    brands.forEach(brd => {
        brand.append(
            `<option value="${brd.id}">${brd.name}</option>`
        );
    });
};

const addBrandAPI = async (params: AddBrandReq) => {
    await fetchAPICall('POST', `/api/brand/add`, 'add branch', params);

    openSuccessToast("Successfully added brand detail");
};

const getBrandAPI = async () => {
    const data: GetBrandAPIRes = await fetchAPICall('GET', `/api/brands`, 'get brands');
    return data?.brands || [];
};

const resetBrandSection = (hideSection = false) => {
    $("#newBrandWrapper").addClass("d-none");
    $("#newBrandName").val("").removeClass("is-invalid");
    if (!hideSection) {
        $("#brandStatus").val("").removeClass("is-invalid");
        $("#brand").val("");
    }
};

const resetModelSection = (hideSection = false) => {
    $("#newModelWrapper").addClass("d-none");
    $("#newModelName").val("").removeClass("is-invalid");
    if (!hideSection) {
        $("#modelStatus").val("").removeClass("is-invalid");
        $("#model").val("");
    }
};

$("#saveModelBtn").on("click", async () => {

    const name = $("#newModelName");
    const status = $("#modelStatus");
    const isValid = customBrandAndModelFormValidation(name, status);
    if (!isValid) return;

    const params: AddModelReq = {
        name: name.val() as string,
        isActive: status.val() === "true",
        categoryId: Number($("#category").val()),
    }

    try {
        await addModelAPI(params);
        const models = await getModelAPI(params.categoryId);
        appendModelOptions(models ?? []);

        openSuccessToast("Model added successfully");
        resetModelSection();
    } catch (error: any) {
        openErrorModel(error?.message || error.response?.data?.error);
        return;
    }
});

const appendModelOptions = (models: GetBrand[]) => {
    const model = $("#model");
    model.empty();
    model.append(`<option value="">Select Model</option>`);
    models.forEach(mdl => {
        model.append(
            `<option value="${mdl.id}">${mdl.name}</option>`
        );
    });
};

const addModelAPI = async (params: AddBrandReq) => {
    await fetchAPICall('POST', `/api/model/add`, 'add brand', params);

    openSuccessToast("Successfully added model detail");
};

const getModelAPI = async (categoryId: number) => {
    const data: GetModelAPIRes = await fetchAPICall('GET', `/api/models?categoryId=${categoryId}`, 'get models');
    return data.models || [];
};
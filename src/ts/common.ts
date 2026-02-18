import type { BranchDetail, DepartmentDetail } from "./employee.js";


declare var bootstrap: any;

export enum SortDirection {
    Asc = "ASC",
    Desc = "DESC",
}

export interface PaginationRes {
    totalCount: number;
    totalPage: number;
}

export interface CommonAPIRes<T> {
    isSuccess: boolean;
    error?: string;
    data?: T;
}

// API: /api/departments
export interface GetDepartmentsAPIRes {
    departments: DepartmentDetail[];
}
export interface GetDepartmentsRes extends CommonAPIRes<GetDepartmentsAPIRes> { }

// API: /api/branches
export interface GetBranchesAPIRes {
    branches: BranchDetail[];
}
export interface GetBranchesRes extends CommonAPIRes<GetBranchesAPIRes> { }

// API: /api/categories
export interface CategoryDetail extends BranchDetail {
    isActive: boolean,
    createdAt: string,
    description: string | null;
}

export interface GetCategoryAPIRes {
    categories: CategoryDetail[];
}

export interface GetCategoriesRes extends CommonAPIRes<GetCategoryAPIRes> { }

export const openErrorModel = (message: string) => {
    $('#errorMessage').text(message);
    const modal = new bootstrap.Modal(
        document.getElementById('errorModal')
    );

    modal.show();
}

export const openSuccessToast = (message: string) => {

    const toastEl = document.getElementById("successToast");
    if (!toastEl) return;

    $("#successToastMessage").text(message);

    const toast = new (window as any).bootstrap.Toast(toastEl, {
        delay: 3000
    });

    toast.show();
};

export const resetForm = (id: string) => {

    const form = document.getElementById(id) as HTMLFormElement;
    form.reset();
    form.classList.remove("was-validated");
    $(".text-danger").addClass("d-none");
};

// API Call
export const getDepartmentAPI = async () => {
    const data = await fetchAPICall('GET', `/api/departments`, 'get departments');
    return data?.departments || [];
};

export const appendDepartmentOptions = (departments: DepartmentDetail[]) => {
    const $department = $("#department");

    $department.empty();
    $department.append(`<option value="">Select Department</option>`);

    departments.forEach(dep => {
        $department.append(
            `<option value="${dep.id}">${dep.name}</option>`
        );
    });
}

export const getBranchAPI = async () => {
    const data: GetBranchesAPIRes = await fetchAPICall('GET', `/api/branches`, 'get branches');
    return data?.branches || [];
};

export const appendBranchOptions = (isFilter = false, id: string, branches: BranchDetail[]) => {
    const $branch = $(id);
    let firstOption = "Select Branch";
    if (isFilter) firstOption = "All Branch";
    $branch.empty();
    $branch.append(`<option value="">${firstOption}</option>`);
    branches.forEach(branch => {
        $branch.append(`<option value="${branch.id}">${branch.name}</option>`);
    });
}

export const getCategoriesAPI = async () => {
    const data: GetCategoryAPIRes = await fetchAPICall('GET', `/api/categories`, 'get categories');

    return data?.categories || [];
};

export const appendCategoryOptions = (id: string, categories: CategoryDetail[]) => {
    const $category = $(id);

    $category.empty();
    $category.append(`<option value="">All Category</option>`);

    categories.forEach(category => {
        $category.append(
            `<option value="${category.id}">${category.name}</option>`
        );
    });
};


export const fetchAPICall = async<T>(method: string, url: string, methodCallMessage: string, payload?: T) => {
    try {
        const API_DOMAIN = process.env.PARCEL_API_DOMAIN;
        if (!API_DOMAIN) {
            openErrorModel("API domain not found in env file");
            return;
        }
        const res = await fetch(`${API_DOMAIN}${url}`, {
            method,
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const { data, isSuccess, error } = await res.json();
        if (!isSuccess || error) {
            openErrorModel(error || `Error in ${methodCallMessage}`);
            return;
        };
        return data;
    } catch (error: any) {
        openErrorModel(error?.message || error.response?.data?.message || `Error in ${methodCallMessage}`);
        return;
    }
};
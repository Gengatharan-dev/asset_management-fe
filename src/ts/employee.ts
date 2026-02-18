import { fetchAPICall, appendBranchOptions, appendDepartmentOptions, getBranchAPI, getDepartmentAPI, openErrorModel, openSuccessToast, resetForm, SortDirection, type CommonAPIRes } from "./common.js";
import jQuery from "jquery";


declare var $: any;
let employeeModal: any;
declare var bootstrap: any;


export enum SortColumnKey {
    Name = "name",
    Email = "email",
    Department = "department",
    JoiningAt = "joining_at",
    Status = "status",
    Branch = "branch",
}

export enum SortColumnNo {
    Name = 1,
    Email = 2,
    Department = 3,
    Branch = 4,
    Status = 5,
    JoiningAt = 7,
}

export interface DepartmentDetail {
    id: number;
    name: string;
}

export interface BranchDetail {
    id: number;
    name: string;
}

export interface GetEmployeeDetail {
    id: string,
    firstName: string;
    lastName: string | null;
    email: string;
    department: DepartmentDetail;
    branch: BranchDetail;
    createdAt: string;
    isActive: boolean;
    joiningAt: string;
    reLeavingAt: string | null;
    assetCount: number;
}

// add Employee
export interface AddEmployeeReq {
    firstName: string;
    lastName: string | null;
    email: string;
    departmentId: number;
    branchId: number;
    isActive: boolean;
}

export interface AddEmployeeAPIRes {
    isAdded: boolean;
}

export interface AddEmployeeRes extends CommonAPIRes<AddEmployeeAPIRes> { }

export interface UpdateEmployeeAPIRes {
    isUpdated: boolean;
}

export interface UpdateEmployeeRes extends CommonAPIRes<UpdateEmployeeAPIRes> { }

// Get API(:id)
export interface GetEmployeeAPIRes {
    id: string,
    firstName: string;
    lastName: string | null;
    email: string;
    createdAt: string;
    joiningAt: string;
    isActive: boolean;
    reLeavingAt: string | null;
    assetCount?: number;
    department: DepartmentDetail;
    branch: BranchDetail;
}
export interface GetEmployeeRes extends CommonAPIRes<GetEmployeeAPIRes> { }

let table: any;

$(document).ready(async () => {

    table = $('#employeeTable').DataTable({
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
            url: "http://localhost:8101/api/employees",
            type: "GET",

            data: function (data: any) {
                const index = data.order?.[0]?.column || -1
                const sortColumn = getSortColumnName(index + 1);
                const sortDirection = data.order?.[0]?.dir == 'asc' ? SortDirection.Asc : SortDirection.Desc;
                return {
                    count: data.length,
                    page: (data.start / data.length) + 1,
                    search: $('#customSearch').val() || null,
                    isActive: $('#statusFilter').val() === 'active'
                        ? true
                        : $('#statusFilter').val() === 'inactive'
                            ? false
                            : null,
                    sortColumn,
                    sortDirection,
                };
            },

            dataSrc: function (json: any) {
                if (!json || !json.isSuccess || !json.data) {

                    openErrorModel(json.error);

                    return;
                }

                json.recordsTotal = json.data.totalCount;
                json.recordsFiltered = json.data.totalCount;

                return json.data.employees;
            }
        },
        columns: [
            {
                data: null,
                orderable: true,
                render: function (data: GetEmployeeDetail) {
                    return `
                    <strong>${data.firstName} ${data.lastName || ''}</strong><br>
                    <small class="text-secondary">${data.id}</small>
                `;
                }
            },
            {
                data: "email",
                orderable: true,
                render: function (email: string) {
                    return `<small class="text-muted">${email}</small>`;
                }
            },
            {
                data: "department.name",
                orderable: true,
            },
            {
                data: "branch.name",
                orderable: true,
            },
            {
                data: "isActive",
                orderable: true,
                render: function (data: boolean) {
                    return `
                    <span class="badge bg-dark">
                        ${data ? "Active" : "Inactive"}
                    </span>
                `;
                }
            },
            {
                data: "assetCount",
                orderable: false
            },
            {
                data: "joiningAt",
                orderable: true,
            },
            {
                data: null,
                orderable: false,
                render: function (data: GetEmployeeDetail) {
                    return `<button class="btn btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-2 edit-btn"
                                data-id="${data.id}">
                                <i class="bi bi-pencil-square"></i>
                            </button>`;
                }
            }
        ]
    });


    // Custom Search
    $('#customSearch').on('keyup', function () {
        table.ajax.reload();
    });

    // Status Filter
    $('#statusFilter').on('change', function () {
        table.ajax.reload();
    });

    $('#employeeTable').on('error.dt', function (e: any, settings: any, techNote: any, message: any) {
        openErrorModel(message);
        return;
    });


    // Add/Edit Employee
    employeeModal = new bootstrap.Modal(
        document.getElementById("employeeModal")
    );

    // Open the Model
    $("#addEmployeeBtn").on("click", async () => {
        $("#employeeModalTitle").text("Add New Employee");
        $("#employeeId").val("");

        clearForm();

        employeeModal.show();
        const departments = await getDepartmentAPI();
        appendDepartmentOptions(departments ?? []);
        const branches = await getBranchAPI();
        appendBranchOptions(false, "#branch", branches ?? []);
    });


    // Edit button click (from DataTable)
    $('#employeeTable').on('click', '.edit-btn', async function (this: JQuery) {

        const rowData = table.row($(this).closest('tr')).data();
        const employee = await getEmployeeByIdAPI(rowData.id);
        const departments = await getDepartmentAPI();
        appendDepartmentOptions(departments ?? []);
        const branches = await getBranchAPI();
        appendBranchOptions(false, "#branch", branches ?? []);

        if (employee) {
            $("#employeeModalTitle").text("Edit Employee");
            $("#employeeId").val(employee.id);
            $("#firstName").val(employee.firstName);
            $("#lastName").val(employee.lastName || "");
            $("#email").val(employee.email);
            $("#department").val(employee.department.id).trigger("change");
            $("#branch").val(employee.branch.id).trigger("change");
            $("#status").val(employee.isActive.toString());
        }

        employeeModal.show();
    });
});

const getSortColumnName = (index: number) => {
    switch (index) {

        case SortColumnNo.Name:
            return SortColumnKey.Name;
        case SortColumnNo.Email:
            return SortColumnKey.Email;
        case SortColumnNo.Department:
            return SortColumnKey.Department;
        case SortColumnNo.Branch:
            return SortColumnKey.Branch;
        case SortColumnNo.Status:
            return SortColumnKey.Status;
        default:
            return SortColumnKey.JoiningAt;
    }
}


function clearForm() {
    $("#firstName").val("");
    $("#lastName").val("");
    $("#email").val("");
    $("#department").val("");
    $("#branch").val("");
    $("#status").val("true");
}

export const getEmployeeByIdAPI = async (id: string): Promise<GetEmployeeAPIRes | undefined> => {
    const employee: GetEmployeeAPIRes = await fetchAPICall('GET', `/api/employee/get/${id}`, 'get employee');
    return employee;
}

$("#employeeModal").on("hidden.bs.modal", function () {
    resetForm("employeeForm");
});


// Save button (add / edit)
$("#employeeForm").on("submit", async function (this: HTMLFormElement, event: JQuery.SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();

    const form = this;

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const id = $("#employeeId").val();

    const payload: AddEmployeeReq = {
        firstName: $("#firstName").val() as string,
        lastName: $("#lastName").val() || null,
        email: $("#email").val() as string,
        departmentId: Number($("#department").val()),
        branchId: Number($("#branch").val()),
        isActive: $("#status").val() === "true"
    };

    try {
        if (id) { await updateEmployeeAPI(id, payload); }
        else { await addEmployeesAPI(payload); }

        employeeModal.hide();
        table.ajax.reload();

    } catch (error: any) {
        openErrorModel(error.response?.data?.message || "Error saving employee");
        return;
    }

});

export const addEmployeesAPI = async (payload: AddEmployeeReq) => {

    await fetchAPICall('POST', `/api/employee/add`, 'add employee', payload);

    openSuccessToast("Successfully added employee detail");
};

export const updateEmployeeAPI = async (id: string, payload: AddEmployeeReq) => {

    await fetchAPICall('PUT', `/api/employee/update/${id}`, 'update employee', payload);

    openSuccessToast("Successfully updated employee detail");
};
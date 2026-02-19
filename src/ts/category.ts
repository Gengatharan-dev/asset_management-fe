import moment from "moment";
import { fetchAPICall, getCategoriesAPI, openSuccessToast, type CategoryDetail, type GetCategoryAPIRes } from "./common.js";
import jQuery from "jquery";

declare var $: any;
let categoryModal: any;
declare var bootstrap: any;

// Add category
export interface AddCategoryReq {
    name: string;
    isActive: boolean;
    description: string | null;
}

$(document).ready(async () => {
    const categories = await getCategoriesAPI();
    renderCategoryCards(categories);


    categoryModal = new bootstrap.Modal(
        document.getElementById("categoryModal")
    );

    // Open the Model
    $("#addCategoryBtn").on("click", async function () {
        $("#categoryModalTitle").text("Add New Category");
        $("#categoryId").val("");

        clearForm();
        categoryModal.show();
    });

    // open the edit model 
    $(document).on("click", ".edit-btn", async function () {
        const categoryId = $(this).data("id");

        if (!categoryId) return;
        $("#categoryModalTitle").text("Edit Category");

        const category = await getCategoryAPICall(categoryId);

        if (!category) return;

        $("#categoryId").val(category.id);
        $("#categoryName").val(category.name);
        $("#categoryStatus").val(category.isActive.toString());
        $("#categoryDescription").val(category.description ?? "");

        categoryModal.show();
    });

    // delete category
    $(document).on("click", ".delete-btn", async function () {
        const categoryId = $(this).data("id");

        if (!categoryId) return;

        await deleteCategoryAPICall(categoryId);

        const categories = await getCategoriesAPI();
        renderCategoryCards(categories);
    });
});

// Save button (add / edit)
$("#categoryForm").on("submit", async function (this: HTMLFormElement, event: JQuery.SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();

    const form = this;

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const id = $("#categoryId").val();

    const payload: AddCategoryReq = {
        name: $("#categoryName").val() as string,
        isActive: $("#categoryStatus").val() === "true",
        description: $("#categoryDescription").val() ?? null,
    };

    if (id) { await updateCategoryAPICall(id, payload); }
    else { await addCategoryAPICall(payload); }

    categoryModal.hide();
    const categories = await getCategoriesAPI();
    renderCategoryCards(categories);
});

export const clearForm = () => {
    $("#categoryName").val("");
    $("#categoryStatus").val("true");
    $("#categoryDescription").val("");
};

const renderCategoryCards = (categories: CategoryDetail[]) => {
    const container = $("#categoryCardContainer");
    container.empty();

    categories.forEach((category) => {
        const card = `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card category-card h-100 p-4">

                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="fw-semibold mb-1">${category.name}</h5>
                        <msmall class="text-muted">${category.isActive ? "<span class='text-success'>Active</span>" : "<span class='text-danger'>Inactive</span>"}</msmall>
                    </div>
                </div>

                <p class="text-muted mt-3 mb-4" id="description">
                    ${category.description ?? "No description available"}
                </p>

                <small class="text-muted d-block mb-3">
                    Created: ${moment(new Date(category.createdAt)).format('MMM DD, YYYY')}
                </small>

                <hr>

                <div class="card-footer bg-white border-0">
                    <div class="d-flex gap-2">

                        <button class="btn btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-2 edit-btn"
                                data-id="${category.id}">
                            <i class="bi bi-pencil-square"></i>
                            Edit
                        </button>

                        <button class="btn btn-outline-danger d-flex align-items-center justify-content-center delete-btn"
                                data-id="${category.id}"
                                style="width:45px;">
                            <i class="bi bi-trash"></i>
                        </button>

                    </div>
                </div>


            </div>
        </div>
        `;

        container.append(card);
    });
};


// API Call
export const addCategoryAPICall = async (payload: AddCategoryReq) => {
    await fetchAPICall('POST', '/api/category/add', 'add Category', payload);
    openSuccessToast('Successfully added category');
}

export const updateCategoryAPICall = async (id: string, payload: AddCategoryReq) => {
    await fetchAPICall('PUT', `/api/category/update/${id}`, 'update Category', payload);
    openSuccessToast('Successfully updated category');
}

export const getCategoryAPICall = async (id: number) => {
    const category: CategoryDetail = await fetchAPICall('GET', `/api/category/get/${id}`, 'get Category');
    return category;
}

export const deleteCategoryAPICall = async (id: number) => {
    await fetchAPICall('DELETE', `/api/category/delete/${id}`, 'delete Category');
    openSuccessToast('Successfully deleted category');
}

// <span class="badge bg-light text-dark" > ${ 0 } </span>

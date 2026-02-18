import jQuery from "jquery";



$(document).ready( () => {
    const currentPage = window.location.pathname;

    const links = document.querySelectorAll(".nav-link");

    links.forEach(link => {
        const href = link.getAttribute("href");

        if (href && currentPage.includes(href)) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});

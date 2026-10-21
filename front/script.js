const form = document.querySelector("#login-form");
const roleOptions = document.querySelectorAll(".role-option");
const title = document.querySelector("#login-title");
const description = document.querySelector("#login-description");
const submitButton = document.querySelector(".submit-button");
const message = document.querySelector("#form-message");
const footer = document.querySelector("#card-footer");
const residentBlockField = document.querySelector("#resident-block-field");
const blockInput = document.querySelector("#block");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#password-toggle");
const loginPage = document.querySelector("#login-page");
const noticePage = document.querySelector("#notice-page");
const accountName = document.querySelector("#account-name");
const logoutButton = document.querySelector("#logout-button");
const showNoticeFormButton = document.querySelector("#show-notice-form");
const noticeForm = document.querySelector("#notice-form");
const cancelNoticeButton = document.querySelector("#cancel-notice");
const noticeList = document.querySelector("#notice-list");
const noticeMessage = document.querySelector("#notice-message");
const reservationSection = document.querySelector("#reservation-section");
const reservationForm = document.querySelector("#reservation-form");
const reservationMessage = document.querySelector("#reservation-message");
const reservationSubmitButton = reservationForm.querySelector('button[type="submit"]');
const eventDateInput = document.querySelector("#event-date");
const eventTimeInput = document.querySelector("#event-time");
const adminReservationsSection = document.querySelector("#reservations-admin-section");
const adminReservationsMessage = document.querySelector("#admin-reservations-message");
const reservationsList = document.querySelector("#reservations-list");
const noticeStorageKey = "condominio-viver-bem-avisos";
const apiBaseUrl = "http://127.0.0.1:5432";

let selectedRole = "morador";
let currentRole = null;
let syndicAuthorization = null;

const roleContent = {
    morador: {
        title: "Bem-vindo de volta",
        description: "Entre com seus dados para acessar sua conta.",
        button: "Entrar como morador",
        footer: "Acesso para moradores do condomínio"
    },
    sindico: {
        title: "Acesso do síndico",
        description: "Entre com suas credenciais administrativas.",
        button: "Entrar como síndico",
        footer: "Acesso exclusivo para a administração"
    }
};

function loadNotices() {
    const savedNotices = localStorage.getItem(noticeStorageKey);
    if (!savedNotices) return [];

    const notices = JSON.parse(savedNotices);
    if (!Array.isArray(notices)) {
        throw new Error("Os avisos salvos estão em um formato inválido.");
    }
    return notices;
}

function renderNotices(notices) {
    noticeList.replaceChildren();

    if (notices.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-notices";
        emptyMessage.textContent = "Ainda não há avisos publicados.";
        noticeList.append(emptyMessage);
        return;
    }

    notices
        .map((notice, index) => ({ notice, index }))
        .sort((first, second) => new Date(second.notice.createdAt) - new Date(first.notice.createdAt))
        .forEach(({ notice, index }) => {
            const card = document.createElement("article");
            card.className = "notice-card";

            const category = document.createElement("span");
            category.className = "notice-category";
            category.textContent = notice.category;

            const heading = document.createElement("h2");
            heading.textContent = notice.title;

            const date = document.createElement("time");
            date.dateTime = notice.createdAt;
            date.textContent = new Date(notice.createdAt).toLocaleString("pt-BR", {
                dateStyle: "medium",
                timeStyle: "short"
            });

            const body = document.createElement("p");
            body.className = "notice-body";
            body.textContent = notice.body;

            card.append(category, heading, date, body);

            if (currentRole === "sindico") {
                const removeButton = document.createElement("button");
                removeButton.className = "remove-notice-button";
                removeButton.type = "button";
                removeButton.textContent = "Remover aviso";
                removeButton.setAttribute("aria-label", `Remover aviso: ${notice.title}`);
                removeButton.addEventListener("click", () => {
                    try {
                        const currentNotices = loadNotices();
                        currentNotices.splice(index, 1);
                        localStorage.setItem(noticeStorageKey, JSON.stringify(currentNotices));
                        renderNotices(currentNotices);
                        noticeMessage.textContent = "Aviso removido.";
                    } catch (error) {
                        noticeMessage.textContent = `Não foi possível remover o aviso: ${error.message}`;
                    }
                });
                card.append(removeButton);
            }

            noticeList.append(card);
        });
}

function renderReservations(reservations) {
    reservationsList.replaceChildren();
    if (reservations.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-notices";
        emptyMessage.textContent = "Ainda não há reservas.";
        reservationsList.append(emptyMessage);
        return;
    }

    reservations.forEach((reservation) => {
        const card = document.createElement("article");
        card.className = "admin-reservation-card";

        const apartment = document.createElement("strong");
        apartment.textContent = `Apartamento ${reservation.apartment_number}`;

        const event = document.createElement("span");
        const date = new Date(`${reservation.event_date.slice(0, 10)}T00:00:00`);
        const formattedDate = date.toLocaleDateString("pt-BR");
        const formattedTime = reservation.event_time.slice(0, 5);
        event.textContent = `${formattedDate} às ${formattedTime}`;

        const created = document.createElement("small");
        created.textContent = `Solicitada em ${new Date(reservation.requested_at).toLocaleString("pt-BR")}`;

        card.append(apartment, event, created);
        reservationsList.append(card);
    });
}

async function loadAllReservations() {
    adminReservationsMessage.textContent = "";
    try {
        const response = await fetch(`${apiBaseUrl}/api/reservations`, {
            headers: { Authorization: syndicAuthorization }
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Não foi possível carregar as reservas.");
        }
        renderReservations(result.reservations);
    } catch (error) {
        adminReservationsMessage.textContent = error instanceof TypeError
            ? "Não foi possível conectar à API. Verifique se o backend está em execução."
            : error.message;
        adminReservationsMessage.className = "admin-reservations-message is-error";
    }
}

function openNoticeBoard(role, displayName) {
    let notices;
    try {
        notices = loadNotices();
    } catch (error) {
        message.textContent = `Não foi possível carregar os avisos: ${error.message}`;
        message.className = "form-message is-error";
        return;
    }

    currentRole = role;
    accountName.textContent = displayName;
    showNoticeFormButton.hidden = role !== "sindico";
    noticeForm.hidden = true;
    reservationSection.hidden = role !== "morador";
    adminReservationsSection.hidden = role !== "sindico";
    noticeMessage.textContent = "";
    reservationMessage.textContent = "";
    renderNotices(notices);
    loginPage.hidden = true;
    noticePage.hidden = false;
    if (role === "sindico") {
        loadAllReservations();
    }
}

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
eventDateInput.min = today.toISOString().slice(0, 10);

roleOptions.forEach((option) => {
    option.addEventListener("click", () => {
        selectedRole = option.dataset.role;
        const content = roleContent[selectedRole];

        roleOptions.forEach((roleOption) => {
            const isSelected = roleOption === option;
            roleOption.classList.toggle("is-active", isSelected);
            roleOption.setAttribute("aria-pressed", String(isSelected));
        });

        title.textContent = content.title;
        description.textContent = content.description;
        submitButton.textContent = content.button;
        footer.textContent = content.footer;
        residentBlockField.hidden = selectedRole !== "morador";
        blockInput.required = selectedRole === "morador";
        passwordToggle.hidden = false;
        passwordInput.type = "password";
        passwordToggle.textContent = "Ver senha";
        passwordToggle.setAttribute("aria-pressed", "false");
        message.textContent = "";
        message.className = "form-message";
    });
});

passwordToggle.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    passwordToggle.textContent = isVisible ? "Ver senha" : "Ocultar senha";
    passwordToggle.setAttribute("aria-pressed", String(!isVisible));
});

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = form.elements.email.value.trim().toLowerCase();
    const password = form.elements.password.value;

    if (selectedRole === "sindico") {
        if (email === "sindico@gmail.com" && password === "12345") {
            syndicAuthorization = `Basic ${btoa(`${email}:${password}`)}`;
            openNoticeBoard("sindico", "Síndico");
        } else {
            message.textContent = "E-mail ou senha incorretos. Confira seus dados e tente novamente.";
            message.className = "form-message is-error";
        }
        return;
    }

    openNoticeBoard("morador", `${email} · Bloco ${blockInput.value.trim()}`);
});

showNoticeFormButton.addEventListener("click", () => {
    if (currentRole === "sindico") {
        noticeForm.hidden = false;
        document.querySelector("#notice-heading-input").focus();
    }
});

cancelNoticeButton.addEventListener("click", () => {
    noticeForm.reset();
    noticeForm.hidden = true;
    noticeMessage.textContent = "";
});

noticeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (currentRole !== "sindico") return;

    try {
        const notices = loadNotices();
        notices.push({
            title: noticeForm.elements.title.value.trim(),
            category: noticeForm.elements.category.value,
            body: noticeForm.elements.body.value.trim(),
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(noticeStorageKey, JSON.stringify(notices));
        renderNotices(notices);
        noticeForm.reset();
        noticeForm.hidden = true;
        noticeMessage.textContent = "Aviso publicado com sucesso.";
    } catch (error) {
        noticeMessage.textContent = `Não foi possível publicar o aviso: ${error.message}`;
    }
});

reservationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    reservationMessage.textContent = "";
    reservationSubmitButton.disabled = true;

    try {
        const response = await fetch(`${apiBaseUrl}/api/reservations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                apartmentNumber: reservationForm.elements.apartmentNumber.value.trim(),
                eventDate: reservationForm.elements.eventDate.value,
                eventTime: reservationForm.elements.eventTime.value
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Não foi possível registrar a reserva.");
        }

        reservationMessage.textContent = `${result.message} Número da solicitação: ${result.reservation.id}.`;
        reservationMessage.className = "reservation-message is-success";
        reservationForm.reset();
        eventDateInput.min = today.toISOString().slice(0, 10);
    } catch (error) {
        const errorMessage = error instanceof TypeError
            ? "Não foi possível conectar à API. Inicie o backend na pasta back com npm start e tente novamente."
            : error.message;
        reservationMessage.textContent = `Não foi possível registrar a reserva: ${errorMessage}`;
        reservationMessage.className = "reservation-message is-error";
    } finally {
        reservationSubmitButton.disabled = false;
    }
});

logoutButton.addEventListener("click", () => {
    currentRole = null;
    syndicAuthorization = null;
    noticePage.hidden = true;
    loginPage.hidden = false;
    form.reset();
    reservationForm.reset();
    message.textContent = "";
    message.className = "form-message";
});
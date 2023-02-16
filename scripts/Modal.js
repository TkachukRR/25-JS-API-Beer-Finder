export class Modal {
  constructor(innerMarkup) {
    this.addToPageEnd(innerMarkup);
  }

  makeMarkup(innerMarkup = "") {
    return `
        <div class="backdrop hidden">
          <div class="modal">
          <button class="modal__close"></button>
          <div class="modal__content">
          ${innerMarkup}
          </div>
          </div>
        </div>
          `;
  }

  addToPageEnd(innerMarkup) {
    const modal = this.makeMarkup(innerMarkup);
    document.querySelector("body").insertAdjacentHTML("beforeend", modal);
  }

  show() {
    const page = document.querySelector("body");
    const modal = document.querySelector(".modal");
    const closeBtn = document.querySelector(".modal__close");

    page.style.overflow = "hidden";
    modal.parentNode.classList.remove("hidden");
    closeBtn.addEventListener("click", this.hide.bind(this));
  }

  hide() {
    const page = document.querySelector("body");
    const modal = document.querySelector(".modal");
    const closeBtn = document.querySelector(".modal__close");

    page.style.overflow = "auto";
    modal.parentNode.classList.add("hidden");
    closeBtn.removeEventListener("click", this.hide.bind(this));
  }

  setContent(content) {
    const modalContent = document.querySelector(".modal__content");
    modalContent.innerHTML = content;
  }
}

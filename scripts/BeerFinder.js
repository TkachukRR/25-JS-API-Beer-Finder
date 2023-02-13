import { APP_NAME, HEADER_BTN_FAVOURITES } from "./constants.js";

export class BeerFinder {
  #appTag;

  constructor() {
    this.#appTag = document.querySelector("#beerFinder");

    this.renderHeader();
  }

  renderHeader() {
    const headeMarkup = this.makeHeaderMarkup();

    this.#appTag.insertAdjacentHTML("beforeend", headeMarkup);
  }

  makeHeaderMarkup() {
    return `
    <header class="header">
        ${this.makeHeaderTitle()}
        ${this.makeButton(HEADER_BTN_FAVOURITES)}
    </header>
    `;
  }

  makeHeaderTitle() {
    return `<h1 class="header__title">${APP_NAME.toUpperCase()}</h1>`;
  }

  makeButton(btnName) {
    return `<button type="button" class="btn button__${btnName.toLowerCase()}">${btnName}</button>`;
  }
}

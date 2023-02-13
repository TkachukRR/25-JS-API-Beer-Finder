import { APP_NAME } from "./constants.js";

export class BeerFinder {
  #appTag;

  constructor() {
    this.#appTag = document.querySelector("#beerFinder");

    this.renderHeader();
  }

  renderHeader() {
    const headeMarkup = this.makeHeadeMarkup();

    this.#appTag.insertAdjacentHTML("beforeend", headeMarkup);
  }

  makeHeadeMarkup() {
    return `
    <header class="header">
        ${this.makeHeaderTitle()}
    </header>
    `;
  }

  makeHeaderTitle() {
    return `<h1 class="header__title">${APP_NAME}</h1>`;
  }
}

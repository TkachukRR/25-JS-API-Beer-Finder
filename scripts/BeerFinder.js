import {
  APP_NAME,
  HEADER_BTN_FAVOURITES,
  SEARCH_FORM_ICON,
  SEARCH_FORM_PLACEHOLDER,
} from "./constants.js";

export class BeerFinder {
  #appTag;
  #lastSearches = [];

  constructor() {
    this.#appTag = document.querySelector("#beerFinder");

    this.renderHeader();
    this.addSerachFormListeners();
  }

  renderHeader() {
    const headeMarkup = this.makeHeaderMarkup();

    this.#appTag.insertAdjacentHTML("beforeend", headeMarkup);
  }

  makeHeaderMarkup() {
    return `
    <header class="header">
        ${this.makeHeaderTitleMarkup()}
        ${this.makeButtonMarkup(HEADER_BTN_FAVOURITES)}
        ${this.makeSearcFormhMarkup()}
    </header>
    `;
  }

  makeHeaderTitleMarkup() {
    return `<h1 class="header__title">${APP_NAME.toUpperCase()}</h1>`;
  }

  makeButtonMarkup(btnName) {
    return `<button type="button" class="btn button__${btnName.toLowerCase()}">${btnName}</button>`;
  }

  makeSearcFormhMarkup() {
    return `
     <form class="search">
        <label class="search__lable">
            <input type="text" name="search" class="search__input" placeholder="${SEARCH_FORM_PLACEHOLDER}"/>
        </label>
        <button type="submit" class="search__button" >${SEARCH_FORM_ICON}</button>
        <ul class="search__list">
            ${this.makeListItemsMarkupFromArray(this.#lastSearches)}
        </ul>
    </form>
    `;
  }

  makeListItemsMarkupFromArray(array) {
    return array.map((item) => `<li>${item}</li>`).join("");
  }

  addSerachFormListeners() {
    const searchForm = this.#appTag.querySelector(".search");

    searchForm.addEventListener("input", this.onInputChange.bind(this));
    searchForm.addEventListener("click", this.onSerchButton.bind(this));
  }

  onInputChange(event) {
    if (event.target.nodeName !== "INPUT") return;
  }

  onSerchButton(event) {
    if (event.target.nodeName !== "BUTTON") return;
    event.preventDefault();
  }
}

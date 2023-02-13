import {
  APP_NAME,
  HEADER_BTN_FAVOURITES,
  SERCH_FORM_ICON,
  SERCH_FORM_PLACEHOLDER,
} from "./constants.js";

export class BeerFinder {
  #appTag;
  #lastSearches = [];

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
            <input type="text" name="search" class="search__input" placeholder="${SERCH_FORM_PLACEHOLDER}"/>
        </label>
        <button type="submit" class="search__button" >${SERCH_FORM_ICON}</button>
        <ul class="search__list">
            ${this.makeListItemsMarkupFromArray(this.#lastSearches)}
        </ul>
    </form>
    `;
  }

  makeListItemsMarkupFromArray(array) {
    return array.map((item) => `<li>${item}</li>`).join("");
  }
}

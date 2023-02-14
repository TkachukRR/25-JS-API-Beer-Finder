import {
  APP_NAME,
  HEADER_BTN_FAVOURITES,
  SEARCH_FORM_ICON,
  SEARCH_FORM_PLACEHOLDER,
  SEARCH_VALID_LENGTH,
  BASE_URL,
  BASE_SEARCH_PARAM,
  ERROR_MSG,
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
    const mainTag = this.makeMainMarkup();

    this.#appTag.insertAdjacentHTML("beforeend", headeMarkup);
    this.#appTag.insertAdjacentHTML("beforeend", mainTag);
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
    const input = this.#appTag.querySelector("input.search__input");
    const isInvalid = !this.validationLength(input.value.length);
    if (isInvalid) {
      input.classList.add("bordered--red");
      return;
    }
    input.classList.remove("bordered--red");

    this.fetchData(input.value)
      .then((data) => {
        console.log(data);
        this.renderMainInnerMurkup(data);
      })
      .catch((error) => console.error(error));
  }

  onSerchButton(event) {
    if (event.target.nodeName !== "BUTTON") return;
    event.preventDefault();
    const input = this.#appTag.querySelector("input.search__input");
    const isInvalid = !this.validationLength(input.value.length);
    if (isInvalid) {
      input.classList.add("bordered--red");
      return;
    }
    input.classList.remove("bordered--red");

    this.fetchData(input.value)
      .then((data) => {
        console.log(data);
        this.renderMainInnerMurkup(data);
      })
      .catch((error) => console.error(error));
  }

  validationLength(length) {
    return length >= SEARCH_VALID_LENGTH;
  }

  fetchData(param) {
    return fetch(`${BASE_URL}/v2/beers?${BASE_SEARCH_PARAM}=${param}`).then(
      (response) => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.json();
      }
    );
  }

  makeMainMarkup(innerMarup = "") {
    return `<main class="main">${innerMarup}</main>`;
  }

  makeProductsMarkup(productItemsMarkup) {
    if (!productItemsMarkup) {
      return `<p class="error__products">${ERROR_MSG}</p>`;
    }

    return `
      <h2>Serching resault:</h2>
      <ul class="product__list">
        ${productItemsMarkup}
      </ul>`;
  }

  makeProductItemMarkup(products) {
    return products
      .map(
        (prod) => `
      <li class="product__item">
        <img class="product__image" src="${prod.image_url}" alt="${prod.name}" width="50px"/>
        <div class="product__content">
          <h3 class="product__title">${prod.name} - <span>${prod.tagline}</span></h3>
          <p class="product__brewed">First brewed: ${prod.first_brewed}</p>
          <p class="product__desc"> ${prod.description}</p>
        </div>
      </li>`
      )
      .join("");
  }

  renderMainInnerMurkup(products) {
    const mainTag = this.#appTag.querySelector(".main");

    const innerMarkup = this.makeProductsMarkup(
      this.makeProductItemMarkup(products)
    );

    mainTag.innerHTML = innerMarkup;
  }
}

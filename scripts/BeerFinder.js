import {
  APP_NAME,
  HEADER_BTN_FAVOURITES,
  SEARCH_FORM_ICON,
  SEARCH_FORM_PLACEHOLDER,
  SEARCH_VALID_LENGTH,
  BASE_URL,
  BASE_SEARCH_PARAM,
  ERROR_MSG,
  NAVI_BTN_NEXT_NAME,
  PRODUCT_PER_PAGE,
  NAVI_BTN_TOP_NAME,
} from "./constants.js";

export class BeerFinder {
  #appTag;
  #lastSearches = [];
  #pageNumber = 1;

  constructor() {
    this.#appTag = document.querySelector("#beerFinder");

    this.renderHeader();
    this.addSerachFormListeners();

    this.fetchRandomElement()
      .then((randomElement) => {
        this.renderMainInnerMarkup(randomElement, "Random products");

        this.setNaviTopBtnVisibility();
      })
      .catch((error) => console.error(error));

    this.addRendomProductItems(PRODUCT_PER_PAGE);
    this.addMainListeners();

    const debouncedSetNaviTopBtnVisibility = this.debounce(
      this.setNaviTopBtnVisibility.bind(this),
      100
    );

    document.addEventListener("scroll", debouncedSetNaviTopBtnVisibility);
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
    const onInputChangeDebounced = this.debounce(this.onInputChange, 250);

    searchForm.addEventListener("input", onInputChangeDebounced.bind(this));
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
        if (data.length) {
          this.addLastSearches(input.value);
          this.reranderSearchList();
        }
        this.renderMainInnerMarkup(data);
        this.addMainListeners(data);
        this.setNaviTopBtnVisibility();
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
        if (data.length) {
          this.addLastSearches(input.value);
          this.reranderSearchList();
        }

        this.renderMainInnerMarkup(data);
      })
      .catch((error) => console.error(error));
  }

  validationLength(length) {
    return length >= SEARCH_VALID_LENGTH;
  }

  fetchData(param) {
    return fetch(
      `${BASE_URL}/v2/beers?page=${
        this.#pageNumber
      }&per_page=${PRODUCT_PER_PAGE}&${BASE_SEARCH_PARAM}=${param}`
    ).then((response) => {
      if (!response.ok) {
        throw new Error(response.status);
      }
      return response.json();
    });
  }

  makeMainMarkup(innerMarup = "") {
    return `<main class="main">${innerMarup}</main>`;
  }

  makeProductsMarkup(productItemsMarkup, productsTitle = "") {
    if (!productItemsMarkup) {
      return `<p class="error__products">${ERROR_MSG}</p>`;
    }

    return `
      <h2 class="products__title">${
        productsTitle.length ? productsTitle : "Serching resault"
      }:</h2>
      <ul class="product__list">
        ${productItemsMarkup}
      </ul>`;
  }

  makeProductItemMarkup(products) {
    return products
      .map(
        (prod) => `
      <li class="product__item">
        <img class="product__image" src="${
          prod.image_url === null ? "./bottle.jpg" : prod.image_url
        } " alt="${prod.name}" width="50px"/>
        <div class="product__content">
          <h3 class="product__title">${prod.name} - <span>${
          prod.tagline
        }</span></h3>
          <p class="product__brewed">First brewed: ${prod.first_brewed}</p>
          <p class="product__desc"> ${prod.description}</p>
        </div>
      </li>`
      )
      .join("");
  }

  renderMainInnerMarkup(products, productsTitle) {
    const mainTag = this.#appTag.querySelector(".main");
    const innerMarkup = this.makeProductsMarkup(
      this.makeProductItemMarkup(products),
      productsTitle
    );
    mainTag.innerHTML = innerMarkup;

    if (!products.length) return;

    const navigation = this.makeNavigationMurkup();

    mainTag.insertAdjacentHTML("beforeend", navigation);
  }

  getLastSearches() {
    return this.#lastSearches;
  }

  addLastSearches(lastSearch) {
    this.#lastSearches = [...this.#lastSearches, lastSearch];
  }

  reranderSearchList() {
    const searchList = this.#appTag.querySelector(".search__list");
    const innerMarkup = this.makeListItemsMarkupFromArray(
      this.getLastSearches()
    );

    searchList.innerHTML = innerMarkup;
  }

  debounce(func, msDelay) {
    let timeout;

    return function () {
      const fnCall = () => {
        func.apply(this, arguments);
      };

      clearTimeout(timeout);

      timeout = setTimeout(fnCall, msDelay);
    };
  }

  makeNavigationMurkup() {
    return `
    <nav class="navigation">
      <button type="button" class="btn navigation__next">${NAVI_BTN_NEXT_NAME}</button>
      <button type="button" class="btn navigation__top">${NAVI_BTN_TOP_NAME}</button>
    </nav>
    `;
  }

  addMainListeners() {
    const mainTag = this.#appTag.querySelector(".main");

    mainTag.addEventListener("click", this.onNaviNextBtn.bind(this));
    mainTag.addEventListener("click", this.onNaviToptBtn.bind(this));
  }

  onNaviNextBtn(event) {
    if (!event.target.classList.contains("navigation__next")) return;

    const productListTitle =
      this.#appTag.querySelector(".products__title").textContent;

    switch (productListTitle) {
      case "Serching resault:":
        this.setPageNumber(this.getPageNumber() + 1);

        const input = this.#appTag.querySelector("input.search__input");
        this.fetchData(input.value)
          .then((data) => {
            this.addProductsItems(data);
          })
          .catch((error) => console.error(error));

      case "Random products:":
        this.addRendomProductItems(PRODUCT_PER_PAGE + 1);
    }
  }

  onNaviToptBtn(event) {
    if (!event.target.classList.contains("navigation__top")) return;
  }

  getPageNumber() {
    return this.#pageNumber;
  }

  setPageNumber(newNumber) {
    this.#pageNumber = newNumber;
  }

  addProductsItems(data) {
    const products = this.#appTag.querySelector(".product__list");
    const newItems = this.makeProductItemMarkup(data);

    products.insertAdjacentHTML("beforeend", newItems);
  }

  setNaviTopBtnVisibility() {
    const naviTopBtn = this.#appTag.querySelector(".navigation__top");
    const filstProduct = this.#appTag.querySelector(".product__item");

    this.isElemInViewport(filstProduct)
      ? naviTopBtn.classList.add("hidden")
      : naviTopBtn.classList.remove("hidden");
  }

  fetchRandomElement() {
    return fetch(`${BASE_URL}/v2/beers/random`).then((response) => {
      if (!response.ok) {
        throw new Error(response.status);
      }
      return response.json();
    });
  }

  addRendomProductItems(quantity) {
    for (let i = 1; i < quantity; i++) {
      this.fetchRandomElement()
        .then((randomElement) => {
          this.addProductsItems(randomElement);
        })
        .catch((error) => console.error(error));
    }
  }

  isElemInViewport(elem, full) {
    var box = elem.getBoundingClientRect();
    var top = box.top;
    var left = box.left;
    var bottom = box.bottom;
    var right = box.right;
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;
    var maxWidth = 0;
    var maxHeight = 0;
    if (full) {
      maxWidth = right - left;
      maxHeight = bottom - top;
    }
    return (
      Math.min(height, bottom) - Math.max(0, top) >= maxHeight &&
      Math.min(width, right) - Math.max(0, left) >= maxWidth
    );
  }
}

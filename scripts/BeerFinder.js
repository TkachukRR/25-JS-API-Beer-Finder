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
  SEARCHES_LENGTH,
} from "./constants.js";
import { Modal } from "./Modal.js";
import { getLocalStorage, setLocalStorage } from "./localStorage.js";

export class BeerFinder {
  #appTag;
  #lastSearches = [];
  #pageNumber = 1;
  #favoriteIDs = [];

  constructor() {
    this.#appTag = document.querySelector("#beerFinder");
    const isLocalStorageContainsSearches = getLocalStorage("searches");
    const isLocalStorageContainsFavoriteIDs = getLocalStorage("favoriteIDs");
    const setFromLocalStorageSearches = () =>
      this.setLastSearches(getLocalStorage("searches"));
    const setFromLocalStorageFavouriteIDs = () =>
      this.setFavouriteIDs(getLocalStorage("favoriteIDs"));

    if (isLocalStorageContainsSearches) {
      setFromLocalStorageSearches();
    }

    if (isLocalStorageContainsFavoriteIDs) {
      setFromLocalStorageFavouriteIDs();
    }

    this.renderApp();
    this.addHeaderListeners();

    this.fetchRandomElement()
      .then((randomElement) => {
        this.renderMainInnerMarkup(randomElement, "Random products:");

        this.controlNaviTopBtnVisibility();
      })
      .catch((error) => console.error(error));

    this.addRandomProductItems(PRODUCT_PER_PAGE);
    this.addMainListeners();

    const debouncedSetNaviTopBtnVisibility = this.debounce(
      this.controlNaviTopBtnVisibility.bind(this),
      100
    );

    document.addEventListener("scroll", debouncedSetNaviTopBtnVisibility);
  }

  renderApp() {
    const headerMarkup = this.makeHeaderMarkup();
    const mainMarkup = this.makeMainMarkup();

    this.#appTag.insertAdjacentHTML("beforeend", headerMarkup);
    this.#appTag.insertAdjacentHTML("beforeend", mainMarkup);
  }

  makeHeaderMarkup() {
    return `
    <header class="header">
        ${this.makeHeaderTitleMarkup()}
        ${this.makeSearchFormMarkup()}
        ${this.makeFavouritesButtonMarkup(HEADER_BTN_FAVOURITES)}
    </header>
    `;
  }

  makeHeaderTitleMarkup() {
    return `<h1 class="header__title">${APP_NAME.toUpperCase()}</h1>`;
  }

  makeFavouritesButtonMarkup(btnName) {
    return `
      <button type="button" class="btn button__favourites">
        Favourites
        <span class="quantity">${this.getFavouritesQuantity()}</span>
      </button>`;
  }

  makeSearchFormMarkup() {
    const searchesMarkup = this.makeListItemsMarkupFromArray(
      this.getLastSearches()
    );
    return `
    <div>
     <form class="search">
        <label class="search__label">
            <input type="text" name="search" class="search__input" placeholder="${SEARCH_FORM_PLACEHOLDER}"/>
        </label>
        <button type="submit" class="search__button" >${SEARCH_FORM_ICON}</button>
      </form>
      <ul class="searches">
          ${searchesMarkup}
      </ul>
    </div>
    `;
  }

  makeListItemsMarkupFromArray(array) {
    return array
      .map(
        (item) => `
      <li class="searches__item">
        <button type="button" class="btn searches__button">${item}</button>
      </li>`
      )
      .join("");
  }

  addHeaderListeners() {
    const searchForm = this.#appTag.querySelector(".search");
    const onInputChangeDebounced = this.debounce(this.onInputChange, 250);
    const searches = this.#appTag.querySelector(".searches");
    const favouritesBtn = this.#appTag.querySelector(".button__favourites");

    searchForm.addEventListener("input", onInputChangeDebounced.bind(this));
    searchForm.addEventListener("click", this.onSearchButton.bind(this));
    searches.addEventListener("click", this.onSearchesButton.bind(this));
    favouritesBtn.addEventListener("click", this.onFavouritesBtn.bind(this));
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
        this.renderMainInnerMarkup(data);
        if (!data.length) {
          return;
        }

        this.addLastSearches(input.value);
        setLocalStorage("searches", this.getLastSearches());
        this.rerenderSearchList();
        this.controlNaviTopBtnVisibility();
      })
      .catch((error) => console.error(error));
    this.controlNaviNextBtnVisibility(input.value);
  }

  onSearchButton(event) {
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
        this.renderMainInnerMarkup(data);

        if (!data.length) {
          return;
        }

        this.addLastSearches(input.value);
        setLocalStorage("searches", this.getLastSearches());
        this.rerenderSearchList();
        this.controlNaviTopBtnVisibility();
      })
      .catch((error) => console.error(error));
    this.controlNaviNextBtnVisibility(input.value);
  }

  validationLength(length) {
    return length >= SEARCH_VALID_LENGTH;
  }

  fetchData(param, pageNumber = this.#pageNumber) {
    return fetch(
      `${BASE_URL}/v2/beers?page=${pageNumber}&per_page=${PRODUCT_PER_PAGE}&${BASE_SEARCH_PARAM}=${param}`
    ).then((response) => {
      if (!response.ok) {
        throw new Error(response.status);
      }
      return response.json();
    });
  }

  makeMainMarkup(innerMarkup = "") {
    return `<main class="main">${innerMarkup}</main>`;
  }

  makeProductsMarkup(productItemsMarkup, productsTitle = "") {
    if (!productItemsMarkup) {
      return `<p class="error__products">${ERROR_MSG}</p>`;
    }

    return `
      <h2 class="products__title">${
        productsTitle.length ? productsTitle : "Searching result:"
      }</h2>
      <ul class="product__list">
        ${productItemsMarkup}
      </ul>`;
  }

  makeProductItemMarkup(products) {
    const hasImageUrl = (prod) => prod.image_url === null;

    return products
      .map(
        (prod) => `
      <li class="product__item">
        <img class="product__image" src="${
          hasImageUrl(prod) ? "./bottle.png" : prod.image_url
        } " alt="${prod.name}" width="50px"/>
        <div class="product__content">
          <h3 class="product__title">
            ${prod.name} 
            - 
            <span class="product__tagline">${prod.tagline}</span>
          </h3>
          <p class="product__brewed">First brewed: ${prod.first_brewed}</p>
          <p class="product__desc"> ${prod.description}</p>
          ${this.makeAddOrRemoveBtn(prod.id)}
        </div>
      </li>`
      )
      .join("");
  }

  makeAddOrRemoveBtn(id) {
    return `<button type="button" class="btn ${
      this.checkProductOnFavourites(id)
        ? "product__button--red"
        : "product__button"
    }" data-id='${id}'>
    ${this.checkProductOnFavourites(id) ? "Remove" : "Add"}
    </button>`;
  }

  renderMainInnerMarkup(products, productsTitle) {
    const mainTag = this.#appTag.querySelector(".main");
    const innerMarkup = this.makeProductsMarkup(
      this.makeProductItemMarkup(products),
      productsTitle
    );
    mainTag.innerHTML = innerMarkup;

    if (!products.length) return;

    const navigation = this.makeNavigationMarkup();

    mainTag.insertAdjacentHTML("beforeend", navigation);
  }

  getLastSearches() {
    return this.#lastSearches;
  }

  addLastSearches(lastSearch) {
    const processedLastSearch = lastSearch.trim().toLowerCase();

    let filteredArray = [];
    filteredArray = this.getLastSearches().filter(
      (elem) => elem !== processedLastSearch
    );
    this.#lastSearches = [...filteredArray, processedLastSearch];
  }

  rerenderSearchList() {
    const searchList = this.#appTag.querySelector(".searches");
    const searchesLength = this.getLastSearches().length;
    const searches = this.getLastSearches();
    const isLengthMoreThanConst = searchesLength > SEARCHES_LENGTH;

    if (isLengthMoreThanConst) {
      const slicedSearches = this.getLastSearches().slice(
        searchesLength - SEARCHES_LENGTH,
        searchesLength
      );

      searchList.innerHTML = this.makeListItemsMarkupFromArray(slicedSearches);
      return;
    }

    searchList.innerHTML = this.makeListItemsMarkupFromArray(searches);
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

  makeNavigationMarkup() {
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
    mainTag.addEventListener("click", this.onNaviTopBtn.bind(this));
    mainTag.addEventListener(
      "click",
      this.onAddOrRemoveToFavouritesBtn.bind(this)
    );
    mainTag.addEventListener("click", this.onProductCard.bind(this));
  }

  onNaviNextBtn(event) {
    if (!event.target.classList.contains("navigation__next")) return;

    const productListTitle =
      this.#appTag.querySelector(".products__title").textContent;

    switch (productListTitle) {
      case "Searching result:":
        const nextPageNumber = this.getPageNumber() + 1;
        const input = this.#appTag.querySelector("input.search__input");

        this.setPageNumber(nextPageNumber);
        this.fetchData(input.value)
          .then((data) => {
            this.addProductsItems(data);
          })
          .catch((error) => console.error(error));

        this.controlNaviNextBtnVisibility(input.value);
        break;

      case "Random products:":
        this.addRandomProductItems(PRODUCT_PER_PAGE + 1);
        break;
    }
  }

  onNaviTopBtn(event) {
    if (!event.target.classList.contains("navigation__top")) return;
    const firstProduct = this.#appTag.querySelector(".product__item");

    this.scrollToElement(firstProduct);
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

  controlNaviTopBtnVisibility() {
    const naviTopBtn = this.#appTag.querySelector(".navigation__top");
    const firstProduct = this.#appTag.querySelector(".product__item");

    this.isElemInViewport(firstProduct, true)
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

  addRandomProductItems(quantity) {
    for (let i = 1; i < quantity; i++) {
      this.fetchRandomElement()
        .then((randomElement) => {
          this.addProductsItems(randomElement);
        })
        .catch((error) => console.error(error));
    }
  }

  isElemInViewport(elem, full) {
    const box = elem.getBoundingClientRect();
    const top = box.top;
    const left = box.left;
    const bottom = box.bottom;
    const right = box.right;
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    let maxWidth = 0;
    let maxHeight = 0;
    if (full) {
      maxWidth = right - left;
      maxHeight = bottom - top;
    }
    return (
      Math.min(height, bottom) - Math.max(0, top) >= maxHeight &&
      Math.min(width, right) - Math.max(0, left) >= maxWidth
    );
  }

  controlNaviNextBtnVisibility(searchParam) {
    const nextPage = this.#pageNumber + 1;
    this.fetchData(searchParam, nextPage)
      .then((data) => {
        const isNextProducts = data.length !== 0;
        const loadMoreBtn = this.#appTag.querySelector(".navigation__next");
        const hideLoadMore = () =>
          this.#appTag
            .querySelector(".navigation__next")
            .classList.add("hidden");

        if (!isNextProducts) {
          hideLoadMore();
        }
      })
      .catch((error) => console.error(error));
  }

  scrollToElement(element) {
    element.scrollIntoView();
  }

  onSearchesButton(event) {
    if (event.target.nodeName !== "BUTTON") return;

    const input = this.#appTag.querySelector(".search__input");

    input.value = event.target.textContent;

    this.fetchData(input.value)
      .then((data) => {
        this.renderMainInnerMarkup(data);
        if (!data.length) {
          return;
        }

        this.addLastSearches(input.value);
        this.rerenderSearchList();
        this.controlNaviTopBtnVisibility();
      })
      .catch((error) => console.error(error));
    this.controlNaviNextBtnVisibility(input.value);
  }

  onAddOrRemoveToFavouritesBtn(event) {
    const isAddBtn = "Add";
    const isRemoveBtn = "Remove";

    switch (event.target.textContent.trim()) {
      case isAddBtn:
        this.onAddBtn(event);
        break;

      case isRemoveBtn:
        this.onRemoveBtn(event);
        break;
    }
  }

  onAddBtn(event) {
    const isButton = event.target.nodeName === "BUTTON";
    const isRemove = event.target.textContent === "Add";
    if (!isButton && !isRemove) {
      return;
    }

    this.addToFavouriteIDs(event.target.dataset.id);
    setLocalStorage("favoriteIDs", this.getFavouriteIDs());
    this.setNewQuantityOnFavouritesBtn();
    this.changeBtnStatus();
  }

  onRemoveBtn(event) {
    const isButton = event.target.nodeName === "BUTTON";
    const isRemove = event.target.textContent === "Remove";
    if (!isButton && !isRemove) {
      return;
    }

    this.removeFromFavouriteIDs(event.target.dataset.id);
    setLocalStorage("favoriteIDs", this.getFavouriteIDs());
    this.setNewQuantityOnFavouritesBtn();
    this.changeBtnStatus();
  }

  switchToAddBtn(element = event.target) {
    element.classList.replace("product__button--red", "product__button");
    element.textContent = "Add";
  }

  switchToRemoveBtn(element = event.target) {
    element.classList.replace("product__button", "product__button--red");
    element.textContent = "Remove";
  }

  getFavouriteIDs() {
    return this.#favoriteIDs;
  }

  addToFavouriteIDs(newID) {
    this.#favoriteIDs = [...this.#favoriteIDs, newID];
  }

  removeFromFavouriteIDs(ID) {
    if (this.#favoriteIDs.includes(ID) === -1) return;
    const index = this.#favoriteIDs.indexOf(ID);

    this.#favoriteIDs = [
      ...this.#favoriteIDs.slice(0, index),
      ...this.#favoriteIDs.slice(index + 1),
    ];
  }

  getFavouritesQuantity() {
    return this.getFavouriteIDs().length;
  }

  setNewQuantityOnFavouritesBtn() {
    const favouritesQuantity = this.#appTag.querySelector(
      ".button__favourites"
    ).firstElementChild;
    favouritesQuantity.textContent = this.getFavouritesQuantity();
  }

  setFavouriteIDs(IDs) {
    this.#favoriteIDs = [...IDs];
  }

  onFavouritesBtn() {
    if (!this.getFavouriteIDs().length) return;

    const modalWindow = new Modal();
    modalWindow.show();

    const ids = this.getFavouriteIDs().join("|");

    this.fetchIDs(ids)
      .then((data) => {
        const showModalWithFavourites = () =>
          modalWindow.setContent(this.makeFavouritesMarkup(data));

        showModalWithFavourites();

        const favourites = document.querySelector(".favourites__list");
        const modalClose = document.querySelector(".modal__close");
        const backdrop = document.querySelector(".backdrop");

        favourites.addEventListener(
          "click",
          this.onFavouritesRemoveBtn.bind(this)
        );
        modalClose.addEventListener("click", this.onModalClose);
        backdrop.addEventListener("click", this.onModalActiveBackdrop);
      })
      .catch((error) => console.error(error));
  }

  fetchIDs(ids) {
    return fetch(`https://api.punkapi.com/v2/beers?ids=${ids}`).then(
      (response) => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.json();
      }
    );
  }

  makeFavouritesMarkup(array) {
    const items = array
      .map(
        (elem) => `<li class="favourites__item">
      <h3 class="favourites__name" data-id="${elem.id}">${elem.name}</h3>
      ${this.makeAddOrRemoveBtn(elem.id)}
      </li>`
      )
      .join("");
    return `
    <h2 class="favourites__title">favourites</h2>
    <ul class="favourites__list">${items}</ul>`;
  }

  onFavouritesRemoveBtn(event) {
    const currentID = event.target.dataset.id;
    this.changeBtnStatus(currentID);
    this.onRemoveBtn(event);
    event.target.parentNode.remove();
  }

  onProductCard(event) {
    const onAddRemoveBtnClick = event.target.hasAttribute("data-id");

    if (
      onAddRemoveBtnClick ||
      event.target.classList.contains("product__list") ||
      event.target.classList.contains("navigation") ||
      event.target.classList.contains("navigation__next")
    )
      return;

    const productID = this.getProductCardId(event);

    const modalWindow = new Modal();
    modalWindow.show();

    this.fetchIDs(productID)
      .then((data) => {
        const showModalWithSingleProduct = () =>
          modalWindow.setContent(this.makeProductCardMarkup(...data));

        showModalWithSingleProduct();
        const modalClose = document.querySelector(".modal__close");
        const backdrop = document.querySelector(".backdrop");
        const singleProduct = document.querySelector(".sproduct__content");
        const addRemoveBtn = singleProduct.querySelector(
          '[class*="product__button"]'
        );

        modalClose.addEventListener("click", this.onModalClose);
        document.addEventListener("keydown", this.onModalActiveEscape);
        backdrop.addEventListener("click", this.onModalActiveBackdrop);
        addRemoveBtn.addEventListener(
          "click",
          this.onSingleProductAddRemoveBtn.bind(this)
        );
      })
      .catch((error) => console.error(error));
  }

  getProductCardId(event) {
    if (event.target.classList.contains("product__tagline")) {
      return event.target.parentNode.parentNode.querySelector(
        '[class*="product__button"]'
      ).dataset.id;
    }

    if (event.target.classList.contains("product__item")) {
      return event.target.querySelector('[class*="product__button"]').dataset
        .id;
    }

    if (
      !event.target.classList.contains("product__item") &&
      !event.target.classList.contains("product__tagline")
    ) {
      return event.target.parentNode.querySelector('[class*="product__button"]')
        .dataset.id;
    }
  }

  makeProductCardMarkup(prod) {
    return `
    <div class="card">
      <h2 class="card__title">Product Information:</h2>
      <div class="sproduct">
        <img class="sproduct__image" src="${
          prod.image_url === null ? "./bottle.png" : prod.image_url
        } " alt="${prod.name}" width="50px"/>
        <div class="sproduct__content">
          <h3 class="sproduct__title">
            ${prod.name} 
            - 
            <span class="sproduct__tagline">${prod.tagline}</span>
          </h3>
          <p class="sproduct__brewed">First brewed: ${prod.first_brewed}</p>
          <p class="sproduct__abv">Alcohol by volume: ${prod.abv}%</p>
          <div class="sproduct__pairing">
            <p>Food pairing:</p> 
            <ul>
            ${prod.food_pairing.map((elem) => `<li>${elem}</li>`).join("")}
            </ul>
          </div>
          <p class="sproduct__desc"> ${prod.description}</p>
          ${this.makeAddOrRemoveBtn(prod.id)}
        </div>
      </div>
      </div>
    `;
  }

  onModalClose() {
    document.querySelector(".backdrop").remove();
  }

  onModalActiveEscape(event) {
    if (!document.querySelector(".modal")) return;
    if (event.code !== "Escape") return;
    document.querySelector(".backdrop").remove();
  }

  onModalActiveBackdrop(event) {
    if (event.currentTarget !== event.target) return;
    document.querySelector(".backdrop").remove();
  }

  onSingleProductAddRemoveBtn(event) {
    const productID = event.target.dataset.id;

    this.onAddOrRemoveToFavouritesBtn(event);
    this.changeBtnStatus(productID);
  }

  setLastSearches(array) {
    this.#lastSearches = [...array];
  }

  changeBtnStatus(ID = event.target.dataset.id) {
    const buttonsWithID = this.#appTag.querySelectorAll(
      `button[data-id='${ID}']`
    );
    const isIDinFavourites = this.checkProductOnFavourites(ID);

    if (!buttonsWithID) {
      return;
    }

    buttonsWithID.forEach((button) =>
      isIDinFavourites
        ? this.switchToRemoveBtn(button)
        : this.switchToAddBtn(button)
    );
  }

  checkProductOnFavourites(ID) {
    return this.getFavouriteIDs().includes(ID.toString());
  }
}

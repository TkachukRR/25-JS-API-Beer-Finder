const setLocalStorage = (key, value) => {
  try {
    const serializedState = JSON.stringify(value);
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.error(error);
  }
};

const getLocalStorage = (key) => {
  try {
    const serializedState = localStorage.getItem(key);
    return serializedState === null ? undefined : JSON.parse(serializedState);
  } catch (error) {
    console.error(error);
  }
};

const deleteLocalStorageItem = (key, value) => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return undefined;
    }
    const array = JSON.parse(serializedState);
    const index = array.indexOf(value);

    if (index === -1) {
      return;
    }

    const updatedArray = [...array.slice(0, index), ...array.slice(index + 1)];

    localStorage.setItem(key, JSON.stringify(updatedArray));
  } catch (error) {
    console.error(error);
  }
};

export default {
  setLocalStorage,
  getLocalStorage,
  deleteLocalStorageItem,
};

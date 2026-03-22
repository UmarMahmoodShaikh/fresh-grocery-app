import { Product } from "../context/FavoritesContext";

function addFavorite(favorites: Product[], product: Product): Product[] {
  if (favorites.find((f) => f.id === product.id)) return favorites;
  return [...favorites, product];
}

function removeFavorite(favorites: Product[], id: number | string): Product[] {
  return favorites.filter((f) => f.id !== id);
}

function isFavorite(favorites: Product[], id: number | string): boolean {
  return favorites.some((f) => f.id === id);
}

function toggleFavorite(favorites: Product[], product: Product): Product[] {
  return isFavorite(favorites, product.id)
    ? removeFavorite(favorites, product.id)
    : addFavorite(favorites, product);
}

// ─── Test data ────────────────────────────────────────────────────────────────

const apple: Product = { id: 1, name: "Apple", price: 1.5 };
const banana: Product = { id: 2, name: "Banana", price: 0.8 };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Favorites — addFavorite()", () => {
  it("adds a product to an empty list", () => {
    const result = addFavorite([], apple);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple");
  });

  it("does not add duplicate products", () => {
    let favs = addFavorite([], apple);
    favs = addFavorite(favs, apple);
    expect(favs).toHaveLength(1);
  });

  it("can hold multiple different products", () => {
    let favs = addFavorite([], apple);
    favs = addFavorite(favs, banana);
    expect(favs).toHaveLength(2);
  });
});

describe("Favorites — removeFavorite()", () => {
  it("removes the correct product by id", () => {
    let favs = addFavorite([], apple);
    favs = addFavorite(favs, banana);
    favs = removeFavorite(favs, 1);
    expect(favs).toHaveLength(1);
    expect(favs[0].id).toBe(2);
  });

  it("returns the same list if id is not found", () => {
    const favs = addFavorite([], apple);
    expect(removeFavorite(favs, 99)).toHaveLength(1);
  });
});

describe("Favorites — isFavorite()", () => {
  it("returns true for a saved product", () => {
    const favs = addFavorite([], apple);
    expect(isFavorite(favs, 1)).toBe(true);
  });

  it("returns false for a non-saved product", () => {
    expect(isFavorite([], 99)).toBe(false);
  });
});

describe("Favorites — toggleFavorite()", () => {
  it("adds product if not yet saved", () => {
    const result = toggleFavorite([], apple);
    expect(result).toHaveLength(1);
    expect(isFavorite(result, 1)).toBe(true);
  });

  it("removes product if already saved", () => {
    let favs = addFavorite([], apple);
    favs = toggleFavorite(favs, apple);
    expect(favs).toHaveLength(0);
    expect(isFavorite(favs, 1)).toBe(false);
  });

  it("toggling twice restores original state", () => {
    let favs: Product[] = [];
    favs = toggleFavorite(favs, apple); // add
    favs = toggleFavorite(favs, apple); // remove
    expect(favs).toHaveLength(0);
  });
});

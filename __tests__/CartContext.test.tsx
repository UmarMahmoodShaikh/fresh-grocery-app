import { CartItem } from "../context/CartContext";

function addToCart(items: CartItem[], product: any, quantity = 1): CartItem[] {
  const existing = items.find((i) => i.id === product.id);
  if (existing) {
    return items.map((i) =>
      i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
    );
  }
  return [
    ...items,
    {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      image_url: product.image_url ?? "",
    },
  ];
}

function removeFromCart(items: CartItem[], id: number): CartItem[] {
  return items.filter((i) => i.id !== id);
}

function updateQuantity(
  items: CartItem[],
  id: number,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) return removeFromCart(items, id);
  return items.map((i) => (i.id === id ? { ...i, quantity } : i));
}

function clearCart(): CartItem[] {
  return [];
}

function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

// ─── Test data ────────────────────────────────────────────────────────────────

const apple: any = { id: 1, name: "Apple", price: 1.5, image_url: "" };
const banana: any = { id: 2, name: "Banana", price: 0.8, image_url: "" };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Cart — addToCart()", () => {
  it("adds a new product to an empty cart", () => {
    const result = addToCart([], apple);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple");
    expect(result[0].quantity).toBe(1);
  });

  it("increases quantity when adding the same product again", () => {
    let items = addToCart([], apple);
    items = addToCart(items, apple);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("supports adding a custom quantity", () => {
    const result = addToCart([], apple, 4);
    expect(result[0].quantity).toBe(4);
  });

  it("adds multiple different products", () => {
    let items = addToCart([], apple);
    items = addToCart(items, banana);
    expect(items).toHaveLength(2);
  });
});

describe("Cart — removeFromCart()", () => {
  it("removes the correct product by id", () => {
    let items = addToCart([], apple);
    items = addToCart(items, banana);
    items = removeFromCart(items, 1);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(2);
  });

  it("returns the same list if id is not found", () => {
    const items = addToCart([], apple);
    const result = removeFromCart(items, 99);
    expect(result).toHaveLength(1);
  });
});

describe("Cart — updateQuantity()", () => {
  it("updates the quantity of an existing item", () => {
    let items = addToCart([], apple);
    items = updateQuantity(items, 1, 7);
    expect(items[0].quantity).toBe(7);
  });

  it("removes item when quantity is set to 0", () => {
    let items = addToCart([], apple);
    items = updateQuantity(items, 1, 0);
    expect(items).toHaveLength(0);
  });

  it("removes item when quantity is negative", () => {
    let items = addToCart([], apple);
    items = updateQuantity(items, 1, -1);
    expect(items).toHaveLength(0);
  });
});

describe("Cart — clearCart()", () => {
  it("returns an empty array", () => {
    expect(clearCart()).toEqual([]);
  });
});

describe("Cart — cartTotal()", () => {
  it("calculates total for multiple items", () => {
    let items = addToCart([], apple, 2); // 1.5 × 2 = 3.00
    items = addToCart(items, banana, 3); // 0.8 × 3 = 2.40
    expect(cartTotal(items)).toBeCloseTo(5.4);
  });

  it("returns 0 for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });
});

describe("Cart — cartCount()", () => {
  it("counts total number of items across products", () => {
    let items = addToCart([], apple, 2);
    items = addToCart(items, banana, 3);
    expect(cartCount(items)).toBe(5);
  });

  it("returns 0 for an empty cart", () => {
    expect(cartCount([])).toBe(0);
  });
});

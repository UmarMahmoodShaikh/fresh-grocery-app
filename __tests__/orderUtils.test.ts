const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string; label: string }
> = {
  pending: {
    color: "#D97706",
    bg: "#FEF3C7",
    icon: "time-outline",
    label: "Pending",
  },
  processing: {
    color: "#2563EB",
    bg: "#DBEAFE",
    icon: "refresh-outline",
    label: "Processing",
  },
  shipped: {
    color: "#7C3AED",
    bg: "#EDE9FE",
    icon: "bicycle-outline",
    label: "Shipped",
  },
  delivered: {
    color: "#059669",
    bg: "#D1FAE5",
    icon: "checkmark-circle-outline",
    label: "Delivered",
  },
  cancelled: {
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "close-circle-outline",
    label: "Cancelled",
  },
};

const statusFor = (s: string) =>
  STATUS_CONFIG[s?.toLowerCase()] ?? STATUS_CONFIG.pending;

const calcSubtotal = (items: { price: number; quantity: number }[]) =>
  items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);

// ─────────────────────────────────────────────────────────────────────────────

describe("statusFor()", () => {
  it("returns Pending config", () => {
    expect(statusFor("pending").label).toBe("Pending");
    expect(statusFor("pending").color).toBe("#D97706");
  });

  it("returns Processing config", () => {
    expect(statusFor("processing").label).toBe("Processing");
  });

  it("returns Shipped config", () => {
    expect(statusFor("shipped").label).toBe("Shipped");
    expect(statusFor("shipped").icon).toBe("bicycle-outline");
  });

  it("returns Delivered config", () => {
    expect(statusFor("delivered").label).toBe("Delivered");
    expect(statusFor("delivered").color).toBe("#059669");
  });

  it("returns Cancelled config", () => {
    expect(statusFor("cancelled").label).toBe("Cancelled");
    expect(statusFor("cancelled").color).toBe("#DC2626");
  });

  it("is case-insensitive", () => {
    expect(statusFor("PENDING").label).toBe("Pending");
    expect(statusFor("Delivered").label).toBe("Delivered");
    expect(statusFor("SHIPPED").label).toBe("Shipped");
  });

  it("falls back to Pending for unknown status", () => {
    expect(statusFor("refunded").label).toBe("Pending");
    expect(statusFor("").label).toBe("Pending");
    expect(statusFor("UNKNOWN").label).toBe("Pending");
  });
});

describe("calcSubtotal()", () => {
  it("calculates total for a single item", () => {
    expect(calcSubtotal([{ price: 2.5, quantity: 3 }])).toBeCloseTo(7.5);
  });

  it("calculates total for multiple items", () => {
    expect(
      calcSubtotal([
        { price: 1.5, quantity: 2 },
        { price: 0.8, quantity: 5 },
      ]),
    ).toBeCloseTo(7.0);
  });

  it("returns 0 for an empty order", () => {
    expect(calcSubtotal([])).toBe(0);
  });

  it("handles decimal prices correctly", () => {
    expect(calcSubtotal([{ price: 1.99, quantity: 2 }])).toBeCloseTo(3.98);
  });
});

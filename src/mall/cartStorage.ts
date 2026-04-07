import { products, type Product } from "../data/products";

export type CartLine = { product: Product; qty: number; option?: string };

const CART_KEY = "sehyeon-mall-cart";

export function cartLineKey(line: Pick<CartLine, "product" | "option">): string {
  return `${line.product.id}::${line.option ?? ""}`;
}

export function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      id: string;
      qty: number;
      option?: string;
    }[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row): CartLine | null => {
        const product = products.find((p) => p.id === row.id);
        if (!product || typeof row.qty !== "number" || row.qty < 1) return null;
        const option =
          typeof row.option === "string" && row.option.length > 0
            ? row.option
            : undefined;
        const line: CartLine = { product, qty: row.qty };
        if (option !== undefined) line.option = option;
        return line;
      })
      .filter((x): x is CartLine => x !== null);
  } catch {
    return [];
  }
}

export function saveCart(lines: CartLine[]): void {
  localStorage.setItem(
    CART_KEY,
    JSON.stringify(
      lines.map((l) => ({
        id: l.product.id,
        qty: l.qty,
        ...(l.option ? { option: l.option } : {}),
      }))
    )
  );
}

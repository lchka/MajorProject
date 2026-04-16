import api from "../config/api";

export interface ProductImageUploadFile {
  uri: string;
  name?: string;
  type?: string;
}

export interface Product {
  id: string;
  name: string;
  product_image?: string | null;
  product_image_user?: string | null;
  product_image_official?: string | null;
  brand?: string;
  ingredients?: string[] | unknown;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOfficialImagePayload {
  productId: string;
  product_image: string;
  product_image_user: string;
  product_image_official: string | null;
  source: "cached" | "serpapi" | "fallback";
}

export const productService = {
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  scanProductImage: async (file: ProductImageUploadFile): Promise<Product> => {
    const formData = new FormData();
    formData.append(
      "product_image",
      {
        uri: file.uri,
        name: file.name ?? `product-${Date.now()}.jpg`,
        type: file.type ?? "image/jpeg",
      } as unknown as Blob,
    );

    const response = await api.post(`/products/scan`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
  getOfficialImageByProductId: async (productId: string): Promise<ProductOfficialImagePayload | null> => {
    const response = await api.get<ProductOfficialImagePayload>(`/product-image`, {
      params: { productId },
      validateStatus: (status) => status === 404 || (status >= 200 && status < 300),
    });

    if (response.status === 404) {
      return null;
    }

    return response.data;
  },
};

export default productService;

import api from "../config/api";

export interface ProductImageUploadFile {
  uri: string;
  name?: string;
  type?: string;
}
// The productService module provides functions for managing products, including fetching product details by ID, scanning product images to extract information, retrieving official product images, and updating product information. Each function interacts with the backend API to perform the necessary operations and returns the relevant data or handles errors as needed.
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

export interface UpdateProductInput {
  name?: string;
  brand?: string;
  ingredients?: string[];
  category?: string;
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
  updateProduct: async (id: string, data: UpdateProductInput): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },
};

export default productService;

import api from "../config/api";

export interface Product {
  id: string;
  name: string;
  product_image?: string | null;
  brand?: string;
  ingredients?: string[] | unknown;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export const productService = {
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
};

export default productService;

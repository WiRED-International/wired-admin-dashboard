import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";

export const createCategory = async (
  name: string
): Promise<void> => {
  const response = await fetch(
    `${apiPrefix}/categories`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create category."
    );
  }
};

export const updateCategory = async (
  id: number,
  name: string
): Promise<void> => {
  const response = await fetch(
    `${apiPrefix}/categories/${id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update category."
    );
  }
};

export const deleteCategory = async (
  id: number
): Promise<void> => {
  const response = await fetch(
    `${apiPrefix}/categories/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete category."
    );
  }
};

export const createSubCategory = async (
  name: string,
  categoryId: number
): Promise<void> => {
  const response = await fetch(
    `${apiPrefix}/subCategories`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        category_id: categoryId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create subcategory."
    );
  }
};

export const updateSubCategory = async (
  id: number,
  name: string,
  categoryId: number
): Promise<void> => {
  const response = await fetch(
    `${apiPrefix}/subCategories/${id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        category_id: categoryId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update subcategory."
    );
  }
};

export const deleteSubCategory = async (
  id: number
): Promise<void> => {
  const response = await fetch(
    `${apiPrefix}/subCategories/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete subcategory."
    );
  }
};
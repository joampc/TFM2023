// ingredient-response.model.ts

export interface IngredientResponse {
  ingredientes: {
    Ingrediente: string;
    Frecuencia: number;
    Lematizado: string;
    T_Marian: string;
    selected: boolean;
    // Agrega otras propiedades si es necesario
  }[];
  }